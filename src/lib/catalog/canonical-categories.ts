import { demoCategories } from "@/domain/catalog/demo-data";
import { homepageShopCategorySlugs } from "@/domain/home/homepage";
import { stageForCategory, type StagePreset } from "@/domain/visual/stages";
import { categoryCoverPublicPath } from "@/lib/catalog/category-cover";

export interface CanonicalCategoryDefinition {
  slug: string;
  name: string;
  description: string;
  eyebrow: string;
  imageUrl: string;
  position: number;
  stagePreset: StagePreset;
  isFeatured: boolean;
}

export function listCanonicalCategories(): CanonicalCategoryDefinition[] {
  const bySlug = new Map(
    demoCategories.map((category) => [category.slug, category]),
  );

  return homepageShopCategorySlugs.map((slug, index) => {
    const source = bySlug.get(slug);
    if (!source) {
      throw new Error(`Kanonical kategori tanımı eksik: ${slug}`);
    }

    return {
      slug,
      name: source.name,
      description: source.description,
      eyebrow: source.eyebrow ?? "Koleksiyon",
      imageUrl: source.imageUrl || categoryCoverPublicPath(slug),
      position: index + 1,
      stagePreset: stageForCategory(slug),
      isFeatured: index < 5,
    };
  });
}

export function canonicalCategorySlugs(): string[] {
  return [...homepageShopCategorySlugs];
}
