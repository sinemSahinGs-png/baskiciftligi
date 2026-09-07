import { existsSync } from "node:fs";
import path from "node:path";

import {
  storefrontCategories,
  storefrontCategoryAsset,
  type StorefrontCategorySlug,
} from "@/domain/catalog/storefront-taxonomy";

export function resolveStorefrontCategoryImage(
  slug: StorefrontCategorySlug,
): string | null {
  const publicPath = storefrontCategoryAsset(slug);
  const absolute = path.join(process.cwd(), "public", publicPath);
  return existsSync(absolute) ? publicPath : null;
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
