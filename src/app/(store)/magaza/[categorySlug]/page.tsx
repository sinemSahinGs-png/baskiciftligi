import type { Route } from "next";
import { notFound, redirect } from "next/navigation";

import {
  getStorefrontCategory,
  storefrontSlugFromSource,
} from "@/domain/catalog/storefront-taxonomy";
import { listCategories } from "@/domain/catalog/repository";

export async function generateStaticParams() {
  const categories = await listCategories();
  return categories.map((category) => ({
    categorySlug: category.slug,
  }));
}

export default async function LegacyStoreCategoryPage(
  props: PageProps<"/magaza/[categorySlug]">,
) {
  const { categorySlug } = await props.params;
  if (categorySlug === "kurumsal-promosyon") {
    redirect("/toptan" as Route);
  }
  const storefront = getStorefrontCategory(categorySlug);
  if (storefront) {
    redirect(storefront.href);
  }
  const mapped = storefrontSlugFromSource(categorySlug);
  if (mapped) {
    const destination = getStorefrontCategory(mapped);
    if (destination) {
      redirect(destination.href);
    }
  }
  notFound();
}
