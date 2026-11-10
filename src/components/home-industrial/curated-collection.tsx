"use client";

import type { Route } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { PriceDisplay } from "@/components/commerce/price-display";
import { SafeImage } from "@/components/media/safe-image";
import type { Product } from "@/domain/catalog/types";
import { listHomepageCuratedCards } from "@/domain/project-destinations/curated";

export function CuratedCollection({ products }: { products: Product[] }) {
  const t = useTranslations();
  const cards = listHomepageCuratedCards(products);

  return (
    <section
      id="mevcut-urunler"
      data-home-theme="ivory"
      className="octo-story octo-story-ivory octo-curated"
      aria-labelledby="curated-heading"
    >
      <div className="hi-shell">
        <p className="hi-kicker octo-kicker-dark">{t("home.curatedKicker")}</p>
        <div className="octo-curated-head">
          <h2 id="curated-heading" className="octo-serif">
            {t("home.productsShopTitle")}
          </h2>
          <Link href={"/magaza" as Route} className="hi-link octo-link-dark">
            {t("home.allProductsLink")}
          </Link>
        </div>
        <ul className="octo-curated-rail">
          {cards.map((card) => (
            <li key={card.id}>
              <Link
                href={card.href}
                className="octo-curated-card"
                data-real-product-slug={card.id}
                data-project-label={card.label}
              >
                <span className="octo-curated-media">
                  {card.image ? (
                    <SafeImage
                      src={card.image}
                      alt={card.name}
                      fill
                      sizes="(max-width: 768px) 46vw, 22vw"
                      className="object-cover"
                    />
                  ) : null}
                </span>
                <span className="octo-curated-label">{card.label}</span>
                <span className="octo-curated-name">{card.name}</span>
                {card.priceSoon ? (
                  <span className="octo-curated-price">{t("home.priceSoon")}</span>
                ) : (
                  <PriceDisplay
                    priceMinor={card.priceMinor ?? 0}
                    className="octo-curated-price"
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
