import { describe, expect, it } from "vitest";

import {
  resolveLicenseCommercePolicy,
  resolveLicenseCommercePolicyFromLabel,
} from "@/domain/external-models/license-commerce";
import { normalizeLicense } from "@/domain/manufacturing/licenses";
import { estimateProductionPrice } from "@/domain/external-models/production-estimate";

describe("resolveLicenseCommercePolicy", () => {
  it("allows auto checkout for CC0 and CC BY", () => {
    for (const label of ["CC0", "Creative Commons - Attribution"]) {
      const policy = resolveLicenseCommercePolicyFromLabel(label);
      expect(policy.tier).toBe("auto_checkout");
      expect(policy.allowPayment).toBe(true);
      expect(policy.primaryCtaTr).toContain("fiyatlandır");
    }
  });

  it("shows estimate but blocks payment for NC licenses", () => {
    const policy = resolveLicenseCommercePolicyFromLabel(
      "Creative Commons - Attribution - Non-Commercial",
    );
    expect(policy.tier).toBe("estimate_consult");
    expect(policy.showEstimate).toBe(true);
    expect(policy.allowPayment).toBe(false);
    expect(policy.allowConsultation).toBe(true);
  });

  it("routes BY-SA to consultation with estimate", () => {
    const policy = resolveLicenseCommercePolicy(
      normalizeLicense("Creative Commons - Attribution - Share Alike"),
    );
    expect(policy.tier).toBe("estimate_consult");
    expect(policy.showEstimate).toBe(true);
    expect(policy.allowPayment).toBe(false);
  });

  it("routes unknown licenses to consult only without estimate", () => {
    const policy = resolveLicenseCommercePolicyFromLabel("All Rights Reserved");
    expect(policy.tier).toBe("consult_only");
    expect(policy.showEstimate).toBe(false);
    expect(policy.allowPayment).toBe(false);
  });
});

describe("estimateProductionPrice", () => {
  it("returns a positive gross estimate", () => {
    const estimate = estimateProductionPrice({ sizePreset: "orta", quantity: 2 });
    expect(estimate.grossMinor).toBeGreaterThan(0);
    expect(estimate.disclaimerTr).toContain("sipariş onayı değildir");
  });
});
