"use client";

import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";

import { PriceDisplay } from "@/components/commerce/price-display";
import { SafeImage } from "@/components/media/safe-image";
import type { Product } from "@/domain/catalog/types";
import { listHomepageCuratedCards } from "@/domain/project-destinations/curated";

export function CuratedCollection({ products }: { products: Product[] }) {
  const t = useTranslations();
  const cards = listHomepageCuratedCards(products);
  const reduce = useReducedMotion() === true;
  const railRef = useRef<HTMLUListElement>(null);
  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startScroll: 0,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(cards.length > 1);

  const syncEdges = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setCanPrev(rail.scrollLeft > 6);
    setCanNext(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 6);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    syncEdges();
    rail.addEventListener("scroll", syncEdges, { passive: true });
    window.addEventListener("resize", syncEdges);
    return () => {
      rail.removeEventListener("scroll", syncEdges);
      window.removeEventListener("resize", syncEdges);
    };
  }, [syncEdges, cards.length]);

  function cardStride() {
    const rail = railRef.current;
    const item = rail?.querySelector("li");
    if (!rail || !item) return 0;
    const styles = getComputedStyle(rail);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 12;
    return item.getBoundingClientRect().width + gap;
  }

  function move(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction * cardStride(),
      behavior: reduce ? "auto" : "smooth",
    });
  }

  function onPointerDown(event: PointerEvent<HTMLUListElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    const rail = railRef.current;
    if (!rail) return;
    dragRef.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      startScroll: rail.scrollLeft,
    };
    rail.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLUListElement>) {
    const drag = dragRef.current;
    const rail = railRef.current;
    if (!drag.active || !rail) return;
    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > 6) drag.moved = true;
    rail.scrollLeft = drag.startScroll - delta;
  }

  function endDrag(event: PointerEvent<HTMLUListElement>) {
    const rail = railRef.current;
    dragRef.current.active = false;
    if (rail?.hasPointerCapture(event.pointerId)) {
      rail.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <section
      id="mevcut-urunler"
      data-home-theme="abyss"
      className="atelier-panel octo-curated atelier-curated"
      aria-labelledby="curated-heading"
    >
      <div className="hi-shell">
        <p className="atelier-num">03</p>
        <p className="atelier-kicker">{t("home.curatedKicker")}</p>
        <div className="octo-curated-head">
          <h2 id="curated-heading" className="atelier-title">
            {t("home.productsShopTitle")}
          </h2>
          <div className="octo-curated-tools">
            <div className="octo-curated-arrows">
              <button
                type="button"
                className="octo-curated-arrow"
                aria-label={t("home.prevRail")}
                disabled={!canPrev}
                onClick={() => move(-1)}
              >
                ‹
              </button>
              <button
                type="button"
                className="octo-curated-arrow"
                aria-label={t("home.nextRail")}
                disabled={!canNext}
                onClick={() => move(1)}
              >
                ›
              </button>
            </div>
            <Link href={"/magaza" as Route} className="hi-link octo-link-dark">
              {t("home.allProductsLink")}
            </Link>
          </div>
        </div>
        <ul
          ref={railRef}
          className="octo-curated-rail"
          data-curated-rail=""
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={(event) => {
            if (dragRef.current.moved) {
              event.preventDefault();
              event.stopPropagation();
              dragRef.current.moved = false;
            }
          }}
        >
          {cards.map((card) => (
            <li key={card.id}>
              <Link
                href={card.href}
                className="octo-curated-card"
                data-real-product-slug={card.id}
                data-project-label={card.label}
              >
                <span className="octo-curated-media">
                  {card.image ? (
                    <SafeImage
                      src={card.image}
                      alt={card.name}
                      fill
                      sizes="(max-width: 767px) 86vw, (max-width: 1023px) 42vw, 22vw"
                      className="object-cover"
                    />
                  ) : null}
                </span>
                <span className="octo-curated-label">{card.label}</span>
                <span className="octo-curated-name">{card.name}</span>
                {card.priceSoon ? (
                  <span className="octo-curated-price">{t("home.priceSoon")}</span>
                ) : (
                  <PriceDisplay
                    priceMinor={card.priceMinor ?? 0}
                    className="octo-curated-price"
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
