"use client";

import type { Route } from "next";
import Link from "next/link";

import { PriceDisplay } from "@/components/commerce/price-display";
import { SafeImage } from "@/components/media/safe-image";
import { ProductMediaReveal, WordReveal } from "@/components/motion/premium";
import type { Product } from "@/domain/catalog/types";
import { useTranslations } from "next-intl";

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
  const t = useTranslations();
  const visible = [...products]
    .sort((left, right) => mediaRank(right) - mediaRank(left))
    .slice(0, 4);

  return (
    <section
      id="mevcut-urunler"
      data-home-theme="mono"
      className="hi-section hi-store-stage"
      aria-labelledby="real-products-heading"
    >
      <div className="hi-shell">
        <div className="flex items-end justify-between gap-3">
          <WordReveal
            as="h2"
            id="real-products-heading"
            className="hi-title"
            text={t("home.productsShopTitle")}
          />
          <Link href={"/magaza" as Route} className="hi-link shrink-0">
            {t("home.allProductsLink")}
          </Link>
        </div>
        {visible.length === 0 ? (
          <div className="hi-empty-catalog" data-empty-catalog="">
            <p className="hi-empty-catalog-title">{t("home.productsEmpty")}</p>
            <p className="hi-empty-catalog-body">{t("home.productsEmptyBody")}</p>
            <Link href={"/model-yukle" as Route} className="hi-btn">
              {t("home.emptyCta")}
              <span aria-hidden="true"> →</span>
            </Link>
          </div>
        ) : (
          <ul className="octo-product-rail mt-5">
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
                    <span className="hi-product-action">{t("home.inspect")}</span>
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
