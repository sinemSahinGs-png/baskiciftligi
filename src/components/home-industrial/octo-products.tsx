"use client";

import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";

import { PriceDisplay } from "@/components/commerce/price-display";
import { SafeImage } from "@/components/media/safe-image";
import type { Product } from "@/domain/catalog/types";
import { useFavoritesStore } from "@/stores/favorites-store";

function stockLabel(product: Product, t: ReturnType<typeof useTranslations>) {
  const qty = product.inventoryQuantity;
  if (qty <= 0) return t("home.soldOut");
  if (product.kind === "made_to_order") return t("home.madeToOrder");
  return t("home.inStock");
}

export function OctoProducts({
  products,
  catalogStatus = "empty",
}: {
  products: Product[];
  catalogStatus?: "populated" | "empty-preview" | "empty";
}) {
  const t = useTranslations();
  const reduce = useReducedMotion() === true;
  const visible = products.filter(
    (product) =>
      Boolean(product.media[0]?.url) &&
      !product.name.startsWith("Guided UI") &&
      !product.categorySlugs.some((slug) => slug.startsWith("project:")),
  );
  const railRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(visible.length > 1);
  const favoriteIds = useFavoritesStore((state) => state.productIds);
  const favoritesHydrated = useFavoritesStore((state) => state.hasHydrated);
  const toggleFavorite = useFavoritesStore((state) => state.toggle);

  const sync = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setCanPrev(rail.scrollLeft > 6);
    setCanNext(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 6);
  }, []);

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
  }, [sync, visible.length]);

  function stride() {
    const rail = railRef.current;
    const item = rail?.querySelector("li");
    if (!rail || !item) return 0;
    const gap = Number.parseFloat(getComputedStyle(rail).columnGap || getComputedStyle(rail).gap) || 12;
    return item.getBoundingClientRect().width + gap;
  }

  return (
    <section
      id="mevcut-urunler"
      data-home-theme="ivory"
      data-octo-zone="floor"
      data-catalog-status={catalogStatus}
      className="octo-band octo-band-island octo-shelf"
      aria-labelledby="curated-heading"
    >
      <div className="hi-shell octo-band-shell">
        <div className="octo-rail-head">
          <h2 id="curated-heading" className="octo-band-title">
            {t("home.productsShopTitle")}
          </h2>
          <div className="octo-rail-tools">
            <div className="octo-rail-arrows">
              <button
                type="button"
                className="octo-rail-arrow octo-rail-arrow-dark"
                aria-label={t("home.prevRail")}
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
                className="octo-rail-arrow octo-rail-arrow-dark"
                aria-label={t("home.nextRail")}
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
            <Link href={"/magaza" as Route} className="octo-text-link octo-text-link-dark">
              {t("home.allProductsLink")}
            </Link>
          </div>
        </div>
        {visible.length === 0 ? (
          <div className="octo-empty" data-empty-catalog={catalogStatus}>
            <p>
              {catalogStatus === "empty-preview"
                ? t("home.productsEmptyPreview")
                : t("home.productsEmpty")}
            </p>
            <p>{t("home.productsEmptyBody")}</p>
            <Link href={"/model-yukle" as Route} className="octo-start-cta">
              {t("home.emptyCta")}
            </Link>
          </div>
        ) : (
          <ul ref={railRef} className="octo-equal-rail octo-product-rail-row" data-curated-rail="">
            {visible.map((product) => {
              const isFavorite = favoritesHydrated && favoriteIds.includes(product.id);
              return (
                <li key={product.id}>
                  <article className="octo-shop-card">
                    <button
                      type="button"
                      className="octo-shop-fav"
                      aria-label={
                        isFavorite
                          ? `${product.name} ürününü favorilerden çıkar`
                          : `${product.name} ürününü favorilere ekle`
                      }
                      aria-pressed={isFavorite}
                      disabled={!favoritesHydrated}
                      onClick={() => favoritesHydrated && toggleFavorite(product.id)}
                    >
                      <Heart className="size-4" fill={isFavorite ? "currentColor" : "none"} />
                    </button>
                    <Link
                      href={`/urun/${product.slug}` as Route}
                      className="octo-shop-media"
                      data-real-product-slug={product.slug}
                    >
                      <SafeImage
                        src={product.media[0]?.url ?? ""}
                        alt={product.name}
                        fill
                        sizes="(max-width: 767px) 86vw, (max-width: 1023px) 42vw, 22vw"
                        className="object-cover"
                      />
                    </Link>
                    <div className="octo-shop-meta">
                      <h3>{product.name}</h3>
                      <PriceDisplay priceMinor={product.priceMinor} className="octo-shop-price" />
                      <p className="octo-shop-stock">{stockLabel(product, t)}</p>
                      <Link href={`/urun/${product.slug}` as Route} className="octo-shop-cta">
                        {t("home.inspect")}
                      </Link>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
