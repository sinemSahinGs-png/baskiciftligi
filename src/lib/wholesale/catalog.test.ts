import { describe, expect, it } from "vitest";

import { customerCopyLeaksConfiguration } from "@/lib/launch/sanitize";
import {
  WHOLESALE_CATALOG_COPY,
  WHOLESALE_CATALOG_PATH,
  WHOLESALE_CATALOG_SHORT_PATH,
  productMeasureLabel,
  wholesaleCatalogQrUrl,
} from "@/lib/wholesale/catalog";

describe("wholesale catalog QR target", () => {
  it("uses a short production URL for printed business cards", () => {
    expect(WHOLESALE_CATALOG_SHORT_PATH).toBe("/katalog");
    expect(WHOLESALE_CATALOG_PATH).toBe("/toptan/katalog");
    expect(wholesaleCatalogQrUrl()).toBe("https://baskiciftligi.com/katalog");
  });

  it("does not invent measures or leak configuration copy", () => {
    expect(productMeasureLabel({})).toBeNull();
    expect(
      productMeasureLabel({ widthMm: 80, depthMm: 40, heightMm: 120 }),
    ).toBe("80 × 40 × 120 mm");
    expect(
      customerCopyLeaksConfiguration(
        `${WHOLESALE_CATALOG_COPY.title} ${WHOLESALE_CATALOG_COPY.lede} ${WHOLESALE_CATALOG_COPY.emptyBody}`,
      ),
    ).toBe(false);
  });
});
