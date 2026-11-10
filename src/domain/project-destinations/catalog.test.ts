import { describe, expect, it } from "vitest";

import { storefrontCategories } from "@/domain/catalog/storefront-taxonomy";
import {
  findProjectCatalogProduct,
  listProjectCatalogProducts,
  listProjectDisplayProducts,
  projectDestinations,
} from "@/domain/project-destinations/catalog";
import { homepageStageCategories } from "@/domain/project-destinations/stage";

describe("project category destinations", () => {
  it("keeps OCTO taxonomy at seven entries and appends three homepage-only destinations", () => {
    expect(storefrontCategories).toHaveLength(7);
    expect(projectDestinations.map((item) => item.slug)).toEqual([
      "orbia",
      "memoora",
      "cep-album",
    ]);
    const stage = homepageStageCategories();
    expect(stage).toHaveLength(10);
    expect(stage.filter((item) => item.kind === "octo")).toHaveLength(7);
    expect(stage.filter((item) => item.kind === "project").map((item) => item.href)).toEqual([
      "/kategori/orbia",
      "/kategori/memoora",
      "/kategori/cep-album",
    ]);
  });

  it("does not invent Orbia prices and excludes Orbia from the checkout catalog", () => {
    const display = listProjectDisplayProducts("orbia");
    expect(display[0]?.priceMinor).toBe(0);
    expect(projectDestinations.find((item) => item.slug === "orbia")?.purchasable).toBe(false);
    expect(listProjectCatalogProducts().some((item) => item.id.startsWith("proj-orbia"))).toBe(
      false,
    );
  });

  it("reuses Memoora and Cep Albüm source prices only", () => {
    expect(findProjectCatalogProduct("proj-memoora-magnet")?.priceMinor).toBe(6_600);
    expect(findProjectCatalogProduct("proj-memoora-keychain")?.priceMinor).toBe(5_400);
    expect(listProjectDisplayProducts("cep-album")).toHaveLength(4);
    expect(
      listProjectDisplayProducts("cep-album").every((item) => item.priceMinor === 20_000),
    ).toBe(true);
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
