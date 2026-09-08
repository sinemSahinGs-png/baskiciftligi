import { describe, expect, it } from "vitest";

import {
  STOREFRONT_CATEGORY_REDIRECTS,
  countStorefrontProducts,
  expandCategoryFilter,
  productMatchesStorefrontCategory,
  storefrontCategories,
  storefrontSlugFromSource,
  publicCategoryHref,
  publicCategoryName,
} from "@/domain/catalog/storefront-taxonomy";

describe("storefront taxonomy overlay", () => {
  it("exposes seven customer-facing categories without writing hosted slugs", () => {
    expect(storefrontCategories).toHaveLength(7);
    expect(storefrontCategories.map((item) => item.slug)).toEqual([
      "dekorasyon-yasam",
      "figur-heykel",
      "oyuncak-hareketli-modeller",
      "taraftara-ozel",
      "anahtarlik-magnet",
      "masaustu-fonksiyonel",
      "kisiye-ozel",
    ]);
  });

  it("maps replaced hosted slugs without dropping magnet or anahtarlık products", () => {
    expect(storefrontSlugFromSource("magnet")).toBe("anahtarlik-magnet");
    expect(storefrontSlugFromSource("anahtarlik")).toBe("anahtarlik-magnet");
    expect(expandCategoryFilter("anahtarlik-magnet")).toEqual([
      "anahtarlik",
      "magnet",
    ]);
    expect(
      productMatchesStorefrontCategory(["magnet"], "anahtarlik-magnet"),
    ).toBe(true);
    expect(
      productMatchesStorefrontCategory(["anahtarlik"], "anahtarlik-magnet"),
    ).toBe(true);
  });

  it("does not invent products for empty future categories", () => {
    const empty = storefrontCategories.find(
      (item) => item.slug === "taraftara-ozel",
    )!;
    expect(empty.comingSoon).toBe(true);
    expect(empty.sourceSlugs).toEqual([]);
    expect(
      countStorefrontProducts([{ categorySlugs: ["ev-ve-dekorasyon"] }], empty),
    ).toBe(0);
  });

  it("keeps redirects for replaced store URLs", () => {
    expect(
      STOREFRONT_CATEGORY_REDIRECTS.map((item) => item.source),
    ).toContain("/kategori/magnet");
    expect(
      STOREFRONT_CATEGORY_REDIRECTS.find((item) => item.source === "/magaza/kurumsal-promosyon")
        ?.destination,
    ).toBe("/toptan");
  });

  it("resolves public hrefs from hosted or storefront slugs", () => {
    expect(publicCategoryHref("magnet")).toBe("/kategori/anahtarlik-magnet");
    expect(publicCategoryHref("kisiye-ozel")).toBe("/kategori/kisiye-ozel");
    expect(publicCategoryHref("kurumsal-promosyon")).toBe("/toptan");
    expect(publicCategoryName("magnet")).toBe("Anahtarlık & Magnet");
    expect(publicCategoryName("ev-ve-dekorasyon")).toBe("Dekorasyon & Yaşam");
    expect(publicCategoryName("kurumsal-promosyon")).toBe("Toptan & Bayiler");
  });

  it("keeps presentation artwork filenames on the taxonomy overlay", () => {
    expect(
      storefrontCategories.map((item) => [item.slug, item.assetFile]),
    ).toEqual([
      ["dekorasyon-yasam", "dekorasyon-yasam.png"],
      ["figur-heykel", "figur-heykel.png"],
      ["oyuncak-hareketli-modeller", "oyuncak-hareketli.png"],
      ["taraftara-ozel", "taraftara-ozel.png"],
      ["anahtarlik-magnet", "anahtarlik-magnet.png"],
      ["masaustu-fonksiyonel", "masaustu-fonksiyonel.png"],
      ["kisiye-ozel", "kisiye-ozel.png"],
    ]);
  });
});
