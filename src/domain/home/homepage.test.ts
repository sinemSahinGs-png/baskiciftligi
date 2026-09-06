import { access } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { demoCategories } from "@/domain/catalog/demo-data";
import {
  homepageMedia,
  homepageShopCategorySlugs,
} from "@/domain/home/homepage";

describe("homepage catalog contract", () => {
  it("uses the four-step production copy", async () => {
    const { homepageProcessCopy, homepageProcessSteps } = await import(
      "@/domain/home/homepage"
    );
    expect(homepageProcessCopy.title).toBe("Nasıl çalışır?");
    expect(homepageProcessSteps).toHaveLength(4);
    expect(homepageProcessSteps[0]?.title.split(/\s+/).length).toBeLessThanOrEqual(4);
    expect(homepageProcessSteps[2]?.title).toContain("Süre ve gram");
    expect(homepageProcessSteps[0]?.title).toContain("Seç veya yükle");
  });
  it("maps shop categories to existing demo records and local images", async () => {
    const bySlug = new Map(
      demoCategories.map((category) => [category.slug, category]),
    );

    for (const slug of homepageShopCategorySlugs) {
      const category = bySlug.get(slug);
      expect(category).toBeDefined();
      expect(category?.imageUrl.startsWith("/demo/")).toBe(true);
      await expect(
        access(path.join(process.cwd(), "public", category!.imageUrl)),
      ).resolves.toBeUndefined();
    }
  });

  it("ships a local cinematic hero placeholder", async () => {
    for (const mediaPath of Object.values(homepageMedia)) {
      if (!mediaPath) {
        continue;
      }
      await expect(
        access(path.join(process.cwd(), "public", mediaPath)),
      ).resolves.toBeUndefined();
    }
  });
});
