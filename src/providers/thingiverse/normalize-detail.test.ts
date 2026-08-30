import { describe, expect, it } from "vitest";

import {
  coerceThingiverseTags,
  normalizeThingDetail,
  normalizeThingFiles,
  normalizeThingImages,
} from "@/providers/thingiverse/normalize-detail";

describe("normalizeThingDetail", () => {
  it("passes through a thing record", () => {
    const thing = normalizeThingDetail({
      id: 1587568,
      name: "Sample vase",
      public_url: "https://www.thingiverse.com/thing:1587568",
      license: "Creative Commons - Attribution",
      creator: { name: "maker" },
    });
    expect(thing.id).toBe(1587568);
    expect(thing.name).toBe("Sample vase");
  });

  it("unwraps nested thing objects", () => {
    const thing = normalizeThingDetail({
      thing: { id: 42, name: "Nested" },
    });
    expect(thing.id).toBe(42);
  });

  it("coerces object licenses and tag shapes", () => {
    const thing = normalizeThingDetail({
      id: 1,
      license: { name: "Creative Commons - Attribution" },
      tags: "vase",
      categories: { name: "household" },
      default_image: "https://cdn.example/thumb.jpg",
    });
    expect(thing.license).toContain("Attribution");
    expect(thing.tags).toEqual(["vase"]);
    expect(thing.categories).toEqual([{ name: "household" }]);
    expect(thing.default_image?.url).toBe("https://cdn.example/thumb.jpg");
  });
});

describe("normalizeThingImages", () => {
  it("accepts arrays", () => {
    expect(
      normalizeThingImages([{ url: "https://cdn.example/a.jpg" }]),
    ).toEqual([{ id: undefined, url: "https://cdn.example/a.jpg" }]);
  });

  it("accepts a single image object (production bug shape)", () => {
    expect(
      normalizeThingImages({
        id: 9,
        url: "https://cdn.example/one.jpg",
      }),
    ).toEqual([{ id: 9, url: "https://cdn.example/one.jpg" }]);
  });

  it("returns empty for nullish payloads", () => {
    expect(normalizeThingImages(null)).toEqual([]);
  });
});

describe("normalizeThingFiles", () => {
  it("accepts arrays", () => {
    expect(
      normalizeThingFiles([{ id: 1, name: "part.stl", download_url: "https://x" }]),
    ).toHaveLength(1);
  });

  it("accepts a single file object", () => {
    expect(
      normalizeThingFiles({
        id: 2,
        name: "vase.stl",
        download_url: "https://api.thingiverse.com/files/2",
      }),
    ).toEqual([
      expect.objectContaining({ id: 2, name: "vase.stl" }),
    ]);
  });
});

describe("coerceThingiverseTags", () => {
  it("wraps scalar and object tags safely", () => {
    expect(coerceThingiverseTags("keychain")).toEqual(["keychain"]);
    expect(coerceThingiverseTags({ name: "art" })).toEqual([{ name: "art" }]);
    expect(coerceThingiverseTags(undefined)).toEqual([]);
  });
});
