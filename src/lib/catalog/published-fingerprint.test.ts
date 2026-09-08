import { describe, expect, it } from "vitest";

import { demoProducts } from "@/domain/catalog/demo-data";
import {
  catalogFingerprint,
  catalogUsesIndustrialArtwork,
} from "@/lib/catalog/published-fingerprint";

const EXPECTED = {
  count: 8,
  rows: [
    { id: "demo-product-cable-01", slug: "loop-kablo-klipsi-6li-demo", priceMinor: 24900 },
    { id: "demo-product-desk-01", slug: "dock-masaustu-duzenleyici-demo", priceMinor: 74900 },
    { id: "demo-product-headphone-01", slug: "arc-kulaklik-standi-demo", priceMinor: 69900 },
    { id: "demo-product-lamp-01", slug: "orbit-ambiyans-lambasi-demo", priceMinor: 164900 },
    { id: "demo-product-nameplate-01", slug: "type-kisiye-ozel-masa-isimligi-demo", priceMinor: 44900 },
    { id: "demo-product-planter-01", slug: "tidal-saksi-demo", priceMinor: 57900 },
    { id: "demo-product-sculpture-01", slug: "mono-bust-demo", priceMinor: 124900 },
    { id: "demo-product-vase-01", slug: "flux-vazo-demo", priceMinor: 84900 },
  ],
} as const;

describe("published catalogue fingerprint", () => {
  it("keeps demo product ids, slugs and prices", () => {
    const snap = catalogFingerprint(demoProducts);
    expect(snap).toHaveLength(EXPECTED.count);
    expect(
      snap.map((row) => ({
        id: row.id,
        slug: row.slug,
        priceMinor: row.priceMinor,
      })),
    ).toEqual(EXPECTED.rows);
  });

  it("does not use homepage industrial artwork as catalogue media", () => {
    expect(catalogUsesIndustrialArtwork(demoProducts)).toBe(false);
    const snap = catalogFingerprint(demoProducts);
    expect(snap.every((row) => row.imageCount > 0)).toBe(true);
    expect(snap.every((row) => row.variantCount > 0)).toBe(true);
  });
});
