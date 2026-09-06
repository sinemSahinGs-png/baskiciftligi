import type { Route } from "next";
import Link from "next/link";

import { PriceDisplay } from "@/components/commerce/price-display";
import { SlotImage } from "@/components/home-industrial/slot-image";
import type { Product } from "@/domain/catalog/types";

export function FeaturedProduct({ product }: { product: Product | null }) {
  if (!product) {
    return null;
  }

  return (
    <section
      id="one-cikan-urunler"
      data-home-theme="orange"
      className="hi-section hi-featured"
      aria-labelledby="featured-heading"
    >
      <div className="hi-shell grid items-end gap-6 md:grid-cols-2">
        <article>
          <h2 className="hi-kicker" id="featured-heading">
            ÖNE ÇIKAN ÜRÜN
          </h2>
          <p className="hi-title mt-3 max-w-[12ch]">{product.name}</p>
          <p className="hi-lede">{product.shortDescription}</p>
          <PriceDisplay
            priceMinor={product.priceMinor}
            compareAtPriceMinor={product.compareAtPriceMinor}
            className="mt-4 text-[1.6rem]"
          />
          <Link href={`/urun/${product.slug}` as Route} className="hi-btn mt-5">
            Ürünü incele →
          </Link>
        </article>
        <div className="relative aspect-[4/5] overflow-hidden bg-[color:var(--bc-panel)] md:aspect-[5/6]">
          <SlotImage
            src={product.media[0]?.url}
            alt={product.media[0]?.alt ?? product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <p className="hi-mono writing-mode-vertical absolute top-3 right-2 z-10 [writing-mode:vertical-rl]">
            TASARIM DOĞA TEKNOLOJİ
          </p>
        </div>
      </div>
    </section>
  );
}
