"use client";

import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";

import { CategoryArtwork } from "@/components/catalog/category-artwork";
import { CATEGORY_OBJECT_POSITION } from "@/components/home-industrial/category-crops";
import {
  storefrontCategoryAsset,
  storefrontFilterCategories,
  type StorefrontCategorySlug,
} from "@/domain/catalog/storefront-taxonomy";
import type { Product } from "@/domain/catalog/types";

export function HomeCategories({ products }: { products: Product[] }) {
  void products;
  const t = useTranslations();
  const reduce = useReducedMotion() === true;
  const categories = storefrontFilterCategories();
  const railRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [page, setPage] = useState(1);
  const drag = useRef<{ x: number; left: number; active: boolean }>({
    x: 0,
    left: 0,
    active: false,
  });

  const sync = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setCanPrev(rail.scrollLeft > 6);
    setCanNext(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 6);
    const item = rail.querySelector("li");
    const width = item?.getBoundingClientRect().width ?? 1;
    setPage(Math.min(categories.length, Math.floor(rail.scrollLeft / Math.max(1, width)) + 1));
  }, [categories.length]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    sync();
    rail.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      rail.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  function stride() {
    const rail = railRef.current;
    const item = rail?.querySelector("li");
    if (!rail || !item) return 0;
    const gap = Number.parseFloat(getComputedStyle(rail).columnGap || getComputedStyle(rail).gap) || 12;
    return item.getBoundingClientRect().width + gap;
  }

  return (
    <section
      id="kategoriler"
      data-home-theme="obsidian"
      data-octo-zone="collection"
      className="octo-band octo-band-obsidian"
      aria-labelledby="home-cats-heading"
    >
      <div className="hi-shell octo-band-shell">
        <div className="octo-rail-head">
          <h2 id="home-cats-heading" className="octo-band-title octo-band-title-light hi-title">
            {t("home.makeTitle")}
          </h2>
          <div className="octo-rail-tools">
            <div className="octo-rail-arrows" hidden={!canPrev && !canNext}>
              <button
                type="button"
                className="octo-rail-arrow"
                aria-label={t("home.prevCat")}
                disabled={!canPrev}
                onClick={() =>
                  railRef.current?.scrollBy({
                    left: -stride(),
                    behavior: reduce ? "auto" : "smooth",
                  })
                }
              >
                ‹
              </button>
              <button
                type="button"
                className="octo-rail-arrow"
                aria-label={t("home.nextCat")}
                disabled={!canNext}
                onClick={() =>
                  railRef.current?.scrollBy({
                    left: stride(),
                    behavior: reduce ? "auto" : "smooth",
                  })
                }
              >
                ›
              </button>
            </div>
            <Link href={"/magaza" as Route} className="octo-text-link">
              {t("home.catsAll")}
            </Link>
          </div>
        </div>
        <ul
          ref={railRef}
          className="octo-equal-rail octo-cinematic-rail"
          data-category-rail=""
          onPointerDown={(event) => {
            const rail = railRef.current;
            if (!rail || event.pointerType === "touch") return;
            drag.current = { x: event.clientX, left: rail.scrollLeft, active: true };
            rail.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            const rail = railRef.current;
            if (!rail || !drag.current.active) return;
            rail.scrollLeft = drag.current.left - (event.clientX - drag.current.x);
          }}
          onPointerUp={() => {
            drag.current.active = false;
          }}
        >
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={category.href}
                className="octo-equal-card"
                data-category-slug={category.slug}
              >
                <span className="octo-equal-media" data-depth-layer="fore">
                  <CategoryArtwork
                    src={storefrontCategoryAsset(category.slug)}
                    objectPosition={
                      CATEGORY_OBJECT_POSITION[category.slug as StorefrontCategorySlug]
                    }
                    sizes="(max-width: 767px) 86vw, (max-width: 1023px) 42vw, 22vw"
                  />
                </span>
                <span className="octo-equal-name">{t(`categories.${category.slug}.name`)}</span>
                <span className="octo-equal-cta">{t("home.goCollection")}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="octo-rail-page" data-category-page="">
          {String(page).padStart(2, "0")} / {String(categories.length).padStart(2, "0")}
        </p>
      </div>
    </section>
  );
}
