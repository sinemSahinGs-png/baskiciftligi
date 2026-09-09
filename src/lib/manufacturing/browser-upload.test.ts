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
      file,
      rightsConfirmed: true,
      materialId: "pla",
      colorId: "white",
      qualityId: "standart",
      infillPercent: 20,
      supports: "auto",
      scalePercent: 100,
      quantity: 1,
      unit: "mm",
      manufacturingTransform: "{}",
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
      file,
      rightsConfirmed: true,
      materialId: "pla",
      colorId: "white",
      qualityId: "standart",
      infillPercent: 20,
      supports: "auto",
      scalePercent: 100,
      quantity: 1,
      unit: "mm",
      manufacturingTransform: "{}",
      idempotencyKey: "k2",
    });
    expect(result.jobId).toBe("job-direct");
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("/api/manufacturing/uploads/intent");
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe("/api/manufacturing/uploads");
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
        file,
        rightsConfirmed: true,
        materialId: "pla",
        colorId: "white",
        qualityId: "standart",
        infillPercent: 20,
        supports: "auto",
        scalePercent: 100,
        quantity: 1,
        unit: "mm",
        manufacturingTransform: "{}",
        idempotencyKey: "k3",
      }),
    ).rejects.toMatchObject({
      name: "UploadPricingError",
      status: 413,
      code: "UPLOAD_TOO_LARGE",
    } satisfies Partial<UploadPricingError>);
  });
});
