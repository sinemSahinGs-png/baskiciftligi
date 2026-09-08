import type { Route } from "next";
import Link from "next/link";

import { PriceDisplay } from "@/components/commerce/price-display";
import { SafeImage } from "@/components/media/safe-image";
import { industrialAssets } from "@/components/home-industrial/industrial-slots";
import { SlotImage } from "@/components/home-industrial/slot-image";
import { InteractiveMedia, MagneticAction, WordReveal } from "@/components/motion/premium";
import { resolveProductVisual } from "@/domain/catalog/media";
import type { Product } from "@/domain/catalog/types";

export function FeaturedProduct({ product }: { product: Product | null }) {
  const visual = product ? resolveProductVisual(product) : null;
  const liveSrc = visual?.primary?.url ?? null;
  const liveAlt = visual?.primary?.alt ?? product?.name ?? "";

  return (
    <section
      id="one-cikan-urunler"
      data-home-theme="orange"
      data-featured-product-slug={product?.slug ?? undefined}
      data-featured-art={liveSrc ? "live" : product ? "empty" : "campaign"}
      className="hi-section hi-featured"
      aria-labelledby="featured-heading"
    >
      <div className="hi-shell hi-featured-layout">
        <article className="hi-featured-copy">
          <WordReveal as="h2" id="featured-heading" className="hi-kicker" text="ÖNE ÇIKAN ÜRÜN" />
          {product ? (
            <>
              <p className="hi-title mt-3 max-w-[14ch]">{product.name}</p>
              <PriceDisplay
                priceMinor={product.priceMinor}
                compareAtPriceMinor={product.compareAtPriceMinor}
                className="mt-3 text-[1.85rem]"
              />
              <div className="hi-featured-cluster">
                <MagneticAction>
                  <Link
                    href={`/urun/${product.slug}` as Route}
                    data-featured-product-slug={product.slug}
                    className="hi-btn whitespace-nowrap"
                  >
                    Ürünü incele →
                  </Link>
                </MagneticAction>
              </div>
            </>
          ) : (
            <>
              <WordReveal as="p" className="hi-title mt-3 max-w-[14ch]" text="MAĞAZAYI KEŞFET" />
              <div className="mt-5">
                <Link href={"/magaza" as Route} className="hi-btn">
                  Tüm ürünleri gör →
                </Link>
              </div>
            </>
          )}
        </article>
        <InteractiveMedia
          className="hi-featured-art"
          data-industrial-asset="featured-product"
          data-featured-live-src={liveSrc ?? undefined}
          aria-hidden="true"
        >
          {liveSrc ? (
            <SafeImage
              src={liveSrc}
              alt={liveAlt}
              fill
              sizes="(max-width: 768px) 88vw, 540px"
              quality={80}
              priority
              eager
              showSkeleton={false}
              className="object-contain object-center"
            />
          ) : product ? (
            <span className="hi-featured-art-fallback" />
          ) : (
            <SlotImage
              src={industrialAssets.featuredProduct}
              alt=""
              fill
              sizes="(max-width: 768px) 70vw, 50vw"
              className="object-cover object-[58%_42%]"
            />
          )}
          <span className="hi-featured-edge" />
        </InteractiveMedia>
      </div>
    </section>
  );
}
