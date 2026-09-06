"use client";

import type { Route } from "next";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";

import { EmptyCatalogState } from "@/components/catalog/empty-catalog-state";
import { ProductStage } from "@/components/catalog/product-stage";
import { PriceDisplay } from "@/components/commerce/price-display";
import type { Product } from "@/domain/catalog/types";
import { stageForCategory } from "@/domain/visual/stages";

export function FeaturedProductsSection({ products }: { products: Product[] }) {
  const featured = products.filter((product) => product.featured);
  const pool = featured.length > 0 ? featured : products.slice(0, 6);
  const [hero, ...rest] = pool;
  const [emblaRef] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" });

  if (products.length === 0) {
    return (
      <section id="one-cikan-urunler" className="bg-[#f4f1ea] py-10">
        <div className="home-shell">
          <h2 className="font-heading text-[1.65rem] font-bold tracking-[-0.04em]">
            Öne çıkan ürünler
          </h2>
          <div className="mt-6">
            <EmptyCatalogState />
          </div>
        </div>
      </section>
    );
  }

  if (!hero) {
    return null;
  }

  return (
    <section id="one-cikan-urunler" className="bg-[#f4f1ea] py-10 sm:py-14">
      <div className="home-shell">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-[1.65rem] leading-[1.08] font-bold tracking-[-0.04em] sm:text-3xl">
              Öne çıkan ürünler
            </h2>
            <p className="mt-2 text-sm text-ink-secondary">
              Önce inceleyin. Sepet, ürün sayfasında.
            </p>
          </div>
          <Link
            href={"/magaza" as Route}
            className="hidden min-h-11 items-center text-sm font-semibold sm:inline-flex"
          >
            Tüm ürünleri gör
          </Link>
        </div>

        <article className="group mt-6 overflow-hidden rounded-3xl">
          <ProductStage
            stage={stageForCategory(hero.categorySlugs[0] ?? "ev-ve-dekorasyon")}
            src={hero.media[0]?.url}
            alt={hero.media[0]?.alt ?? hero.name}
            isolated={hero.media[0]?.isolated ?? false}
            ratio="featured"
            sizes="(max-width: 768px) 100vw, 70vw"
            className="rounded-3xl"
          >
            <Link
              href={`/urun/${hero.slug}` as Route}
              className="absolute inset-0 z-10"
              aria-label={`${hero.name} ürününü incele`}
            />
            <div className="absolute inset-x-0 bottom-0 z-20 flex flex-wrap items-end justify-between gap-3 p-5 text-light-text sm:p-7">
              <div>
                {hero.compareAtPriceMinor && hero.compareAtPriceMinor > hero.priceMinor ? (
                  <span className="rounded-full bg-orange px-2.5 py-1 text-xs font-semibold text-midnight">
                    İndirim
                  </span>
                ) : null}
                <h3 className="mt-2 font-heading text-2xl font-bold tracking-[-0.04em] sm:text-4xl">
                  {hero.name}
                </h3>
                <PriceDisplay
                  priceMinor={hero.priceMinor}
                  compareAtPriceMinor={hero.compareAtPriceMinor}
                  className="mt-2 text-light-text"
                />
              </div>
              <span className="inline-flex min-h-11 items-center rounded-xl bg-white/15 px-4 text-sm font-semibold backdrop-blur-sm">
                Ürünü incele
              </span>
            </div>
          </ProductStage>
        </article>

        {rest.length > 0 ? (
          <div className="mt-4" ref={emblaRef}>
            <div className="flex gap-3">
              {rest.map((product) => (
                <article
                  key={product.id}
                  className="min-w-0 shrink-0 basis-[min(78%,18rem)] sm:basis-[16.5rem]"
                >
                  <Link
                    href={`/urun/${product.slug}` as Route}
                    className="group block overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
                  >
                    <ProductStage
                      stage={stageForCategory(product.categorySlugs[0] ?? "ev-ve-dekorasyon")}
                      src={product.media[0]?.url}
                      alt={product.media[0]?.alt ?? product.name}
                      isolated={product.media[0]?.isolated ?? false}
                      ratio="standard"
                      sizes="280px"
                      className="rounded-2xl"
                    />
                    <span className="mt-3 block font-heading text-lg font-semibold leading-snug">
                      {product.name}
                    </span>
                    <PriceDisplay
                      priceMinor={product.priceMinor}
                      compareAtPriceMinor={product.compareAtPriceMinor}
                      className="mt-1"
                    />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        <Link
          href={"/magaza" as Route}
          className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold sm:hidden"
        >
          Tüm ürünleri gör
        </Link>
      </div>
    </section>
  );
}
