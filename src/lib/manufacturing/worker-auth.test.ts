import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { assertSlicerWorker } from "./worker-auth";

vi.mock("@/lib/manufacturing/paths", () => ({
  slicerWorkerSecret: vi.fn(),
}));

import { slicerWorkerSecret } from "@/lib/manufacturing/paths";

describe("assertSlicerWorker", () => {
  beforeEach(() => {
    vi.mocked(slicerWorkerSecret).mockReturnValue("configured-secret");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when Authorization Bearer matches", () => {
    const request = new Request("https://example.com/api/internal/slicer/claim", {
      method: "POST",
      headers: { Authorization: "Bearer configured-secret" },
    });
    expect(assertSlicerWorker(request)).toBeNull();
  });

  it("returns 401 with authHint when bearer token mismatches", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const request = new Request("https://example.com/api/internal/slicer/claim", {
      method: "POST",
      headers: { Authorization: "Bearer configured-secrex" },
    });
    const response = assertSlicerWorker(request);
    expect(response?.status).toBe(401);
    const body = await response?.json();
    expect(body).toEqual({
      error: "Yetkisiz işçi.",
      authHint: "fingerprint_mismatch",
    });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("returns 503 when server secret is not configured", async () => {
    vi.mocked(slicerWorkerSecret).mockReturnValue(null);
    const request = new Request("https://example.com/api/internal/slicer/claim", {
      method: "POST",
      headers: { Authorization: "Bearer configured-secret" },
    });
    const response = assertSlicerWorker(request);
    expect(response?.status).toBe(503);
    const body = await response?.json();
    expect(body).toEqual({ error: "Slicer işçisi kimliği yapılandırılmadı." });
  });
});
