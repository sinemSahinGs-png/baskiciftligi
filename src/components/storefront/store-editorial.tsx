"use client";

import type { Route } from "next";
import Link from "next/link";

import { PriceDisplay } from "@/components/commerce/price-display";
import { SafeImage } from "@/components/media/safe-image";
import { InteractiveMedia, MagneticAction, WordReveal } from "@/components/motion/premium";
import { storePremiumAssets } from "@/components/storefront/store-premium-assets";
import { resolveProductVisual } from "@/domain/catalog/media";
import type { Product } from "@/domain/catalog/types";
import { useTranslations } from "next-intl";

export function StoreEditorial({ product }: { product: Product }) {
  const t = useTranslations();
  const image = resolveProductVisual(product).primary ?? product.media[0];

  return (
    <aside className="store-editorial" aria-labelledby="store-editorial-heading">
      <div className="store-editorial-copy">
        <p className="store-editorial-kicker text-xs">{t("commerce.campaign")}</p>
        <WordReveal
          as="h2"
          id="store-editorial-heading"
          className="store-editorial-title"
          text={product.name}
        />
        <p className="max-w-md text-[0.98rem] leading-6 text-[color:var(--store-muted-light)]">
          {t("commerce.editorialLede")}
        </p>
        <PriceDisplay
          priceMinor={product.priceMinor}
          compareAtPriceMinor={product.compareAtPriceMinor}
          currency={product.currency}
          className="text-[color:var(--store-text-light)]"
        />
        <Link href={`/urun/${product.slug}` as Route} className="store-editorial-cta">
          {t("commerce.inspect")}
        </Link>
      </div>
      <InteractiveMedia className="store-editorial-media">
        {image?.url ? (
          <SafeImage
            src={image.url}
            alt={image.alt || product.name}
            fill
            sizes="(max-width: 768px) 100vw, 52vw"
            priority
            eager
            className="object-cover"
          />
        ) : (
          <span className="store-editorial-fallback" aria-hidden="true" />
        )}
      </InteractiveMedia>
    </aside>
  );
}

export function StoreUploadBanner() {
  const t = useTranslations();
  return (
    <aside className="store-upload-banner" aria-labelledby="store-upload-heading">
      <div className="store-upload-copy">
        <WordReveal as="h2" id="store-upload-heading" text={t("commerce.fileReady")} />
        <p className="mt-2">{t("commerce.fileReadyLede")}</p>
        <MagneticAction className="mt-4 w-fit">
          <Link href={"/model-yukle" as Route}>{t("commerce.uploadCta")}</Link>
        </MagneticAction>
      </div>
      <div className="store-upload-media" aria-hidden="true">
        <SafeImage
          src={storePremiumAssets.uploadObject}
          alt=""
          fill
          sizes="(max-width: 768px) 90vw, 280px"
          eager
          className="object-contain object-center p-4"
        />
        <span className="store-upload-line" />
      </div>
    </aside>
  );
}

export function StoreEmptySearch() {
  const t = useTranslations();
  return (
    <div className="store-empty-search">
      <div className="store-empty-search-media" aria-hidden="true">
        <SafeImage
          src={storePremiumAssets.emptySearch}
          alt=""
          fill
          sizes="(max-width: 768px) 70vw, 240px"
          fetchPriority="low"
          className="object-contain object-center"
        />
      </div>
      <h3 className="mt-4 font-heading text-2xl font-bold">{t("commerce.emptySearch")}</h3>
      <p className="mt-2 max-w-md text-sm text-[color:var(--store-muted-dark)]">
        {t("commerce.emptySearchHint")}
      </p>
      <Link href="/magaza" className="store-btn-primary mt-6">
        {t("commerce.showAll")}
      </Link>
    </div>
  );
}
