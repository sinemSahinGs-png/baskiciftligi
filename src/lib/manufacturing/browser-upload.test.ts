import { afterEach, describe, expect, it, vi } from "vitest";

import { submitManufacturingUpload } from "@/lib/manufacturing/browser-upload";
import { SERVERLESS_SAFE_UPLOAD_BYTES } from "@/lib/manufacturing/upload-limits";
import { UploadPricingError } from "@/lib/http/public-api-error";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const baseInput = {
  rightsConfirmed: true,
  materialId: "pla",
  colorId: "white",
  qualityId: "standart" as const,
  infillPercent: 20,
  supports: "auto" as const,
  scalePercent: 100,
  quantity: 1,
  unit: "mm",
  manufacturingTransform: "{}",
};

const signedIntent = {
  ok: true,
  mode: "signed",
  fileId: "11111111-2222-4333-8444-555555555555",
  storageKey:
    "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee/11111111-2222-4333-8444-555555555555/source",
  uploadUrl: "https://storage.example/put",
  expiresInSeconds: 120,
};

function mockXhr(status: number) {
  class FakeXHR {
    status = status;
    upload = { onprogress: null as ((event: ProgressEvent) => void) | null };
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    open() {}
    setRequestHeader() {}
    send() {
      queueMicrotask(() => this.onload?.());
    }
  }
  vi.stubGlobal("XMLHttpRequest", FakeXHR);
}

describe("submitManufacturingUpload", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts multipart JSON for files under the serverless cap", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true, jobId: "job-1" }));
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["solid test"], "tiny.stl", { type: "model/stl" });
    Object.defineProperty(file, "size", { value: 1024 });
    const result = await submitManufacturingUpload({
      ...baseInput,
      file,
      idempotencyKey: "k1",
    });
    expect(result.jobId).toBe("job-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("/api/manufacturing/uploads");
  });

  it("uses signed intent when the file exceeds the serverless cap, then falls back to direct locally", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ ok: true, mode: "direct" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, jobId: "job-direct" }));
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["x"], "large.stl", { type: "model/stl" });
    Object.defineProperty(file, "size", { value: SERVERLESS_SAFE_UPLOAD_BYTES + 10 });
    const result = await submitManufacturingUpload({
      ...baseInput,
      file,
      idempotencyKey: "k2",
    });
    expect(result.jobId).toBe("job-direct");
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("/api/manufacturing/uploads/intent");
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe("/api/manufacturing/uploads");
  });

  it("PUTs ~6MB files to the signed URL then completes", async () => {
    mockXhr(200);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(signedIntent))
      .mockResolvedValueOnce(jsonResponse({ ok: true, jobId: "job-signed" }));
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["x"], "large.stl");
    Object.defineProperty(file, "size", { value: 6 * 1024 * 1024 });
    const result = await submitManufacturingUpload({
      ...baseInput,
      file,
      idempotencyKey: "k-signed",
    });
    expect(result.jobId).toBe("job-signed");
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe("/api/manufacturing/uploads/complete");
  });
});

describe("submitManufacturingUpload errors", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps plain-text 413 without JSON.parse throwing", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("Request Entity Too Large\n\nFUNCTION_PAYLOAD_TOO_LARGE\n", {
        status: 413,
        headers: { "content-type": "text/plain; charset=utf-8" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["solid"], "tiny.stl");
    Object.defineProperty(file, "size", { value: 1024 });
    await expect(
      submitManufacturingUpload({
        ...baseInput,
        file,
        idempotencyKey: "k3",
      }),
    ).rejects.toMatchObject({
      name: "UploadPricingError",
      status: 413,
      code: "UPLOAD_TOO_LARGE",
    } satisfies Partial<UploadPricingError>);
  });

  it("maps HTML upstream errors without exposing markup", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("<!DOCTYPE html><html>Bad Gateway</html>", {
        status: 502,
        headers: { "content-type": "text/html" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["solid"], "tiny.stl");
    Object.defineProperty(file, "size", { value: 1024 });
    await expect(
      submitManufacturingUpload({ ...baseInput, file, idempotencyKey: "k-html" }),
    ).rejects.toMatchObject({
      message: expect.not.stringMatching(/<!DOCTYPE|Bad Gateway/),
      code: "UPSTREAM_UNAVAILABLE",
    });
  });

  it("maps pricing timeouts", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("Gateway Time-out", {
        status: 504,
        headers: { "content-type": "text/plain" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["solid"], "tiny.stl");
    Object.defineProperty(file, "size", { value: 1024 });
    const error = await submitManufacturingUpload({
      ...baseInput,
      file,
      idempotencyKey: "k-to",
    }).catch((caught: unknown) => caught as UploadPricingError);
    expect(error).toMatchObject({ code: "TIMEOUT" });
    expect(String((error as UploadPricingError).message)).toMatch(/zaman/i);
  });

  it("maps signed PUT expiry without infrastructure text", async () => {
    mockXhr(403);
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(signedIntent));
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["x"], "large.stl");
    Object.defineProperty(file, "size", { value: SERVERLESS_SAFE_UPLOAD_BYTES + 10 });
    const error = await submitManufacturingUpload({
      ...baseInput,
      file,
      idempotencyKey: "k-exp",
    }).catch((caught: unknown) => caught as UploadPricingError);
    expect(error).toMatchObject({ code: "UNAUTHORIZED" });
    expect(String((error as UploadPricingError).message)).toMatch(/doldu/i);
  });

  it("maps storage PUT failure", async () => {
    mockXhr(500);
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(signedIntent));
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["x"], "large.stl");
    Object.defineProperty(file, "size", { value: SERVERLESS_SAFE_UPLOAD_BYTES + 10 });
    const error = await submitManufacturingUpload({
      ...baseInput,
      file,
      idempotencyKey: "k-put",
    }).catch((caught: unknown) => caught as UploadPricingError);
    expect(error).toMatchObject({ code: "UPSTREAM_UNAVAILABLE" });
    expect(String((error as UploadPricingError).message)).toMatch(/depoya/i);
  });

  it("maps /complete failure and does not ask to reselect the file", async () => {
    mockXhr(200);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(signedIntent))
      .mockResolvedValueOnce(
        jsonResponse(
          {
            ok: false,
            code: "UPSTREAM_UNAVAILABLE",
            message: "Hesaplama tamamlanamadi. Ayni dosyayla yeniden deneyin.",
            error: "Hesaplama tamamlanamadi. Ayni dosyayla yeniden deneyin.",
            requestId: "r-complete",
          },
          502,
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["x"], "large.stl");
    Object.defineProperty(file, "size", { value: SERVERLESS_SAFE_UPLOAD_BYTES + 10 });
    await expect(
      submitManufacturingUpload({ ...baseInput, file, idempotencyKey: "k-complete" }),
    ).rejects.toMatchObject({
      requestId: "r-complete",
      message: expect.stringMatching(/dosyayla/i),
    });
  });
});
