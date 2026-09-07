import type { Route } from "next";
import Link from "next/link";

import { CategoryArtwork } from "@/components/catalog/category-artwork";
import { InteractiveMedia, WordReveal } from "@/components/motion/premium";
import {
  countStorefrontProducts,
  storefrontCategories,
} from "@/domain/catalog/storefront-taxonomy";
import type { Product } from "@/domain/catalog/types";
import { resolveStorefrontCategoryImage } from "@/lib/catalog/storefront-category-image";
import { cn } from "@/lib/utils";

export function HomeCategories({ products }: { products: Product[] }) {
  const [dominant, mediumA, mediumB, ...compact] = storefrontCategories;

  return (
    <section
      id="kategoriler"
      data-home-theme="ivory"
      className="hi-section hi-cats"
      aria-labelledby="home-cats-heading"
    >
      <div className="hi-shell">
        <div className="flex items-end justify-between gap-3">
          <WordReveal as="h2" id="home-cats-heading" className="hi-title" text="KATEGORİLER" />
          <Link href={"/magaza" as Route} className="hi-link">
            Tümünü gör →
          </Link>
        </div>
        <div className="hi-cats-grid mt-5">
          {dominant ? <CategoryCard category={dominant} products={products} size="dominant" /> : null}
          <div className="hi-cats-medium">
            {mediumA ? <CategoryCard category={mediumA} products={products} size="medium" /> : null}
            {mediumB ? <CategoryCard category={mediumB} products={products} size="medium" /> : null}
          </div>
          <div className="hi-cats-compact">
            {compact.map((category) => (
              <CategoryCard key={category.slug} category={category} products={products} size="compact" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryCard({
  category,
  products,
  size,
}: {
  category: (typeof storefrontCategories)[number];
  products: Product[];
  size: "dominant" | "medium" | "compact";
}) {
  const count = countStorefrontProducts(products, category);
  const cover = resolveStorefrontCategoryImage(category.slug);
  return (
    <InteractiveMedia className="hi-cat-interactive">
      <Link
        href={category.href}
        data-category-slug={category.slug}
        className={cn("hi-cat-card", `hi-cat-card-${size}`)}
      >
        <span className="hi-cat-media" aria-hidden="true">
          <CategoryArtwork
            src={cover}
            sizes={
              size === "dominant"
                ? "(max-width: 768px) 100vw, 48vw"
                : size === "medium"
                  ? "(max-width: 768px) 50vw, 24vw"
                  : "(max-width: 768px) 50vw, 18vw"
            }
          />
        </span>
        <span className="hi-cat-copy">
          <span className="hi-cat-name">
            {category.name}
            <span aria-hidden="true"> →</span>
          </span>
          <span className="hi-cat-desc">{category.description}</span>
          {category.comingSoon ? (
            <span className="hi-cat-meta">Hazırlanıyor</span>
          ) : count > 0 ? (
            <span className="hi-cat-meta">{count} ürün</span>
          ) : null}
        </span>
      </Link>
    </InteractiveMedia>
  );
}
