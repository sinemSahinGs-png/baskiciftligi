"use client";

import type { Route } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { CategoryArtwork } from "@/components/catalog/category-artwork";
import { CATEGORY_OBJECT_POSITION } from "@/components/home-industrial/category-crops";
import { WordReveal } from "@/components/motion/premium";
import type { StorefrontCategorySlug } from "@/domain/catalog/storefront-taxonomy";
import type { Product } from "@/domain/catalog/types";
import { homepageStageCategories } from "@/domain/project-destinations/stage";

const STAGE_CATEGORIES = homepageStageCategories();

export function HomeCategories({ products }: { products: Product[] }) {
  void products;
  const t = useTranslations();
  const catName = (slug: string) => t(`categories.${slug}.name`);
  const catDesc = (slug: string) => t(`categories.${slug}.description`);
  const featured = STAGE_CATEGORIES.filter((item) => item.kind === "project");
  const rest = STAGE_CATEGORIES.filter((item) => item.kind === "octo");

  return (
    <section
      id="kategoriler"
      data-home-theme="abyss"
      className="hi-section hi-cats atelier-panel atelier-cats"
      aria-labelledby="home-cats-heading"
    >
      <div className="hi-shell">
        <div className="hi-cats-head">
          <div>
            <p className="atelier-kicker">{t("home.catsKicker")}</p>
            <WordReveal
              as="h2"
              id="home-cats-heading"
              className="hi-title atelier-title"
              text={t("home.catsTitle")}
            />
          </div>
          <Link href={"/magaza" as Route} className="hi-link">
            {t("home.catsAll")}
          </Link>
        </div>

        <div className="atelier-cat-wall" aria-label={t("home.catsIndex")}>
          {featured.map((category, index) => {
            const number = String(index + 1).padStart(2, "0");
            return (
              <Link
                key={category.slug}
                href={category.href}
                className="atelier-cat-feature hi-cats-index-item"
                data-category-slug={category.slug}
                data-stage-kind={category.kind}
                aria-label={catName(category.slug)}
              >
                <CategoryArtwork
                  src={category.artwork}
                  objectPosition="50% 42%"
                  sizes="(max-width: 767px) 92vw, 32vw"
                />
                {category.logo ? (
                  <img className="atelier-cat-logo" src={category.logo} alt="" />
                ) : null}
                <span className="atelier-cat-copy">
                  <span className="hi-cats-index-num">{number}</span>
                  <span className="hi-cats-index-name">{catName(category.slug)}</span>
                  <span className="atelier-cat-desc">{catDesc(category.slug)}</span>
                </span>
              </Link>
            );
          })}
        </div>

        <div className="atelier-cat-grid">
          {rest.map((category, index) => {
            const number = String(featured.length + index + 1).padStart(2, "0");
            const label = category.comingSoon
              ? `${catName(category.slug)}, ${t("common.comingSoon")}`
              : catName(category.slug);
            const inner = (
              <>
                <CategoryArtwork
                  src={category.artwork}
                  objectPosition={
                    CATEGORY_OBJECT_POSITION[category.slug as StorefrontCategorySlug]
                  }
                  sizes="(max-width: 767px) 46vw, 18vw"
                />
                <span className="atelier-cat-copy">
                  <span className="hi-cats-index-num">{number}</span>
                  <span className="hi-cats-index-name">{catName(category.slug)}</span>
                  {category.comingSoon ? (
                    <span className="hi-cat-badge">{t("common.comingSoon")}</span>
                  ) : null}
                </span>
              </>
            );
            if (category.comingSoon) {
              return (
                <button
                  key={category.slug}
                  type="button"
                  className="atelier-cat-tile hi-cats-index-item"
                  data-category-slug={category.slug}
                  data-coming-soon="true"
                  aria-label={label}
                >
                  {inner}
                </button>
              );
            }
            return (
              <Link
                key={category.slug}
                href={category.href}
                className="atelier-cat-tile hi-cats-index-item"
                data-category-slug={category.slug}
                aria-label={label}
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
