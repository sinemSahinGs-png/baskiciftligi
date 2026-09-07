import type { Route } from "next";
import Link from "next/link";

import { PriceDisplay } from "@/components/commerce/price-display";
import { SafeImage } from "@/components/media/safe-image";
import { InteractiveMedia, MagneticAction, WordReveal } from "@/components/motion/premium";
import { storePremiumAssets } from "@/components/storefront/store-premium-assets";
import { StoreEditorialArt } from "@/components/storefront/store-premium-media";
import type { Product } from "@/domain/catalog/types";

export function StoreEditorial({ product }: { product: Product }) {
  const hasDimensions =
    product.widthMm != null &&
    product.depthMm != null &&
    product.heightMm != null;

  return (
    <aside className="store-editorial" aria-labelledby="store-editorial-heading">
      <div className="store-editorial-copy">
        <p className="store-editorial-kicker text-xs">Seçki</p>
        <WordReveal
          as="h2"
          id="store-editorial-heading"
          className="store-editorial-title"
          text="TASARIMIN DAHA FAZLA ANLAMI VAR"
        />
        <p className="max-w-md text-[0.98rem] leading-6 text-[color:var(--store-muted-light)]">
          {product.name}
        </p>
        <PriceDisplay
          priceMinor={product.priceMinor}
          compareAtPriceMinor={product.compareAtPriceMinor}
          currency={product.currency}
          className="text-[color:var(--store-text-light)]"
        />
        {hasDimensions ? (
          <p className="font-mono text-xs tracking-wide text-[color:var(--store-muted-light)]">
            {product.widthMm} × {product.depthMm} × {product.heightMm} mm
          </p>
        ) : null}
        <Link
          href={`/urun/${product.slug}` as Route}
          className="store-editorial-cta"
        >
          Şimdi keşfet
        </Link>
      </div>
      <InteractiveMedia className="store-editorial-media" aria-hidden="true">
        <StoreEditorialArt />
      </InteractiveMedia>
    </aside>
  );
}

export function StoreUploadBanner() {
  return (
    <aside className="store-upload-banner" aria-labelledby="store-upload-heading">
      <div className="store-upload-copy">
        <WordReveal as="h2" id="store-upload-heading" text="DOSYAN HAZIR MI?" />
        <p className="mt-2">
          STL veya 3MF dosyanı yükle, gerçek fiyatını gör.
        </p>
        <MagneticAction className="mt-4 w-fit">
          <Link href={"/model-yukle" as Route}>MODELİNİ YÜKLE →</Link>
        </MagneticAction>
      </div>
      <div className="store-upload-media" aria-hidden="true">
        <SafeImage
          src={storePremiumAssets.uploadObject}
          alt=""
          fill
          sizes="(max-width: 768px) 90vw, 280px"
          fetchPriority="low"
          className="object-contain object-center p-4"
        />
        <span className="store-upload-line" />
      </div>
    </aside>
  );
}

export function StoreEmptySearch() {
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
      <h3 className="mt-4 font-heading text-2xl font-bold">Eşleşen ürün yok</h3>
      <p className="mt-2 max-w-md text-sm text-[color:var(--store-muted-dark)]">
        Filtreleri azaltmayı dene. Yeni ürünler eklendikçe burada görünür.
      </p>
      <Link href="/magaza" className="store-btn-primary mt-6">
        Tüm ürünleri göster
      </Link>
    </div>
  );
}
