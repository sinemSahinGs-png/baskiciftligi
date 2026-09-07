import type { Route } from "next";
import Link from "next/link";

import { PriceDisplay } from "@/components/commerce/price-display";
import { SafeImage } from "@/components/media/safe-image";
import type { Product } from "@/domain/catalog/types";

export function StoreEditorial({ product }: { product: Product }) {
  const image =
    product.media.find((media) => media.type === "image") ?? product.media[0];
  const hasDimensions =
    product.widthMm != null &&
    product.depthMm != null &&
    product.heightMm != null;

  return (
    <aside className="store-editorial" aria-labelledby="store-editorial-heading">
      <div className="store-editorial-copy">
        <p className="store-editorial-kicker text-xs">Seçki</p>
        <h2 id="store-editorial-heading" className="store-editorial-title">
          TASARIMIN
          <br />
          DAHA FAZLA ANLAMI VAR
        </h2>
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
          Ürünü incele
        </Link>
      </div>
      <div className="store-editorial-media">
        <SafeImage
          src={image?.url}
          alt={image?.alt || product.name}
          fill
          sizes="(max-width: 768px) 100vw, 48vw"
          className="object-contain p-8"
        />
      </div>
    </aside>
  );
}

export function StoreUploadBanner() {
  return (
    <aside className="store-upload-banner" aria-labelledby="store-upload-heading">
      <div>
        <h2 id="store-upload-heading">Dosyan hazır mı?</h2>
        <p className="mt-2">
          STL veya 3MF dosyanı yükle, gerçek fiyatını gör.
        </p>
      </div>
      <Link href={"/model-yukle" as Route}>MODELİNİ YÜKLE →</Link>
    </aside>
  );
}
