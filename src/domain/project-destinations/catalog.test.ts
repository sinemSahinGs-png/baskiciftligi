import { describe, expect, it } from "vitest";

import { storefrontCategories } from "@/domain/catalog/storefront-taxonomy";
import { MATERIAL_PROFILES } from "@/domain/manufacturing/profiles";
import {
  findProjectCatalogProduct,
  listProjectCatalogProducts,
  listProjectDisplayProducts,
  projectDestinations,
} from "@/domain/project-destinations/catalog";
import { listHomepageCuratedCards } from "@/domain/project-destinations/curated";
import { homepageStageCategories } from "@/domain/project-destinations/stage";

describe("project category destinations", () => {
  it("keeps OCTO taxonomy at seven entries and appends three homepage-only destinations", () => {
    expect(storefrontCategories).toHaveLength(7);
    expect(projectDestinations.map((item) => item.slug)).toEqual([
      "orbia",
      "memoora",
      "lil-disc",
    ]);
    const stage = homepageStageCategories();
    expect(stage).toHaveLength(10);
    expect(stage.filter((item) => item.kind === "octo")).toHaveLength(7);
    expect(stage.slice(0, 3).map((item) => item.slug)).toEqual([
      "memoora",
      "lil-disc",
      "orbia",
    ]);
    expect(stage.filter((item) => item.kind === "project").map((item) => item.href)).toEqual([
      "/kategori/memoora",
      "/kategori/lil-disc",
      "/kategori/orbia",
    ]);
    expect(projectDestinations.find((item) => item.slug === "lil-disc")?.name).toBe("LIL’ DISC");
  });

  it("does not invent Orbia prices and excludes Orbia from the checkout catalog", () => {
    const display = listProjectDisplayProducts("orbia");
    expect(display[0]?.priceMinor).toBe(0);
    expect(projectDestinations.find((item) => item.slug === "orbia")?.purchasable).toBe(false);
    expect(listProjectCatalogProducts().some((item) => item.id.startsWith("proj-orbia"))).toBe(
      false,
    );
  });

  it("reuses Memoora and LIL’ DISC source prices only", () => {
    expect(findProjectCatalogProduct("proj-memoora-magnet")?.priceMinor).toBe(6_600);
    expect(findProjectCatalogProduct("proj-memoora-keychain")?.priceMinor).toBe(5_400);
    expect(listProjectDisplayProducts("lil-disc")).toHaveLength(4);
    expect(
      listProjectDisplayProducts("lil-disc").every((item) => item.priceMinor === 20_000),
    ).toBe(true);
  });

  it("does not add Resin to manufacturing checkout profiles", () => {
    expect(MATERIAL_PROFILES.map((item) => item.id)).toEqual(["pla"]);
  });

  it("feeds homepage curated cards from the project source without empty fallback", () => {
    const cards = listHomepageCuratedCards([]);
    expect(cards[0]?.label).toBe("MEMOORA");
    expect(cards.some((item) => item.label === "LIL’ DISC")).toBe(true);
    expect(cards.some((item) => item.label === "ORBIA" && item.priceSoon)).toBe(true);
    expect(cards.filter((item) => item.label === "MEMOORA")).toHaveLength(2);
    expect(cards.filter((item) => item.label === "LIL’ DISC")).toHaveLength(2);
    expect(cards.every((item) => item.href.startsWith("/kategori/"))).toBe(true);
  });

  it("keeps project SKUs invisible to storefront search and featured rails", () => {
    for (const product of [
      ...listProjectCatalogProducts(),
      ...listProjectDisplayProducts("orbia"),
    ]) {
      expect(product.searchVisible).toBe(false);
      expect(product.featured).toBe(false);
      expect(product.noindex).toBe(true);
    }
  });
});
