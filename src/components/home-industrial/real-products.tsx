import type { Route } from "next";
import Link from "next/link";

import { PriceDisplay } from "@/components/commerce/price-display";
import { SafeImage } from "@/components/media/safe-image";
import type { Product } from "@/domain/catalog/types";

export const HOME_EMPTY_CATALOG = {
  title: "Şu anda yayınlanan ürün bulunamadı.",
  body: "Kendi modelini yükleyerek hemen fiyat alabilirsin.",
  cta: "MODELİNİ YÜKLE",
} as const;

export function RealProducts({ products }: { products: Product[] }) {
  const visible = products.slice(0, 4);

  return (
    <section
      id="mevcut-urunler"
      data-home-theme="mono"
      className="hi-section"
      aria-labelledby="real-products-heading"
    >
      <div className="hi-shell">
        <div className="flex items-end justify-between gap-3">
          <h2 id="real-products-heading" className="hi-title">
            MAĞAZA ÜRÜNLERİ
          </h2>
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
              <li key={product.id} className={index === 0 ? "hi-product-card-wrap hi-product-card-wrap--lead" : "hi-product-card-wrap"}>
                <Link
                  href={`/urun/${product.slug}` as Route}
                  className={index === 0 ? "hi-product-card hi-product-card--lead" : "hi-product-card"}
                  data-real-product-slug={product.slug}
                >
                  <span className="hi-product-media">
                    <SafeImage
                      src={product.media[0]?.url}
                      alt={product.media[0]?.alt ?? product.name}
                      fill
                      sizes={index === 0 ? "(max-width: 768px) 100vw, 25vw" : "(max-width: 768px) 50vw, 25vw"}
                      className="object-cover"
                    />
                  </span>
                  <span className="hi-product-meta">
                    <span className="line-clamp-2 font-semibold">{product.name}</span>
                    <PriceDisplay
                      priceMinor={product.priceMinor}
                      compareAtPriceMinor={product.compareAtPriceMinor}
                      className="mt-1"
                    />
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
