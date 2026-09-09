import { readApiJson } from "@/lib/http/parse-json-response";
import { UploadPricingError } from "@/lib/http/public-api-error";
import { SERVERLESS_SAFE_UPLOAD_BYTES } from "@/lib/manufacturing/upload-limits";

export interface BrowserUploadConfig {
  file: File;
  rightsConfirmed: boolean;
  materialId: string;
  colorId: string;
  qualityId: string;
  infillPercent: number;
  supports: "auto" | "on" | "off";
  scalePercent: number;
  quantity: number;
  unit: string;
  manufacturingTransform: string;
  idempotencyKey: string;
  extra?: Record<string, string>;
  onProgress?: (percent: number) => void;
}

export interface BrowserUploadResult {
  jobId: string;
  existing?: boolean;
  fileId?: string;
}

function appendExtras(form: FormData, extra?: Record<string, string>) {
  if (!extra) return;
  for (const [key, value] of Object.entries(extra)) {
    form.set(key, value);
  }
}

async function postDirect(input: BrowserUploadConfig): Promise<BrowserUploadResult> {
  const form = new FormData();
  form.set("file", input.file);
  form.set("rightsConfirmed", input.rightsConfirmed ? "true" : "false");
  form.set("materialId", input.materialId);
  form.set("colorId", input.colorId);
  form.set("qualityId", input.qualityId);
  form.set("infillPercent", String(input.infillPercent));
  form.set("supports", input.supports);
  form.set("scalePercent", String(input.scalePercent));
  form.set("quantity", String(input.quantity));
  form.set("unit", input.unit);
  form.set("manufacturingTransform", input.manufacturingTransform);
  form.set("idempotencyKey", input.idempotencyKey);
  appendExtras(form, input.extra);
  input.onProgress?.(12);
  const response = await fetch("/api/manufacturing/uploads", { method: "POST", body: form });
  const payload = await readApiJson<BrowserUploadResult & { error?: string }>(response);
  input.onProgress?.(100);
  if (!payload.jobId) {
    throw new UploadPricingError("İş oluşturulamadı.", 502, "INTERNAL");
  }
  return payload;
}

async function putWithProgress(url: string, file: File, onProgress?: (percent: number) => void) {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress?.(Math.max(8, Math.min(92, Math.round((event.loaded / event.total) * 80) + 10)));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new UploadPricingError("Dosya depoya yazılamadı.", xhr.status, "UPSTREAM_UNAVAILABLE"));
    };
    xhr.onerror = () =>
      reject(new UploadPricingError("Dosya yükleme bağlantısı kesildi.", 502, "UPSTREAM_UNAVAILABLE"));
    xhr.send(file);
  });
}

async function postSigned(input: BrowserUploadConfig): Promise<BrowserUploadResult> {
  const intentResponse = await fetch("/api/manufacturing/uploads/intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: input.file.name,
      sizeBytes: input.file.size,
      mimeType: input.file.type,
    }),
  });
  const intent = await readApiJson<{
    mode?: "signed" | "direct";
    uploadUrl?: string;
    fileId?: string;
    storageKey?: string;
  }>(intentResponse);

  if (intent.mode !== "signed" || !intent.uploadUrl || !intent.fileId || !intent.storageKey) {
    return postDirect(input);
  }

  input.onProgress?.(8);
  await putWithProgress(intent.uploadUrl, input.file, input.onProgress);

  const completeResponse = await fetch("/api/manufacturing/uploads/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileId: intent.fileId,
      storageKey: intent.storageKey,
      originalFilename: input.file.name,
      mimeType: input.file.type,
      sizeBytes: input.file.size,
      rightsConfirmed: input.rightsConfirmed,
      materialId: input.materialId,
      colorId: input.colorId,
      qualityId: input.qualityId,
      infillPercent: input.infillPercent,
      supports: input.supports,
      scalePercent: input.scalePercent,
      quantity: input.quantity,
      unit: input.unit,
      manufacturingTransform: input.manufacturingTransform,
      idempotencyKey: input.idempotencyKey,
      extra: input.extra,
    }),
  });
  const payload = await readApiJson<BrowserUploadResult>(completeResponse);
  input.onProgress?.(100);
  if (!payload.jobId) {
    throw new UploadPricingError("İş oluşturulamadı.", 502, "INTERNAL");
  }
  return payload;
}

export async function submitManufacturingUpload(
  input: BrowserUploadConfig,
): Promise<BrowserUploadResult> {
  if (input.file.size <= SERVERLESS_SAFE_UPLOAD_BYTES) {
    return postDirect(input);
  }
  return postSigned(input);
}
