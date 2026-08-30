import { describe, expect, it } from "vitest";

import { loadThingiverseFixture } from "./fixtures";
import { normalizeLicense } from "@/domain/manufacturing/licenses";
import { normalizeThingImages } from "@/providers/thingiverse/normalize-detail";

describe("Thingiverse fixtures", () => {
  it("serves popular things shaped like the official API", async () => {
    const things = await loadThingiverseFixture<Array<{ id: number; license?: string }>>(
      "/popular?page=1",
    );
    expect(things).toHaveLength(2);
    expect(normalizeLicense(things[0]?.license).automaticManufacturingAllowed).toBe(true);
    expect(normalizeLicense(things[1]?.license).commercialUse).toBe("prohibited");
  });

  it("lists printable files for a thing", async () => {
    const files = await loadThingiverseFixture<Array<{ name?: string }>>("/things/1001/files");
    expect(files[0]?.name).toBe("cube.stl");
  });

  it("returns a single-image object for production regression id", async () => {
    const raw = await loadThingiverseFixture<unknown>("/things/1587568/images");
    expect(Array.isArray(raw)).toBe(false);
    expect(normalizeThingImages(raw)).toEqual([
      { url: "https://cdn.thingiverse.com/site/img/thingiverse_logo.png" },
    ]);
  });
});
