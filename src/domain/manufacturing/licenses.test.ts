import { describe, expect, it } from "vitest";

import {
  buildAttributionText,
  canAutomaticallyQuoteLicense,
  normalizeLicense,
} from "./licenses";

describe("license normalization", () => {
  it("allows CC0 and public domain for automatic manufacturing", () => {
    const cc0 = normalizeLicense("Creative Commons - Public Domain Dedication");
    expect(cc0.code).toBe("cc0");
    expect(cc0.automaticManufacturingAllowed).toBe(true);
    expect(canAutomaticallyQuoteLicense(cc0)).toBe(true);

    const pd = normalizeLicense("Public Domain");
    expect(pd.code).toBe("public_domain");
    expect(pd.automaticManufacturingAllowed).toBe(true);
  });

  it("allows CC BY with attribution", () => {
    const by = normalizeLicense("Creative Commons - Attribution");
    expect(by.code).toBe("cc_by");
    expect(by.attributionRequired).toBe(true);
    expect(by.automaticManufacturingAllowed).toBe(true);
    expect(
      buildAttributionText({
        title: "Cube",
        creator: "ada",
        licenseName: by.mappedFrom,
        sourceUrl: "https://www.thingiverse.com/thing:1",
      }),
    ).toContain("ada");
  });

  it("blocks non-commercial licenses", () => {
    const nc = normalizeLicense(
      "Creative Commons - Attribution - Non-Commercial",
    );
    expect(nc.code).toBe("cc_by_nc");
    expect(nc.commercialUse).toBe("prohibited");
    expect(nc.automaticManufacturingAllowed).toBe(false);
  });

  it("sends share-alike and no-derivatives to review, not automatic cart", () => {
    const sa = normalizeLicense(
      "Creative Commons - Attribution - Share Alike",
    );
    expect(sa.code).toBe("cc_by_sa");
    expect(sa.shareAlike).toBe(true);
    expect(sa.automaticManufacturingAllowed).toBe(false);
    expect(sa.requiresManualReview).toBe(true);

    const nd = normalizeLicense("CC BY-ND 4.0");
    expect(nd.code).toBe("cc_by_nd");
    expect(nd.automaticManufacturingAllowed).toBe(false);
  });

  it("does not infer permission from a missing or unknown license", () => {
    expect(normalizeLicense(null).code).toBe("missing");
    expect(normalizeLicense("").automaticManufacturingAllowed).toBe(false);
    const unknown = normalizeLicense("Nokia");
    expect(unknown.code).toBe("unknown");
    expect(unknown.automaticManufacturingAllowed).toBe(false);
  });
});
