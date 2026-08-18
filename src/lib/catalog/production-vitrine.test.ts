import { describe, expect, it } from "vitest";

import { productionVitrineSnapshot } from "./production-vitrine";

describe("production vitrine snapshot", () => {
  it("shows bundled category covers without sellable demo products", () => {
    const snapshot = productionVitrineSnapshot("2026-08-19T00:00:00.000Z");
    expect(snapshot.products).toEqual([]);
    expect(snapshot.categories.length).toBeGreaterThan(5);
    expect(
      snapshot.categories.every((category) =>
        category.imageUrl.endsWith(".png"),
      ),
    ).toBe(true);
    expect(
      snapshot.categories.some((category) => category.slug === "anahtarlik"),
    ).toBe(true);
  });
});
