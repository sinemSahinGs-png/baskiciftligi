import type { Route } from "next";

import {
  storefrontCategories,
  storefrontCategoryAsset,
  type StorefrontCategory,
} from "@/domain/catalog/storefront-taxonomy";
import {
  projectDestinations,
  type ProjectDestination,
} from "@/domain/project-destinations/catalog";

export type HomepageStageEntry = {
  slug: string;
  name: string;
  description: string;
  href: Route;
  artwork: string;
  logo?: string;
  comingSoon: boolean;
  kind: "octo" | "project";
};

export function homepageStageCategories(): HomepageStageEntry[] {
  return [
    ...storefrontCategories.map(
      (category: StorefrontCategory): HomepageStageEntry => ({
        slug: category.slug,
        name: category.name,
        description: category.description,
        href: category.href,
        artwork: storefrontCategoryAsset(category.slug),
        comingSoon: category.comingSoon,
        kind: "octo",
      }),
    ),
    ...projectDestinations.map(
      (destination: ProjectDestination): HomepageStageEntry => ({
        slug: destination.slug,
        name: destination.name,
        description: destination.description,
        href: destination.href,
        artwork: destination.artwork,
        logo: destination.logo,
        comingSoon: false,
        kind: "project",
      }),
    ),
  ];
}
