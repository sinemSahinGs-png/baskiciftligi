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

const HOMEPAGE_PROJECT_ORDER = ["memoora", "lil-disc", "orbia"] as const;

export function homepageStageCategories(): HomepageStageEntry[] {
  const projects = HOMEPAGE_PROJECT_ORDER.flatMap((slug) => {
    const destination = projectDestinations.find((item) => item.slug === slug);
    if (!destination) return [];
    return [
      {
        slug: destination.slug,
        name: destination.name,
        description: destination.description,
        href: destination.href,
        artwork: destination.artwork,
        logo: destination.logo,
        comingSoon: false,
        kind: "project" as const,
      },
    ];
  });
  const octo = storefrontCategories.map(
    (category: StorefrontCategory): HomepageStageEntry => ({
      slug: category.slug,
      name: category.name,
      description: category.description,
      href: category.href,
      artwork: storefrontCategoryAsset(category.slug),
      comingSoon: category.comingSoon,
      kind: "octo",
    }),
  );
  return [...projects, ...octo];
}
