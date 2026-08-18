import { describe, expect, it } from "vitest";

import { mergeSiteContent } from "./content";

describe("site content merge", () => {
  it("keeps storefront defaults when stored fields are empty", () => {
    const merged = mergeSiteContent({
      tagline: "  ",
      hero: { headline: "Yeni başlık" },
    });
    expect(merged.hero.headline).toBe("Yeni başlık");
    expect(merged.tagline.length).toBeGreaterThan(8);
    expect(merged.hero.primaryCtaLabel).toBe("Mağazayı keşfet");
  });
});
