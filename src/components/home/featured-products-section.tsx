import type { Route } from "next";
import Link from "next/link";

import { EmptyCatalogState } from "@/components/catalog/empty-catalog-state";
import { PriceDisplay } from "@/components/commerce/price-display";
import { SafeImage } from "@/components/media/safe-image";
import type { Product } from "@/domain/catalog/types";

export function FeaturedProductsSection({ products }: { products: Product[] }) {
  const featured = products.filter((product) => product.featured);
  const pool = (featured.length > 0 ? featured : products).slice(0, 3);
  const [hero, ...rest] = pool;

  if (products.length === 0) {
    return (
      <section id="one-cikan-urunler" className="home-section">
        <div className="home-shell">
          <h2 className="home-title">Öne çıkan ürünler</h2>
          <div className="mt-5">
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
    <section id="one-cikan-urunler" className="home-section">
      <div className="home-shell">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="home-title home-mask-reveal">Öne çıkan ürünler</h2>
            <p className="home-lede">Önce inceleyin. Sepet, ürün sayfasında.</p>
          </div>
          <Link href={"/magaza" as Route} className="home-see-all hidden sm:inline-flex">
            Tümünü gör
          </Link>
        </div>

        <article className="home-press-card group relative mt-5 overflow-hidden rounded-[1.25rem] border border-white/10">
          <div className="relative aspect-[4/3] bg-[#11161c] md:aspect-[5/4]">
            <SafeImage
              src={hero.media[0]?.url}
              alt={hero.media[0]?.alt ?? hero.name}
              fill
              sizes="(max-width: 768px) 100vw, 70vw"
              className="object-cover"
            />
            <Link
              href={`/urun/${hero.slug}` as Route}
              className="absolute inset-0 z-10"
              aria-label={`${hero.name} ürününü incele`}
            />
            <div className="absolute inset-x-0 bottom-0 z-20 flex flex-wrap items-end justify-between gap-3 bg-gradient-to-t from-black/70 to-transparent p-4 text-light-text sm:p-6">
              <div>
                <span className="rounded-full bg-[#f3efe6] px-2.5 py-1 text-[0.75rem] font-semibold text-[#14161c]">
                  Ürün
                </span>
                {hero.compareAtPriceMinor && hero.compareAtPriceMinor > hero.priceMinor ? (
                  <span className="ml-2 rounded-full bg-orange px-2.5 py-1 text-[0.75rem] font-semibold text-midnight">
                    İndirim
                  </span>
                ) : null}
                <h3 className="mt-2 line-clamp-2 font-heading text-2xl font-bold tracking-[-0.04em] sm:text-4xl">
                  {hero.name}
                </h3>
                <PriceDisplay
                  priceMinor={hero.priceMinor}
                  compareAtPriceMinor={hero.compareAtPriceMinor}
                  className="mt-2 text-light-text"
                />
              </div>
              <span className="inline-flex min-h-11 items-center rounded-xl bg-orange px-4 text-[0.9375rem] font-semibold text-midnight">
                Ürünü incele
              </span>
            </div>
          </div>
        </article>

        {rest.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {rest.slice(0, 2).map((product) => (
              <article key={product.id} className="home-reveal-card min-w-0">
                <Link
                  href={`/urun/${product.slug}` as Route}
                  className="home-press-card group flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#f3efe6] text-[#14161c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
                >
                  <span className="relative block aspect-[4/5] bg-[#11161c]">
                    <SafeImage
                      src={product.media[0]?.url}
                      alt={product.media[0]?.alt ?? product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover"
                    />
                  </span>
                  <span className="flex min-h-[6.25rem] flex-col p-3">
                    <span className="text-[0.75rem] font-semibold tracking-wide text-[#0f6f6d] uppercase">
                      Ürün
                    </span>
                    <span className="mt-1 line-clamp-2 font-heading text-base leading-6 font-semibold">
                      {product.name}
                    </span>
                    <PriceDisplay
                      priceMinor={product.priceMinor}
                      compareAtPriceMinor={product.compareAtPriceMinor}
                      className="mt-1 text-[#14161c]"
                    />
                  </span>
                </Link>
              </article>
            ))}
          </div>
        ) : null}

        <Link href={"/magaza" as Route} className="home-see-all mt-4 sm:hidden">
          Tümünü gör
        </Link>
      </div>
    </section>
  );
}
