import { beforeEach, describe, expect, it, vi } from "vitest";

const persistence = vi.hoisted(() => ({
  manufacturingPersistenceReady: vi.fn(() => true),
  manufacturingUsesLocalPersistence: vi.fn(() => true),
  maxUploadBytes: () => 100 * 1024 * 1024,
}));

const signed = vi.hoisted(() => ({
  supabaseCreateSignedUploadUrl: vi.fn(),
}));

vi.mock("@/lib/manufacturing/paths", () => persistence);
vi.mock("@/lib/manufacturing/rate-limit", () => ({
  clientKey: () => "test-client",
  rateLimit: () => ({ ok: true }),
}));
vi.mock("@/lib/manufacturing/session", () => ({
  getManufacturingActor: async () => ({
    sessionId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
  }),
}));
vi.mock("@/lib/manufacturing/supabase-store", () => signed);

import { POST } from "@/app/api/manufacturing/uploads/intent/route";
import { SIGNED_UPLOAD_EXPIRES_SECONDS } from "@/lib/manufacturing/upload-limits";

function request(body: unknown) {
  return new Request("http://localhost/api/manufacturing/uploads/intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/manufacturing/uploads/intent", () => {
  beforeEach(() => {
    persistence.manufacturingUsesLocalPersistence.mockReturnValue(true);
    signed.supabaseCreateSignedUploadUrl.mockReset();
  });

  it("rejects empty files with structured JSON", async () => {
    const response = await POST(
      request({ filename: "model.stl", sizeBytes: 0, mimeType: "model/stl" }),
    );
    expect(response.status).toBe(422);
    expect(response.headers.get("content-type")).toMatch(/application\/json/);
    const body = (await response.json()) as { ok: boolean; code: string; message: string; requestId: string };
    expect(body.ok).toBe(false);
    expect(body.code).toBe("EMPTY_FILE");
    expect(body.requestId).toMatch(/[0-9a-f-]{8}/i);
    expect(body.message).not.toMatch(/</);
  });

  it("rejects unsupported types even when the browser claims a mesh MIME", async () => {
    const response = await POST(
      request({ filename: "notes.pdf", sizeBytes: 1200, mimeType: "model/stl" }),
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

  it("returns a short-lived owned signed URL in hosted mode", async () => {
    persistence.manufacturingUsesLocalPersistence.mockReturnValue(false);
    signed.supabaseCreateSignedUploadUrl.mockResolvedValue({
      signedUrl: "https://storage.example/put",
      token: "tok",
      path: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee/file/source",
    });
    const response = await POST(
      request({ filename: "benchy.stl", sizeBytes: 6_000_000, mimeType: "application/octet-stream" }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      mode: string;
      storageKey: string;
      expiresInSeconds: number;
      uploadUrl: string;
    };
    expect(body.mode).toBe("signed");
    expect(body.expiresInSeconds).toBe(SIGNED_UPLOAD_EXPIRES_SECONDS);
    expect(body.storageKey.startsWith("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee/")).toBe(true);
    expect(body.storageKey.endsWith("/source")).toBe(true);
    expect(body.uploadUrl).toBe("https://storage.example/put");
    expect(JSON.stringify(body)).not.toMatch(/service_role|SUPABASE_SECRET/i);
  });
});
