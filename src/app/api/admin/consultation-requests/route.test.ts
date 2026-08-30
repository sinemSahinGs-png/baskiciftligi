import { describe, expect, it, vi, beforeEach } from "vitest";

import { GET, PATCH } from "@/app/api/admin/consultation-requests/route";

const sampleRequest = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  source: "thingiverse",
  externalId: "2002",
  modelTitle: "Ticari olmayan vazo",
  creatorName: "fixture-leo",
  sourceUrl: "https://www.thingiverse.com/thing:2002",
  licenseLabel: "NC",
  licenseCode: "cc_by_nc",
  licenseEvaluation: "permission_required" as const,
  thumbnailUrl: null,
  customerName: "Ali",
  customerPhone: "+905551112233",
  customerEmail: null,
  material: "pla",
  color: "beyaz",
  sizeLabel: "Orta",
  quantity: 1,
  customerNote: null,
  estimatedGrossMinor: 9900,
  pricingState: "unanalysed" as const,
  productionOptions: {},
  status: "pending_license_review" as const,
  adminNote: null,
  finalQuoteGrossMinor: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

vi.mock("@/lib/auth/session", () => ({
  getViewer: vi.fn(),
}));

vi.mock("@/domain/consultation/repository", () => ({
  listConsultationRequests: vi.fn(async () => [sampleRequest]),
  getConsultationRequest: vi.fn(async (id: string) =>
    id === sampleRequest.id ? sampleRequest : null,
  ),
  updateConsultationRequest: vi.fn(async (_id, input) => ({
    ...sampleRequest,
    status: input.status ?? sampleRequest.status,
    adminNote: input.adminNote ?? sampleRequest.adminNote,
    finalQuoteGrossMinor:
      input.finalQuoteGrossMinor !== undefined
        ? input.finalQuoteGrossMinor
        : sampleRequest.finalQuoteGrossMinor,
  })),
}));

import { getViewer } from "@/lib/auth/session";
import { updateConsultationRequest } from "@/domain/consultation/repository";

describe("admin consultation-requests API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated GET", async () => {
    vi.mocked(getViewer).mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("allows admin GET", async () => {
    vi.mocked(getViewer).mockResolvedValue({ id: "admin", role: "admin" } as never);
    const response = await GET();
    expect(response.status).toBe(200);
    const body = (await response.json()) as { requests: unknown[] };
    expect(body.requests).toHaveLength(1);
  });

  it("allows admin PATCH status and final quote", async () => {
    vi.mocked(getViewer).mockResolvedValue({ id: "admin", role: "admin" } as never);
    const response = await PATCH(
      new Request("http://localhost/api/admin/consultation-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sampleRequest.id,
          status: "production_ok",
          adminNote: "Uygun",
          finalQuoteGrossMinor: 45000,
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(updateConsultationRequest).toHaveBeenCalled();
    const body = (await response.json()) as {
      request?: { status?: string; finalQuoteGrossMinor?: number };
    };
    expect(body.request?.status).toBe("production_ok");
    expect(body.request?.finalQuoteGrossMinor).toBe(45000);
  });
});
