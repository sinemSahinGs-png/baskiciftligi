import type { Route } from "next";

import type { Product } from "@/domain/catalog/types";
import {
  listProjectDisplayProducts,
  projectDestinations,
} from "@/domain/project-destinations/catalog";

export type HomepageCuratedCard = {
  id: string;
  name: string;
  image: string;
  href: Route;
  label: string;
  priceMinor: number | null;
  priceSoon: boolean;
};

function projectCards(): HomepageCuratedCard[] {
  const orbia = projectDestinations.find((item) => item.slug === "orbia");
  const memoora = projectDestinations.find((item) => item.slug === "memoora");
  const disc = projectDestinations.find((item) => item.slug === "lil-disc");
  const orbiaProduct = listProjectDisplayProducts("orbia")[0];
  const memooraProducts = listProjectDisplayProducts("memoora");
  const discProducts = listProjectDisplayProducts("lil-disc").slice(0, 2);

  const cards: HomepageCuratedCard[] = [];
  for (const product of memooraProducts) {
    if (!memoora) continue;
    cards.push({
      id: product.id,
      name: product.name,
      image: product.media[0]?.url ?? memoora.artwork,
      href: memoora.href,
      label: memoora.name,
      priceMinor: product.priceMinor,
      priceSoon: false,
    });
  }
  for (const product of discProducts) {
    if (!disc) continue;
    cards.push({
      id: product.id,
      name: product.name,
      image: product.media[0]?.url ?? disc.artwork,
      href: disc.href,
      label: disc.name,
      priceMinor: product.priceMinor,
      priceSoon: false,
    });
  }
  if (orbia && orbiaProduct) {
    cards.push({
      id: orbiaProduct.id,
      name: orbiaProduct.name,
      image: orbiaProduct.media[0]?.url ?? orbia.artwork,
      href: orbia.href,
      label: orbia.name,
      priceMinor: null,
      priceSoon: true,
    });
  }
  return cards;
}

export function listHomepageCuratedCards(octoProducts: Product[]): HomepageCuratedCard[] {
  const projects = projectCards();
  const octo = octoProducts
    .filter((product) => !product.categorySlugs.some((slug) => slug.startsWith("project:")))
    .slice(0, 4)
    .map((product): HomepageCuratedCard => ({
      id: product.id,
      name: product.name,
      image: product.media[0]?.url ?? "",
      href: `/urun/${product.slug}` as Route,
      label: "OCTO STUDIO",
      priceMinor: product.priceMinor,
      priceSoon: false,
    }));
  return [...projects, ...octo];
}
