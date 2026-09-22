import type { Route } from "next";
import Link from "next/link";

import { PriceDisplay } from "@/components/commerce/price-display";
import { CopyQrUrl } from "@/components/wholesale/copy-qr-url";
import { SafeImage } from "@/components/media/safe-image";
import "@/components/wholesale/wholesale-catalog.css";
import { resolveProductVisual } from "@/domain/catalog/media";
import type { Product } from "@/domain/catalog/types";
import {
  WHOLESALE_CATALOG_COPY,
  WHOLESALE_CATALOG_PATH,
  WHOLESALE_CATALOG_QR_ASSET,
  WHOLESALE_CATALOG_QR_PNG,
  productMeasureLabel,
  wholesaleCatalogQrUrl,
} from "@/lib/wholesale/catalog";

function padIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

export function WholesaleQrPanel() {
  const url = wholesaleCatalogQrUrl();

  return (
    <section className="wc-qr" aria-labelledby="wholesale-qr-heading">
      <div className="wc-shell">
        <article className="wc-qr-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={WHOLESALE_CATALOG_QR_ASSET}
            alt={`${WHOLESALE_CATALOG_COPY.qrLabel}: ${url}`}
            width={320}
            height={320}
          />
          <div>
            <p className="wc-kicker">{WHOLESALE_CATALOG_COPY.qrLabel}</p>
            <h2 id="wholesale-qr-heading" className="wc-preview-title">
              Kartvizite basılacak kod.
            </h2>
            <p className="wc-lede">{WHOLESALE_CATALOG_COPY.qrHint}</p>
            <p className="wc-url">{url}</p>
            <div className="wc-cover-actions">
              <CopyQrUrl url={url} />
              <a className="wc-btn-ghost" href={WHOLESALE_CATALOG_QR_PNG} download>
                PNG indir
              </a>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function CatalogEmpty({ failed }: { failed?: boolean }) {
  return (
    <section className="wc-empty" data-empty-catalog="">
      <div className="wc-shell">
        <p className="wc-kicker">{WHOLESALE_CATALOG_COPY.eyebrow}</p>
        <h2 className="wc-empty-title">
          {failed
            ? "Ürünler şu anda yüklenemedi."
            : WHOLESALE_CATALOG_COPY.emptyTitle}
        </h2>
        <p className="wc-empty-body">
          {failed
            ? "Katalog kaynağına ulaşılamadı. Biraz sonra tekrar deneyin veya brief bırakın."
            : WHOLESALE_CATALOG_COPY.emptyBody}
        </p>
        <div className="wc-empty-actions">
          <Link href={"/kurumsal-teklif" as Route} className="wc-btn">
            {WHOLESALE_CATALOG_COPY.quoteLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

function CatalogEntry({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const visual = resolveProductVisual(product);
  const measure = productMeasureLabel(product);
  const href = `/urun/${product.slug}` as Route;
  const material = product.materialSummary || product.materialCode || null;

  return (
    <article className="wc-spread" data-wholesale-product={product.slug}>
      <div className="wc-media">
        <SafeImage
          src={visual.primary?.url}
          alt={visual.primary?.alt || product.name}
          fill
          sizes="(max-width: 860px) 100vw, 54vw"
          style={{
            objectFit: visual.isolated ? "contain" : "cover",
            objectPosition: visual.objectPosition ?? "center",
          }}
        />
      </div>
      <div className="wc-body">
        <div>
          <p className="wc-index">Sayfa {padIndex(index)}</p>
          <Link href={href} className="wc-name">
            {product.name}
          </Link>
          {product.shortDescription ? (
            <p className="wc-summary">{product.shortDescription}</p>
          ) : null}
          {product.sku || measure || material ? (
            <dl className="wc-meta">
              {product.sku ? (
                <>
                  <dt>SKU</dt>
                  <dd>{product.sku}</dd>
                </>
              ) : null}
              {measure ? (
                <>
                  <dt>Ölçü</dt>
                  <dd>{measure}</dd>
                </>
              ) : null}
              {material ? (
                <>
                  <dt>Malzeme</dt>
                  <dd>{material}</dd>
                </>
              ) : null}
            </dl>
          ) : null}
        </div>
        <div>
          <p className="wc-price-label">{WHOLESALE_CATALOG_COPY.retailLabel}</p>
          <PriceDisplay
            priceMinor={product.priceMinor}
            compareAtPriceMinor={product.compareAtPriceMinor}
            currency={product.currency}
          />
          <p className="wc-price-note">{WHOLESALE_CATALOG_COPY.wholesaleNote}</p>
          <div className="wc-cover-actions">
            <Link href={"/kurumsal-teklif" as Route} className="wc-btn">
              {WHOLESALE_CATALOG_COPY.quoteLabel}
            </Link>
            <Link href={href} className="wc-btn-ghost">
              Ürünü gör
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function WholesaleCatalog({
  products,
  unavailable = false,
}: {
  products: Product[];
  unavailable?: boolean;
}) {
  const qrUrl = wholesaleCatalogQrUrl();

  return (
    <div className="wc" data-wholesale-catalog="">
      <div className="wc-toolbar">
        <div className="wc-shell wc-toolbar-inner">
          <p className="wc-toolbar-meta">
            <span>{WHOLESALE_CATALOG_COPY.eyebrow}</span>
            <span className="wc-toolbar-count">
              {unavailable
                ? "Katalog yüklenemedi"
                : products.length > 0
                  ? `${products.length} ürün`
                  : "Boş katalog"}
            </span>
          </p>
          <Link href={"/kurumsal-teklif" as Route} className="wc-btn">
            {WHOLESALE_CATALOG_COPY.quoteLabel}
          </Link>
        </div>
      </div>

      <header className="wc-cover">
        <div className="wc-shell">
          <p className="wc-kicker">{WHOLESALE_CATALOG_COPY.eyebrow}</p>
          <h1 className="wc-title">{WHOLESALE_CATALOG_COPY.title}</h1>
          <p className="wc-lede">{WHOLESALE_CATALOG_COPY.lede}</p>
          <p className="wc-url">{qrUrl}</p>
          <div className="wc-cover-actions">
            <Link href={"/kurumsal-teklif" as Route} className="wc-btn">
              {WHOLESALE_CATALOG_COPY.quoteLabel}
            </Link>
            <Link href={"/toptan" as Route} className="wc-btn-ghost">
              Toptan sayfası
            </Link>
          </div>
        </div>
      </header>

      {unavailable || products.length === 0 ? (
        <CatalogEmpty failed={unavailable} />
      ) : (
        <div className="wc-spreads">
          {products.map((product, index) => (
            <CatalogEntry key={product.id} product={product} index={index} />
          ))}
        </div>
      )}

      <WholesaleQrPanel />
    </div>
  );
}

export function WholesaleCatalogPreview({
  products,
  unavailable = false,
}: {
  products: Product[];
  unavailable?: boolean;
}) {
  const preview = products.slice(0, 6);

  return (
    <section className="wc wc-preview" data-wholesale-preview="" aria-labelledby="wholesale-catalog-preview">
      <div className="wc-shell">
        <div className="wc-preview-head">
          <div>
            <p className="wc-kicker">{WHOLESALE_CATALOG_COPY.eyebrow}</p>
            <h2 id="wholesale-catalog-preview" className="wc-preview-title">
              Web katalog.
            </h2>
            <p className="wc-lede">
              Kartvizitteki QR bu katalogu açar. Toptan fiyat bu ızgarada yazılmaz.
            </p>
          </div>
          <Link href={WHOLESALE_CATALOG_PATH as Route} className="wc-btn">
            {WHOLESALE_CATALOG_COPY.openCatalogLabel}
          </Link>
        </div>

        {unavailable || preview.length === 0 ? (
          <p className="wc-empty-body" data-empty-catalog="">
            {unavailable
              ? "Ürünler şu anda yüklenemedi. Biraz sonra tekrar deneyin veya brief bırakın."
              : WHOLESALE_CATALOG_COPY.emptyBody}
          </p>
        ) : (
          <ul className="wc-preview-grid">
            {preview.map((product) => {
              const visual = resolveProductVisual(product);
              return (
                <li key={product.id}>
                  <Link
                    href={`/urun/${product.slug}` as Route}
                    className="wc-preview-card"
                  >
                    <div className="wc-preview-media">
                      <SafeImage
                        src={visual.primary?.url}
                        alt={visual.primary?.alt || product.name}
                        fill
                        sizes="(max-width: 860px) 46vw, 22vw"
                        style={{
                          objectFit: visual.isolated ? "contain" : "cover",
                          objectPosition: visual.objectPosition ?? "center",
                        }}
                      />
                    </div>
                    <p className="wc-preview-name">{product.name}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <WholesaleQrPanel />
    </section>
  );
}
