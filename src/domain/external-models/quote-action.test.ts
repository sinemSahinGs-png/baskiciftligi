import { describe, expect, it } from "vitest";

import {
  externalQuoteReasonTr,
  resolveExternalQuoteAction,
} from "@/domain/external-models/quote-action";

describe("resolveExternalQuoteAction", () => {
  it("quotes only when license allows and printable files are verified", () => {
    expect(
      resolveExternalQuoteAction(
        {
          pricingAllowed: true,
          automaticManufacturingAllowed: true,
          permissionStatus: "permission_verified",
          licenseCode: "cc_by",
          fileCount: 1,
        },
        { printableFilesVerified: true },
      ),
    ).toBe("quote");
  });

  it("does not quote from browse file_count without printable verification", () => {
    expect(
      resolveExternalQuoteAction({
        pricingAllowed: true,
        automaticManufacturingAllowed: true,
        permissionStatus: "discovery_only",
        licenseCode: "cc_by",
        fileCount: 4,
      }),
    ).toBe("verify");
  });

  it("asks for verification when files are not confirmed", () => {
    expect(
      resolveExternalQuoteAction({
        pricingAllowed: true,
        automaticManufacturingAllowed: true,
        permissionStatus: "discovery_only",
        licenseCode: "cc_by",
        fileCount: undefined,
      }),
    ).toBe("verify");
  });

  it("does not open pricing for non-commercial licenses", () => {
    expect(
      resolveExternalQuoteAction({
        pricingAllowed: false,
        automaticManufacturingAllowed: false,
        permissionStatus: "rejected",
        licenseCode: "cc_by_nc",
        fileCount: 1,
      }),
    ).toBe("inspect");
    expect(
      externalQuoteReasonTr({
        licenseCode: "cc_by_nc",
        permissionStatus: "rejected",
        fileCount: 1,
      }),
    ).toMatch(/ticari üretime izin vermiyor/i);
  });

  it("inspects when printable files are verified missing", () => {
    expect(
      resolveExternalQuoteAction(
        {
          pricingAllowed: true,
          automaticManufacturingAllowed: true,
          permissionStatus: "permission_verified",
          licenseCode: "cc_by",
          fileCount: 0,
        },
        { printableFilesVerified: true },
      ),
    ).toBe("inspect");
  });
});
