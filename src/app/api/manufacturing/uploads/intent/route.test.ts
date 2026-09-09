import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/manufacturing/paths", () => ({
  manufacturingPersistenceReady: () => true,
  manufacturingUsesLocalPersistence: () => true,
  maxUploadBytes: () => 100 * 1024 * 1024,
}));

vi.mock("@/lib/manufacturing/rate-limit", () => ({
  clientKey: () => "test-client",
  rateLimit: () => ({ ok: true }),
}));

vi.mock("@/lib/manufacturing/session", () => ({
  getManufacturingActor: async () => ({ sessionId: "session-test" }),
}));

import { POST } from "@/app/api/manufacturing/uploads/intent/route";

function request(body: unknown) {
  return new Request("http://localhost/api/manufacturing/uploads/intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/manufacturing/uploads/intent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects empty files with structured JSON", async () => {
    const response = await POST(
      request({ filename: "model.stl", sizeBytes: 0, mimeType: "model/stl" }),
    );
    expect(response.status).toBe(422);
    expect(response.headers.get("content-type")).toMatch(/application\/json/);
    const body = (await response.json()) as { ok: boolean; code: string; message: string };
    expect(body.ok).toBe(false);
    expect(body.code).toBe("EMPTY_FILE");
    expect(body.message).not.toMatch(/</);
  });

  it("rejects unsupported types", async () => {
    const response = await POST(
      request({ filename: "notes.pdf", sizeBytes: 1200, mimeType: "application/pdf" }),
    );
    expect(response.status).toBe(415);
    const body = (await response.json()) as { code: string };
    expect(body.code).toBe("UNSUPPORTED_TYPE");
  });

  it("returns direct mode in local persistence", async () => {
    const response = await POST(
      request({ filename: "benchy.stl", sizeBytes: 8_000_000, mimeType: "model/stl" }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok: boolean; mode: string };
    expect(body.ok).toBe(true);
    expect(body.mode).toBe("direct");
  });
});
