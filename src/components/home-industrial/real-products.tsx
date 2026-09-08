import type { Route } from "next";
import Link from "next/link";

import { PriceDisplay } from "@/components/commerce/price-display";
import { SafeImage } from "@/components/media/safe-image";
import { ProductMediaReveal, WordReveal } from "@/components/motion/premium";
import type { Product } from "@/domain/catalog/types";

export const HOME_EMPTY_CATALOG = {
  title: "Şu anda yayınlanan ürün bulunamadı.",
  body: "Kendi modelini yükleyerek hemen fiyat alabilirsin.",
  cta: "MODELİNİ YÜKLE",
} as const;

function mediaRank(product: Product) {
  const url = product.media[0]?.url ?? "";
  if (!url) return 0;
  if (/^https?:\/\//i.test(url) || url.startsWith("/demo/") || url.startsWith("/images/")) {
    return 2;
  }
  return 1;
}

export function RealProducts({ products }: { products: Product[] }) {
  const visible = [...products]
    .sort((left, right) => mediaRank(right) - mediaRank(left))
    .slice(0, 4);

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
            Tüm ürünleri gör →
          </Link>
        </div>
        {visible.length === 0 ? (
          <div className="hi-empty-catalog" data-empty-catalog="">
            <p className="hi-empty-catalog-title">{HOME_EMPTY_CATALOG.title}</p>
            <p className="hi-empty-catalog-body">{HOME_EMPTY_CATALOG.body}</p>
            <Link href={"/model-yukle" as Route} className="hi-btn">
              {HOME_EMPTY_CATALOG.cta}
              <span aria-hidden="true"> →</span>
            </Link>
          </div>
        ) : (
          <ul className="hi-product-grid mt-5">
            {visible.map((product, index) => (
              <li
                key={product.id}
                className={
                  index === 0
                    ? "hi-product-card-wrap hi-product-card-wrap--lead"
                    : "hi-product-card-wrap"
                }
              >
                <Link
                  href={`/urun/${product.slug}` as Route}
                  className={
                    index === 0 ? "hi-product-card hi-product-card--lead" : "hi-product-card"
                  }
                  data-real-product-slug={product.slug}
                >
                  <ProductMediaReveal className="hi-product-media">
                    <SafeImage
                      src={product.media[0]?.url}
                      alt={product.media[0]?.alt ?? product.name}
                      fill
                      sizes="(max-width: 768px) 48vw, 25vw"
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
                    <span className="hi-product-action">İncele</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
