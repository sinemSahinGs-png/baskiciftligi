"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";

import { formatMoney } from "@/lib/money";
import { useCartStore } from "@/stores/cart-store";
import {
  listProjectDisplayProducts,
  type ProjectDestination,
} from "@/domain/project-destinations/catalog";
import "./project-purchase.css";

type ServerQuote = {
  lines: Array<{
    productId: string;
    unitPriceMinor: number;
    lineTotalMinor: number;
    isAvailable: boolean;
  }>;
  estimatedShippingMinor: number;
  totalMinor: number;
  subtotalMinor: number;
};

export function ProjectPurchasePage({
  destination,
}: {
  destination: ProjectDestination;
}) {
  const router = useRouter();
  const addLine = useCartStore((state) => state.addLine);
  const products = listProjectDisplayProducts(destination.slug);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const selected = products.find((item) => item.id === productId) ?? products[0];
  const [variantId, setVariantId] = useState(selected?.variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<ServerQuote | null>(null);

  const canSelect = destination.purchasable && Boolean(selected);

  useEffect(() => {
    if (!canSelect || !selected) {
      return;
    }
    const controller = new AbortController();
    void fetch("/api/cart/price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines: [
          {
            productId: selected.id,
            variantId: selected.variants.length ? variantId || selected.variants[0]?.id : null,
            quantity,
          },
        ],
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as ServerQuote & { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? "Fiyat alınamadı.");
        }
        setError(null);
        setQuote(payload);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setQuote(null);
        setError(cause instanceof Error ? cause.message : "Fiyat alınamadı.");
      });
    return () => controller.abort();
  }, [canSelect, selected, variantId, quantity]);

  const pricedLine = quote?.lines[0];
  const canBuy =
    canSelect &&
    Boolean(pricedLine?.isAvailable) &&
    (pricedLine?.unitPriceMinor ?? 0) > 0;

  async function buy() {
    if (!selected || !canBuy) return;
    setBusy(true);
    setError(null);
    addLine({
      productId: selected.id,
      variantId: selected.variants.length ? variantId || selected.variants[0]?.id : null,
      quantity,
    });
    router.push("/odeme" as Route);
  }

  return (
    <main id="ana-icerik" className="project-buy" data-project-source={destination.source}>
      <div
        className="project-buy-hero"
        style={{ backgroundImage: `url(${destination.heroPoster})` }}
      >
        <video
          data-project-hero-video={destination.slug}
          poster={destination.heroPoster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source media="(max-width: 767px)" src={destination.heroVideoMobile} type="video/mp4" />
          <source src={destination.heroVideoDesktop} type="video/mp4" />
        </video>
      </div>

      <section className="project-buy-body" aria-labelledby="project-buy-title">
        <p className="project-buy-kicker">OCTO STUDIO</p>
        <div className="project-buy-brand">
          <img src={destination.logo} alt="" width={48} height={48} />
          <h1 id="project-buy-title">{destination.name}</h1>
        </div>
        <p className="project-buy-lede">{destination.description}</p>

        {products.length > 1 ? (
          <fieldset className="project-buy-field">
            <legend>Ürün</legend>
            <div className="project-buy-choices">
              {products.map((item) => (
                <label key={item.id} data-active={item.id === selected?.id ? "true" : "false"}>
                  <input
                    type="radio"
                    name="project-product"
                    checked={item.id === selected?.id}
                    onChange={() => {
                      setProductId(item.id);
                      setVariantId(item.variants[0]?.id ?? "");
                    }}
                  />
                  {item.media[0]?.url ? (
                    <img src={item.media[0].url} alt="" width={56} height={56} />
                  ) : null}
                  <span>{item.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        {selected?.variants.length ? (
          <label className="project-buy-field">
            <span>Seçenek</span>
            <select
              value={variantId}
              onChange={(event) => setVariantId(event.target.value)}
            >
              {selected.variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {destination.purchasable ? (
          <label className="project-buy-field">
            <span>Adet</span>
            <input
              type="number"
              min={1}
              max={99}
              value={quantity}
              onChange={(event) =>
                setQuantity(Math.max(1, Math.min(99, Number(event.target.value) || 1)))
              }
            />
          </label>
        ) : null}

        <div className="project-buy-price" data-server-quote={quote ? "ready" : "idle"}>
          {destination.purchasable ? (
            pricedLine?.isAvailable ? (
              <dl className="project-buy-quote">
                <div>
                  <dt>Birim</dt>
                  <dd data-server-unit>{formatMoney(pricedLine.unitPriceMinor)}</dd>
                </div>
                <div>
                  <dt>Ara toplam</dt>
                  <dd data-server-subtotal>{formatMoney(quote?.subtotalMinor ?? 0)}</dd>
                </div>
                <div>
                  <dt>Kargo</dt>
                  <dd data-server-shipping>
                    {formatMoney(quote?.estimatedShippingMinor ?? 0)}
                  </dd>
                </div>
                <div>
                  <dt>Toplam</dt>
                  <dd data-server-total>{formatMoney(quote?.totalMinor ?? 0)}</dd>
                </div>
              </dl>
            ) : (
              <p className="project-buy-missing">{error ?? "Sunucu fiyatı bekleniyor."}</p>
            )
          ) : (
            <p className="project-buy-missing">{destination.priceMissingNote}</p>
          )}
        </div>

        <p className="project-buy-ship">{destination.delivery}</p>

        {destination.purchasable ? (
          <button
            type="button"
            className="project-buy-cta"
            disabled={!canBuy || busy}
            onClick={() => void buy()}
          >
            HEMEN SATIN AL
          </button>
        ) : (
          <button type="button" className="project-buy-cta project-buy-cta-soon" disabled>
            FİYAT YAKINDA
          </button>
        )}
        {error ? <p className="project-buy-error">{error}</p> : null}

        <div className="project-buy-details">
          <h2>Ürün detayı</h2>
          {selected?.media[0]?.url ? (
            <img src={selected.media[0].url} alt="" width={640} height={640} />
          ) : null}
          <p>{selected?.description ?? destination.description}</p>
        </div>

        <div className="project-buy-faq">
          <h2>Sık sorulanlar</h2>
          {destination.faq.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>

        <p className="project-buy-back">
          <Link href={"/" as Route}>Ana sayfaya dön</Link>
        </p>
      </section>

      {canBuy ? (
        <div className="project-buy-sticky" data-project-sticky="">
          <span data-sticky-total>{formatMoney(quote?.totalMinor ?? 0)}</span>
          <button type="button" disabled={busy} onClick={() => void buy()}>
            HEMEN SATIN AL
          </button>
        </div>
      ) : null}
    </main>
  );
}
