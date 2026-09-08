import { existsSync } from "node:fs";
import path from "node:path";

import {
  storefrontCategories,
  storefrontCategoryAsset,
  type StorefrontCategory,
  type StorefrontCategorySlug,
} from "@/domain/catalog/storefront-taxonomy";

export function storefrontCategoryAbsolutePath(
  category: Pick<StorefrontCategory, "assetFile"> | StorefrontCategorySlug,
): string {
  const assetFile =
    typeof category === "string"
      ? storefrontCategories.find((item) => item.slug === category)?.assetFile
      : category.assetFile;
  return path.join(
    process.cwd(),
    "public",
    "images",
    "categories",
    assetFile ?? `${String(category)}.png`,
  );
}

export function resolveStorefrontCategoryImage(
  slug: StorefrontCategorySlug,
): string | null {
  const publicPath = storefrontCategoryAsset(slug);
  return existsSync(storefrontCategoryAbsolutePath(slug)) ? publicPath : null;
}

export function resolveAllStorefrontCategoryImages(): Record<
  StorefrontCategorySlug,
  string | null
> {
  return Object.fromEntries(
    storefrontCategories.map((category) => [
      category.slug,
      resolveStorefrontCategoryImage(category.slug),
    ]),
  ) as Record<StorefrontCategorySlug, string | null>;
}
