import { describe, expect, it } from "vitest";

import { readApiJson } from "@/lib/http/parse-json-response";
import { UploadPricingError } from "@/lib/http/public-api-error";

function response(body: string, status: number, contentType: string) {
  return new Response(body, {
    status,
    headers: { "content-type": contentType, "x-request-id": "req_test" },
  });
}

describe("readApiJson", () => {
  it("parses JSON success", async () => {
    const payload = await readApiJson<{ jobId: string }>(
      response(JSON.stringify({ ok: true, jobId: "abc" }), 200, "application/json"),
    );
    expect(payload.jobId).toBe("abc");
  });

  it("maps Vercel FUNCTION_PAYLOAD_TOO_LARGE plain text without throwing JSON parse", async () => {
    const body =
      "Request Entity Too Large\n\nFUNCTION_PAYLOAD_TOO_LARGE\n\nfra1::jl2bl-1788916125558-71284b1a05c4\n";
    await expect(
      readApiJson(response(body, 413, "text/plain; charset=utf-8")),
    ).rejects.toMatchObject({
      name: "UploadPricingError",
      status: 413,
      code: "UPLOAD_TOO_LARGE",
    });
    try {
      await readApiJson(response(body, 413, "text/plain; charset=utf-8"));
    } catch (error) {
      expect(error).toBeInstanceOf(UploadPricingError);
      expect((error as UploadPricingError).message).toMatch(/Dosya yükleme sınırını aşıyor/);
      expect((error as UploadPricingError).message).not.toMatch(/Request Entity/);
    }
  });

  it("maps HTML proxy errors without exposing markup", async () => {
    await expect(
      readApiJson(response("<html><body>Bad Gateway</body></html>", 502, "text/html")),
    ).rejects.toMatchObject({
      code: "UPSTREAM_UNAVAILABLE",
    });
  });

  it("keeps structured JSON errors", async () => {
    await expect(
      readApiJson(
        response(
          JSON.stringify({
            ok: false,
            code: "UNSUPPORTED_TYPE",
            message: "Bu dosya türü kabul edilmiyor. STL veya 3MF yükleyin.",
            error: "Bu dosya türü kabul edilmiyor. STL veya 3MF yükleyin.",
            requestId: "r1",
          }),
          415,
          "application/json",
        ),
      ),
    ).rejects.toMatchObject({
      status: 415,
      code: "UNSUPPORTED_TYPE",
      requestId: "r1",
    });
  });
});
