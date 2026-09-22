"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { PriceDisplay } from "@/components/commerce/price-display";
import { SafeImage } from "@/components/media/safe-image";
import { ProductMediaReveal, WordReveal } from "@/components/motion/premium";
import type { Product } from "@/domain/catalog/types";
import { HOME_EMPTY_CATALOG } from "@/components/home-industrial/real-products";
import { cn } from "@/lib/utils";

function stockLabel(product: Product) {
  if (product.inventoryQuantity <= 0) return "Tükendi";
  return product.kind === "made_to_order" ? "Siparişe göre" : "Stokta";
}

export function ProductDiscoveryRail({ products }: { products: Product[] }) {
  const featured = products.find((product) => product.featured) ?? products[0] ?? null;
  const supporting = products.filter((product) => product.id !== featured?.id).slice(0, 6);
  const railRef = useRef<HTMLUListElement>(null);
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startScroll: number;
    active: boolean;
  } | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  function updateEdges() {
    const rail = railRef.current;
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    setCanPrev(rail.scrollLeft > 8);
    setCanNext(rail.scrollLeft < max - 8);
  }

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    updateEdges();
    rail.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      rail.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [supporting.length]);

  function scrollByCard(direction: 1 | -1) {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector("li");
    const width = card ? card.getBoundingClientRect().width + 12 : 220;
    rail.scrollBy({ left: direction * width, behavior: "smooth" });
  }

  function onPointerDown(event: ReactPointerEvent<HTMLUListElement>) {
    if (event.pointerType === "touch") return;
    const rail = railRef.current;
    if (!rail) return;
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: rail.scrollLeft,
      active: false,
    };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLUListElement>) {
    const state = drag.current;
    const rail = railRef.current;
    if (!state || !rail || event.pointerId !== state.pointerId) return;
    const dx = event.clientX - state.startX;
    if (!state.active && Math.abs(dx) < 8) return;
    state.active = true;
    rail.scrollLeft = state.startScroll - dx;
  }

  function endDrag(event: ReactPointerEvent<HTMLUListElement>) {
    const state = drag.current;
    if (!state || event.pointerId !== state.pointerId) return;
    drag.current = null;
  }

  return (
    <section
      id="mevcut-urunler"
      data-home-theme="ivory"
      className="hi-section hi-store-stage"
      aria-labelledby="real-products-heading"
    >
      <div className="hi-shell">
        <div className="flex items-end justify-between gap-3">
          <WordReveal
            as="h2"
            id="real-products-heading"
            className="hi-title"
            text="MAĞAZA ÜRÜNLERİ"
          />
          <Link href={"/magaza" as Route} className="hi-link shrink-0">
            TÜM ÜRÜNLERİ GÖR
          </Link>
        </div>
        {products.length === 0 || !featured ? (
          <div className="hi-empty-catalog" data-empty-catalog="">
            <p className="hi-empty-catalog-title">{HOME_EMPTY_CATALOG.title}</p>
            <p className="hi-empty-catalog-body">{HOME_EMPTY_CATALOG.body}</p>
            <Link href={"/model-yukle" as Route} className="hi-btn">
              {HOME_EMPTY_CATALOG.cta}
            </Link>
          </div>
        ) : (
          <div className="hi-discovery">
            <Link
              href={`/urun/${featured.slug}` as Route}
              className="hi-discovery-feature"
              data-real-product-slug={featured.slug}
            >
              <ProductMediaReveal className="hi-discovery-feature-media">
                <SafeImage
                  src={featured.media[0]?.url}
                  alt={featured.media[0]?.alt ?? featured.name}
                  fill
                  sizes="(max-width: 768px) 88vw, 42vw"
                  className="object-cover"
                  priority
                />
              </ProductMediaReveal>
              <span className="hi-discovery-copy">
                <span className="hi-discovery-name">{featured.name}</span>
                <PriceDisplay
                  priceMinor={featured.priceMinor}
                  compareAtPriceMinor={featured.compareAtPriceMinor}
                  className="hi-product-price"
                />
                <span className="hi-discovery-stock">{stockLabel(featured)}</span>
                <span className="hi-product-action">İncele</span>
              </span>
            </Link>
            <div className="hi-discovery-rail-wrap">
              <div className="hi-discovery-controls">
                <button
                  type="button"
                  className="hi-discovery-nav"
                  aria-label="Önceki ürünler"
                  disabled={!canPrev}
                  onClick={() => scrollByCard(-1)}
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="hi-discovery-nav"
                  aria-label="Sonraki ürünler"
                  disabled={!canNext}
                  onClick={() => scrollByCard(1)}
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </div>
              <ul
                ref={railRef}
                className="hi-discovery-rail"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                {supporting.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/urun/${product.slug}` as Route}
                      className={cn("hi-product-card hi-discovery-card")}
                      data-real-product-slug={product.slug}
                    >
                      <ProductMediaReveal className="hi-product-media">
                        <SafeImage
                          src={product.media[0]?.url}
                          alt={product.media[0]?.alt ?? product.name}
                          fill
                          sizes="(max-width: 768px) 58vw, 220px"
                          className="object-cover"
                        />
                      </ProductMediaReveal>
                      <span className="hi-product-meta">
                        <span className="hi-product-name">{product.name}</span>
                        <PriceDisplay
                          priceMinor={product.priceMinor}
                          compareAtPriceMinor={product.compareAtPriceMinor}
                          className="hi-product-price"
                        />
                        <span className="hi-discovery-stock">{stockLabel(product)}</span>
                        <span className="hi-product-action">İncele</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
