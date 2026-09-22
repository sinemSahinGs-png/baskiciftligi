import { describe, expect, it } from "vitest";

import { normalizePublicMessage, statusToCode } from "@/lib/http/public-api-error";

describe("normalizePublicMessage", () => {
  it("maps the production Vercel payload error", () => {
    const raw =
      "Request Entity Too Large\n\nFUNCTION_PAYLOAD_TOO_LARGE\n\nfra1::jl2bl-1788916125558-71284b1a05c4\n";
    expect(normalizePublicMessage(413, raw)).toMatch(/Dosya yükleme sınırını aşıyor/);
  });

  it("does not return HTML", () => {
    expect(normalizePublicMessage(502, "<!DOCTYPE html><html>error</html>")).not.toMatch(/</);
  });
});

describe("statusToCode", () => {
  it("maps 413 to UPLOAD_TOO_LARGE", () => {
    expect(statusToCode(413)).toBe("UPLOAD_TOO_LARGE");
  });
});
