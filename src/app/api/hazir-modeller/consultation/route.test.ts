import { describe, expect, it, vi, beforeEach } from "vitest";

import { POST } from "@/app/api/hazir-modeller/consultation/route";

vi.mock("@/domain/consultation/repository", () => ({
  createConsultationRequest: vi.fn(async (input: Record<string, unknown>) => ({
    id: "test-id",
    ...input,
    status: "pending_license_review",
    adminNote: null,
    finalQuoteGrossMinor: null,
    sizeLabel: "Orta",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })),
}));

describe("POST /api/hazir-modeller/consultation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a consultation request with valid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/hazir-modeller/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "thingiverse",
          externalId: "1587568",
          modelTitle: "Test Vase",
          creatorName: "maker",
          sourceUrl: "https://www.thingiverse.com/thing:1587568",
          licenseLabel: "Creative Commons - Attribution - Non-Commercial",
          customerName: "Ali Veli",
          customerPhone: "+905551112233",
          material: "pla",
          color: "beyaz",
          sizePreset: "orta",
          quantity: 1,
        }),
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok?: boolean; message?: string };
    expect(body.ok).toBe(true);
    expect(body.message).toContain("Talebiniz alındı");
  });

  it("rejects invalid phone", async () => {
    const response = await POST(
      new Request("http://localhost/api/hazir-modeller/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "thingiverse",
          externalId: "1",
          modelTitle: "Test",
          sourceUrl: "https://www.thingiverse.com/thing:1",
          customerName: "Ali",
          customerPhone: "123",
          material: "pla",
          color: "beyaz",
          sizePreset: "orta",
          quantity: 1,
        }),
      }),
    );
    expect(response.status).toBe(422);
  });
});
