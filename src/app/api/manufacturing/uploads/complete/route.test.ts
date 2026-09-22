import { beforeEach, describe, expect, it, vi } from "vitest";

const persistence = vi.hoisted(() => ({
  manufacturingPersistenceReady: vi.fn(() => true),
  maxUploadBytes: () => 100 * 1024 * 1024,
  readPrivateObject: vi.fn(),
  writePrivateObject: vi.fn(),
  deletePrivateObject: vi.fn(),
}));

const accept = vi.hoisted(() => ({
  acceptUploadedMesh: vi.fn(),
  parseUploadedTransform: vi.fn(async () => ({
      version: 1,
    translationMm: { x: 0, y: 0, z: 0 },
    rotationDeg: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1, uniform: true },
    placeOnBed: true,
    source: "reset",
  })),
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
vi.mock("@/domain/manufacturing/accept-uploaded-mesh", () => ({
  acceptUploadedMesh: accept.acceptUploadedMesh,
  parseUploadedTransform: accept.parseUploadedTransform,
}));

import { POST } from "@/app/api/manufacturing/uploads/complete/route";

const sessionId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const fileId = "11111111-2222-4333-8444-555555555555";
const storageKey = `${sessionId}/${fileId}/source`;

function request(body: unknown) {
  return new Request("http://localhost/api/manufacturing/uploads/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    fileId,
    storageKey,
    originalFilename: "benchy.stl",
    mimeType: "application/octet-stream",
    sizeBytes: 2048,
    rightsConfirmed: true,
    materialId: "pla",
    colorId: "white",
    qualityId: "standart",
    infillPercent: 20,
    supports: "auto",
    scalePercent: 100,
    quantity: 1,
    ...overrides,
  };
}

describe("POST /api/manufacturing/uploads/complete", () => {
  beforeEach(() => {
    persistence.readPrivateObject.mockReset();
    persistence.deletePrivateObject.mockReset();
    accept.acceptUploadedMesh.mockReset();
    persistence.readPrivateObject.mockResolvedValue(new Uint8Array(2048));
    accept.acceptUploadedMesh.mockResolvedValue({ jobId: "job-1", fileId });
  });

  it("rejects another session's storage key", async () => {
    const response = await POST(
      request(validBody({ storageKey: `bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee/${fileId}/source` })),
    );
    expect(response.status).toBe(403);
    const body = (await response.json()) as { code: string; requestId: string };
    expect(body.code).toBe("UNAUTHORIZED");
    expect(body.requestId).toBeTruthy();
  });

  it("re-validates extension and ignores browser MIME", async () => {
    const response = await POST(
      request(validBody({ originalFilename: "notes.pdf", mimeType: "model/stl" })),
    );
    expect(response.status).toBe(415);
  });

  it("rejects a size mismatch and keeps a JSON shape", async () => {
    persistence.readPrivateObject.mockResolvedValue(new Uint8Array(90));
    const response = await POST(request(validBody({ sizeBytes: 2048 })));
    expect(response.status).toBe(422);
    const body = (await response.json()) as { ok: boolean; message: string };
    expect(body.ok).toBe(false);
    expect(body.message).not.toMatch(/supabase|stack|ECONN/i);
  });

  it("returns a job id on success", async () => {
    const response = await POST(request(validBody()));
    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok: boolean; jobId: string };
    expect(body.ok).toBe(true);
    expect(body.jobId).toBe("job-1");
  });
});
