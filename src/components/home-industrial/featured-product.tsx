import type { Route } from "next";
import Link from "next/link";

import { PriceDisplay } from "@/components/commerce/price-display";
import { SafeImage } from "@/components/media/safe-image";
import { industrialAssets } from "@/components/home-industrial/industrial-slots";
import { SlotImage } from "@/components/home-industrial/slot-image";
import type { Product } from "@/domain/catalog/types";

export function FeaturedProduct({ product }: { product: Product | null }) {
  return (
    <section
      id="one-cikan-urunler"
      data-home-theme="orange"
      className="hi-section hi-featured"
      aria-labelledby="featured-heading"
    >
      <div className="hi-shell grid items-end gap-5 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <article>
          <h2 className="hi-kicker" id="featured-heading">
            ÖNE ÇIKAN ÜRÜN
          </h2>
          {product ? (
            <>
              <p className="hi-title mt-3 max-w-[14ch]">{product.name}</p>
              <p className="hi-lede">{product.shortDescription}</p>
              <PriceDisplay
                priceMinor={product.priceMinor}
                compareAtPriceMinor={product.compareAtPriceMinor}
                className="mt-4 text-[1.6rem]"
              />
              <div className="mt-4 flex items-center gap-3">
                {product.media[0]?.url ? (
                  <span className="relative size-14 shrink-0 overflow-hidden border border-[color:rgb(8_10_11_/_0.28)]">
                    <SafeImage
                      src={product.media[0].url}
                      alt={product.media[0].alt ?? product.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </span>
                ) : null}
                <Link
                  href={`/urun/${product.slug}` as Route}
                  data-featured-product-slug={product.slug}
                  className="hi-btn"
                >
                  Ürünü incele →
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="hi-title mt-3 max-w-[14ch]">MAĞAZAYI KEŞFET</p>
              <p className="hi-lede">
                Yayında öne çıkan bir ürün yok. Katalogdan seç veya dosyanı yükle.
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Link href={"/magaza" as Route} className="hi-btn">
                  Tüm ürünleri gör →
                </Link>
                <Link href={"/model-yukle" as Route} className="hi-btn hi-btn-ghost">
                  Modelini yükle →
                </Link>
              </div>
            </>
          )}
        </article>
        <div
          className="hi-featured-art"
          data-industrial-asset="featured-product"
          aria-hidden="true"
        >
          <SlotImage
            src={industrialAssets.featuredProduct}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-right"
          />
          <p className="hi-mono absolute top-3 right-2 z-10 [writing-mode:vertical-rl]">
            TASARIM DOĞA TEKNOLOJİ
          </p>
        </div>
      </div>
    </section>
  );
}
