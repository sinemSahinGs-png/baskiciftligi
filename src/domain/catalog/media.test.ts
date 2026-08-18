import { describe, expect, it } from "vitest";

import { demoProducts } from "@/domain/catalog/demo-data";
import { resolveProductVisual } from "@/domain/catalog/media";

describe("product visual presentation", () => {
  it("treats isolated demo primaries as cutouts and keeps detail shots framed", () => {
    const vase = demoProducts.find((product) => product.slug === "flux-vazo-demo");
    expect(vase).toBeDefined();
    const visual = resolveProductVisual(vase!);
    expect(visual.isolated).toBe(true);
    expect(visual.primary?.url).toBe("/demo/products/flux-vazo.svg");
    expect(visual.hover?.url).toBe("/demo/products/flux-vazo-detail.svg");
    expect(visual.hover?.isolated).toBe(false);
    expect(visual.stage).toBe("cyan");
  });
});
