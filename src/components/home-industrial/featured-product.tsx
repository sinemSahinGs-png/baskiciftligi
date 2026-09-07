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
      <div className="hi-shell hi-featured-layout">
        <article className="hi-featured-copy">
          <h2 className="hi-kicker" id="featured-heading">
            ÖNE ÇIKAN ÜRÜN
          </h2>
          {product ? (
            <>
              <p className="hi-title mt-3 max-w-[12ch]">{product.name}</p>
              <PriceDisplay
                priceMinor={product.priceMinor}
                compareAtPriceMinor={product.compareAtPriceMinor}
                className="mt-3 text-[1.85rem]"
              />
              <div className="hi-featured-cluster">
                {product.media[0]?.url ? (
                  <span className="relative size-16 shrink-0 overflow-hidden border border-[color:rgb(8_10_11_/_0.35)] bg-[#eceae4]">
                    <SafeImage
                      src={product.media[0].url}
                      alt={product.media[0].alt ?? product.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </span>
                ) : null}
                <Link
                  href={`/urun/${product.slug}` as Route}
                  data-featured-product-slug={product.slug}
                  className="hi-btn whitespace-nowrap"
                >
                  Ürünü incele →
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="hi-title mt-3 max-w-[14ch]">MAĞAZAYI KEŞFET</p>
              <div className="mt-5">
                <Link href={"/magaza" as Route} className="hi-btn">
                  Tüm ürünleri gör →
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
            sizes="(max-width: 768px) 60vw, 50vw"
            className="object-cover object-[62%_40%]"
          />
        </div>
      </div>
    </section>
  );
}
