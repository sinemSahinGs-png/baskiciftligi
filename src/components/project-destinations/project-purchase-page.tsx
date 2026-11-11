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
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const [quote, setQuote] = useState<ServerQuote | null>(null);
  const [quoteKey, setQuoteKey] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  const canSelect = destination.purchasable && Boolean(selected);
  const requestKey =
    canSelect && selected
      ? `${selected.id}:${selected.variants.length ? variantId || selected.variants[0]?.id : "default"}:${quantity}`
      : null;
  const quoteLoading = Boolean(requestKey) && quoteKey !== requestKey && error?.key !== requestKey;
  const quoteFailed = Boolean(requestKey) && error?.key === requestKey;
  const pricedLine = quoteKey === requestKey ? quote?.lines[0] : undefined;
  const canBuy =
    canSelect &&
    !quoteLoading &&
    !quoteFailed &&
    Boolean(pricedLine?.isAvailable) &&
    (pricedLine?.unitPriceMinor ?? 0) > 0;

  useEffect(() => {
    if (!canSelect || !selected || !requestKey) {
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
        setQuoteKey(requestKey);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setQuote(null);
        setQuoteKey(null);
        setError({
          key: requestKey,
          message: cause instanceof Error ? cause.message : "Fiyat alınamadı.",
        });
      });
    return () => controller.abort();
  }, [canSelect, selected, variantId, quantity, requestKey, retry]);

  function addSelected() {
    if (!selected || !canBuy) return false;
    addLine({
      productId: selected.id,
      variantId: selected.variants.length ? variantId || selected.variants[0]?.id : null,
      quantity,
    });
    return true;
  }

  async function buyGuest() {
    if (!addSelected()) return;
    setBusy(true);
    setError(null);
    router.push("/odeme" as Route);
  }

  async function buyMember() {
    if (!addSelected()) return;
    setBusy(true);
    setError(null);
    router.push("/giris?next=/odeme" as Route);
  }

  const quoteState = destination.purchasable
    ? quoteFailed
      ? "error"
      : quoteLoading
        ? "loading"
        : pricedLine?.isAvailable
          ? "ready"
          : "idle"
    : "unavailable";

  return (
    <main
      id="ana-icerik"
      className="project-buy"
      data-project-source={destination.source}
      data-project-theme={destination.slug}
    >
      <div
        className="project-buy-hero"
        data-project-hero=""
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
        <span className="project-buy-hero-fade" aria-hidden="true" />
      </div>

      <section className="project-buy-stage" aria-labelledby="project-buy-title">
        <div className="project-buy-intro">
          <p className="project-buy-kicker">OCTO STUDIO</p>
          <div className="project-buy-brand">
            <img src={destination.logo} alt="" width={48} height={48} />
            <h1 id="project-buy-title">{destination.name}</h1>
          </div>
          <p className="project-buy-lede">{destination.description}</p>
        </div>

        <figure className="project-buy-media" data-purchase-media="">
          {selected?.media[0]?.url ? (
            <img
              src={selected.media[0].url}
              alt={selected.name}
              width={960}
              height={960}
            />
          ) : null}
          <figcaption>
            <span>{selected?.name ?? destination.name}</span>
            <p>{selected?.description ?? destination.description}</p>
          </figcaption>
        </figure>

        <div className="project-buy-panel">
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
                    <span>
                      <b>{item.name}</b>
                      {destination.slug === "lil-disc" ? (
                        <em>{formatMoney(item.priceMinor)}</em>
                      ) : null}
                    </span>
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

          <div
            className="project-buy-price"
            data-server-quote={quoteState}
            aria-busy={quoteLoading ? true : undefined}
          >
            {destination.purchasable ? (
              quoteFailed ? (
                <div className="project-buy-retry">
                  <p className="project-buy-error">{error?.message ?? "Fiyat alınamadı."}</p>
                  <button type="button" onClick={() => setRetry((value) => value + 1)}>
                    Tekrar dene
                  </button>
                </div>
              ) : quoteLoading || !pricedLine?.isAvailable ? (
                <dl className="project-buy-quote" data-quote-skeleton="">
                  <div>
                    <dt>Birim</dt>
                    <dd>Fiyat hazırlanıyor</dd>
                  </div>
                  <div>
                    <dt>Kargo</dt>
                    <dd aria-hidden="true">····</dd>
                  </div>
                  <div>
                    <dt>Toplam</dt>
                    <dd aria-hidden="true">····</dd>
                  </div>
                </dl>
              ) : (
                <dl className="project-buy-quote">
                  <div>
                    <dt>Birim</dt>
                    <dd data-server-unit>{formatMoney(pricedLine.unitPriceMinor)}</dd>
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
              )
            ) : (
              <p className="project-buy-missing">{destination.priceMissingNote}</p>
            )}
          </div>

          {destination.purchasable ? (
            <div className="project-buy-actions">
              <button
                type="button"
                className="project-buy-cta"
                data-buy-guest=""
                disabled={!canBuy || busy}
                onClick={() => void buyGuest()}
              >
                Satın Al
              </button>
              {destination.slug === "lil-disc" ? (
                <p className="project-buy-member-hint">
                  Üye girişi ödeme ekranında.{" "}
                  <Link href={"/giris?next=/odeme" as Route}>Giriş yap</Link>
                </p>
              ) : (
                <button
                  type="button"
                  className="project-buy-cta-ghost"
                  data-buy-member=""
                  disabled={!canBuy || busy}
                  onClick={() => void buyMember()}
                >
                  Üye girişi ile al
                </button>
              )}
            </div>
          ) : (
            <button type="button" className="project-buy-cta project-buy-cta-soon" disabled>
              FİYAT YAKINDA
            </button>
          )}
        </div>
      </section>

      <section className="project-buy-faq" aria-labelledby="project-buy-faq-title">
        <h2 id="project-buy-faq-title">Sık sorulanlar</h2>
        {destination.faq.slice(0, 2).map((item) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
        <p className="project-buy-back">
          <Link href={"/" as Route}>Ana sayfaya dön</Link>
        </p>
      </section>

      {destination.purchasable && destination.slug !== "lil-disc" ? (
        <div className="project-buy-sticky" data-project-sticky="">
          <span data-sticky-total>
            {canBuy ? formatMoney(quote?.totalMinor ?? 0) : "Fiyat hazırlanıyor"}
          </span>
          <button type="button" disabled={!canBuy || busy} onClick={() => void buyGuest()}>
            SATIN AL
          </button>
        </div>
      ) : null}
    </main>
  );
}
