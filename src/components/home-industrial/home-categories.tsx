import type { Route } from "next";
import Link from "next/link";

import { CategoryArtwork } from "@/components/catalog/category-artwork";
import { CATEGORY_OBJECT_POSITION } from "@/components/home-industrial/category-crops";
import { InteractiveMedia, WordReveal } from "@/components/motion/premium";
import { storefrontCategories } from "@/domain/catalog/storefront-taxonomy";
import type { Product } from "@/domain/catalog/types";
import { resolveStorefrontCategoryImage } from "@/lib/catalog/storefront-category-image";
import { cn } from "@/lib/utils";

export function HomeCategories({ products }: { products: Product[] }) {
  void products;
  const [lead, ...supporting] = storefrontCategories;

  return (
    <section
      id="kategoriler"
      data-home-theme="mono"
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
          {lead ? (
            <CategoryCard category={lead} index={1} size="lead" />
          ) : null}
          {supporting.map((category, offset) => (
            <CategoryCard
              key={category.slug}
              category={category}
              index={offset + 2}
              size="support"
            />
          ))}
        </div>
      </div>
      <div className="hi-cats-handoff" aria-hidden="true">
        <span className="hi-cats-handoff-rule" />
      </div>
    </section>
  );
}

function CategoryCard({
  category,
  index,
  size,
}: {
  category: (typeof storefrontCategories)[number];
  index: number;
  size: "lead" | "support";
}) {
  const cover = resolveStorefrontCategoryImage(category.slug);
  const number = String(index).padStart(2, "0");
  return (
    <InteractiveMedia className={cn("hi-cat-interactive", size === "lead" && "hi-cat-lead")}>
      <Link
        href={category.href}
        data-category-slug={category.slug}
        data-cat-size={size}
        className={cn("hi-cat-card", size === "lead" ? "hi-cat-card-lead" : "hi-cat-card-support")}
      >
        <span className="hi-cat-media" aria-hidden="true">
          <CategoryArtwork
            src={cover}
            objectPosition={CATEGORY_OBJECT_POSITION[category.slug]}
            sizes={
              size === "lead"
                ? "(max-width: 767px) 100vw, 42vw"
                : "(max-width: 767px) 50vw, 24vw"
            }
          />
        </span>
        {category.comingSoon ? (
          <span className="hi-cat-badge">Hazırlanıyor</span>
        ) : null}
        <span className="hi-cat-copy">
          <span className="hi-cat-index">{number}</span>
          <span className="hi-cat-name">{category.name}</span>
          <span className="hi-cat-desc">{category.description}</span>
          <span className="hi-cat-arrow" aria-hidden="true">
            →
          </span>
        </span>
      </Link>
    </InteractiveMedia>
  );
}
