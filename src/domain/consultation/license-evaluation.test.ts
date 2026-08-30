import { describe, expect, it } from "vitest";

import {
  resolveLicenseEvaluation,
  resolveLicenseEvaluationFromLabel,
  licenseEvaluationLabel,
} from "@/domain/consultation/license-evaluation";
import { normalizeLicense } from "@/domain/manufacturing/licenses";

describe("resolveLicenseEvaluation", () => {
  it("marks CC0 and CC BY as auto suitable", () => {
    for (const label of ["CC0", "Creative Commons - Attribution"]) {
      expect(resolveLicenseEvaluationFromLabel(label).code).toBe("auto_suitable");
    }
  });

  it("marks NC licenses as permission required", () => {
    expect(
      resolveLicenseEvaluationFromLabel(
        "Creative Commons - Attribution - Non-Commercial",
      ).code,
    ).toBe("permission_required");
  });

  it("marks ND as suitable unmodified", () => {
    expect(
      resolveLicenseEvaluation(
        normalizeLicense("Creative Commons - Attribution - No Derivatives"),
      ).code,
    ).toBe("suitable_unmodified");
  });

  it("marks BY-SA and unknown as manual review", () => {
    expect(
      resolveLicenseEvaluationFromLabel(
        "Creative Commons - Attribution - Share Alike",
      ).code,
    ).toBe("manual_review");
    expect(resolveLicenseEvaluationFromLabel("All Rights Reserved").code).toBe(
      "manual_review",
    );
  });

  it("exposes Turkish admin labels", () => {
    expect(licenseEvaluationLabel("auto_suitable")).toBe("Otomatik uygun");
    expect(licenseEvaluationLabel("permission_required")).toBe("İzin gerekli");
  });
});
