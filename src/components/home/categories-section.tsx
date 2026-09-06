"use client";

import type { Route } from "next";
import Link from "next/link";

import { SafeImage } from "@/components/media/safe-image";
import type { Category, Product } from "@/domain/catalog/types";
import { homepageShopCategorySlugs } from "@/domain/home/homepage";
import {
  categoryImageFitClass,
  categoryImageStyle,
  resolveCategoryImagePresentation,
} from "@/lib/catalog/category-image";
import { cn } from "@/lib/utils";

export function CategoriesSection({
  categories,
  products,
  categoriesIntro,
}: {
  categories: Category[];
  products: Product[];
  categoriesIntro?: { title: string; description: string };
}) {
  const counts = new Map<string, number>();
  for (const product of products) {
    for (const slug of product.categorySlugs) {
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }
  const visible = homepageShopCategorySlugs
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter((category): category is Category => Boolean(category));
  const [first, second, ...rest] = visible;

  return (
    <section id="kategoriler" className="bg-[#111318] py-12 text-light-text sm:py-16">
      <div className="home-shell">
        <h2 className="font-heading text-[1.65rem] leading-[1.08] font-bold tracking-[-0.04em] sm:text-3xl">
          {categoriesIntro?.title ?? "Kategoriler"}
        </h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-white/70">
          {categoriesIntro?.description ?? "Koleksiyonu sahne sahne gez."}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {first ? <CategoryTile category={first} count={counts.get(first.slug)} large /> : null}
          {second ? <CategoryTile category={second} count={counts.get(second.slug)} large /> : null}
        </div>
        {rest.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
            {rest.map((category) => (
              <CategoryTile
                key={category.id}
                category={category}
                count={counts.get(category.slug)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function CategoryTile({
  category,
  count,
  large = false,
}: {
  category: Category;
  count?: number;
  large?: boolean;
}) {
  const cover = category.heroMediaUrl ?? category.imageUrl;
  const presentation = resolveCategoryImagePresentation(category);

  return (
    <Link
      href={`/magaza/${category.slug}` as Route}
      className={cn(
        "group relative block overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan",
        large ? "min-h-[13.5rem]" : "min-h-[9.5rem]",
      )}
    >
      <span className={cn("relative block", large ? "aspect-[4/3] sm:aspect-[16/10]" : "aspect-[4/3]")}>
        <SafeImage
          src={cover}
          alt=""
          fill
          sizes={large ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 33vw"}
          className={cn(
            categoryImageFitClass(presentation.fit),
            "transition duration-500 group-active:scale-[1.03] group-hover:scale-[1.03]",
          )}
          style={categoryImageStyle(presentation)}
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/10" />
        <span className="absolute inset-x-0 bottom-0 p-4">
          <span className="font-heading text-xl font-bold tracking-[-0.04em] text-white sm:text-2xl">
            {category.name}
          </span>
          {typeof count === "number" ? (
            <span className="mt-1 block text-sm text-white/80">{count} ürün</span>
          ) : null}
        </span>
      </span>
    </Link>
  );
}
