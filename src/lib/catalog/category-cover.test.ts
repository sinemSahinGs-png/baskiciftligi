import { describe, expect, it } from "vitest";

import {
  categoryCoverPublicPath,
  resolveCategoryCoverUrl,
} from "./category-cover";

describe("category cover paths", () => {
  it("uses a PNG named after the slug", () => {
    expect(categoryCoverPublicPath("ev-ve-dekorasyon")).toBe(
      "/demo/categories/ev-ve-dekorasyon.png",
    );
  });

  it("replaces missing or SVG covers with the PNG path", () => {
    expect(resolveCategoryCoverUrl("anahtarlik", "")).toBe(
      "/demo/categories/anahtarlik.png",
    );
    expect(
      resolveCategoryCoverUrl("anahtarlik", "/demo/categories/anahtarlik.svg"),
    ).toBe("/demo/categories/anahtarlik.png");
    expect(
      resolveCategoryCoverUrl("anahtarlik", "/demo/categories/anahtarlik.png"),
    ).toBe("/demo/categories/anahtarlik.png");
  });
});
