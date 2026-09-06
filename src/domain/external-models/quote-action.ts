import type { ExternalModelSummary } from "@/providers/contracts";

export type ExternalQuoteAction = "quote" | "verify" | "inspect";

const BLOCKED_LICENSE_CODES = new Set(["cc_by_nc", "cc_by_sa", "cc_by_nd"]);

function licenseCodeOf(model: Pick<ExternalModelSummary, "licenseCode">) {
  return model.licenseCode?.trim() || null;
}

export function resolveExternalQuoteAction(
  model: Pick<
    ExternalModelSummary,
    | "pricingAllowed"
    | "automaticManufacturingAllowed"
    | "permissionStatus"
    | "licenseCode"
    | "fileCount"
  >,
  options?: { printableFilesVerified?: boolean },
): ExternalQuoteAction {
  const code = licenseCodeOf(model);
  if (code && BLOCKED_LICENSE_CODES.has(code)) {
    return "inspect";
  }
  if (model.permissionStatus === "rejected" || model.permissionStatus === "revoked") {
    return "inspect";
  }

  const filesVerified = options?.printableFilesVerified === true;
  if (filesVerified && typeof model.fileCount === "number" && model.fileCount === 0) {
    return "inspect";
  }

  const filesConfirmed =
    filesVerified && typeof model.fileCount === "number" && model.fileCount > 0;
  const licenseAllowsQuote = Boolean(
    model.automaticManufacturingAllowed || model.pricingAllowed,
  );

  if (licenseAllowsQuote && filesConfirmed) {
    return "quote";
  }
  return "verify";
}

export function externalQuoteCtaLabel(action: ExternalQuoteAction) {
  if (action === "quote") return "Bununla fiyat al";
  if (action === "verify") return "Uygunluğu kontrol et";
  return null;
}

export function externalQuoteReasonTr(
  model: Pick<
    ExternalModelSummary,
    "licenseCode" | "licenseLabel" | "fileCount" | "permissionStatus"
  >,
): string {
  const code = licenseCodeOf(model);
  if (code === "cc_by_nc") {
    return "Thingiverse lisansı ticari üretime izin vermiyor. Otomatik fiyat akışı açılmaz.";
  }
  if (model.permissionStatus === "rejected" || model.permissionStatus === "revoked") {
    return "Bu model için ticari üretim izni yok. Otomatik fiyat alınamaz.";
  }
  if (typeof model.fileCount === "number" && model.fileCount === 0) {
    return "İndirilebilir STL veya 3MF dosyası bulunamadı. Fiyat için uygun üretim dosyası gerekir.";
  }
  if (!code || code === "missing") {
    return "Thingiverse lisans bilgisi henüz doğrulanmadı. Fiyat, lisans ve dosya kontrolünden sonra netleşir.";
  }
  if (code === "unknown") {
    return "Lisans metni otomatik üretime eşlenmedi. Tahmin edilmez; inceleme gerekir.";
  }
  if (code === "cc_by_sa" || code === "cc_by_nd") {
    return "Bu lisans otomatik ticari üretime uygun değil. Dosya ve lisans kontrolü ayrı yapılır.";
  }
  if (typeof model.fileCount !== "number") {
    return "Üretim dosyası henüz doğrulanmadı. Uygun STL veya 3MF görülünce fiyat akışı açılır.";
  }
  return "Lisans veya üretim dosyası doğrulanmadan fiyat gösterilmez.";
}
