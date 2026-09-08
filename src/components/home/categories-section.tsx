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
    .filter((category): category is Category => Boolean(category))
    .slice(0, 6);
  const [first, second, ...rest] = visible;

  return (
    <section id="kategoriler" className="home-section">
      <div className="home-shell">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="home-title home-mask-reveal">
              {categoriesIntro?.title ?? "Kategoriler"}
            </h2>
            <p className="home-lede">
              {categoriesIntro?.description ?? "Koleksiyonu sahne sahne gez."}
            </p>
          </div>
          <Link href={"/magaza" as Route} className="home-see-all hidden sm:inline-flex">
            Tümünü gör
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {first ? (
            <CategoryTile category={first} count={counts.get(first.slug)} large />
          ) : null}
          {second ? (
            <CategoryTile category={second} count={counts.get(second.slug)} large />
          ) : null}
          {rest.map((category) => (
            <CategoryTile
              key={category.id}
              category={category}
              count={counts.get(category.slug)}
            />
          ))}
        </div>

        <Link href={"/magaza" as Route} className="home-see-all mt-4 sm:hidden">
          Tümünü gör
        </Link>
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
        "home-press-card group relative col-span-1 block overflow-hidden rounded-[1.25rem] border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan",
        large ? "min-h-[12.5rem]" : "min-h-[9.5rem]",
      )}
    >
      <span className={cn("relative block", large ? "aspect-[4/3]" : "aspect-[4/3]")}>
        <SafeImage
          src={cover}
          alt=""
          fill
          sizes={large ? "(max-width: 768px) 50vw, 50vw" : "(max-width: 768px) 50vw, 33vw"}
          className={categoryImageFitClass(presentation.fit)}
          style={categoryImageStyle(presentation)}
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <span className="absolute inset-x-0 bottom-0 p-3.5">
          <span className="font-heading text-[1.2rem] leading-6 font-bold tracking-[-0.04em] text-white sm:text-2xl">
            {category.name}
          </span>
          {typeof count === "number" ? (
            <span className="mt-1 block text-[0.875rem] leading-5 text-white/90">
              {count} ürün
            </span>
          ) : null}
        </span>
      </span>
    </Link>
  );
}
