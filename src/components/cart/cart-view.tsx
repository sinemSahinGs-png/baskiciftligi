"use client";

import { useEffect, useState } from "react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  ImageIcon,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";

import { FormSignal } from "@/components/brand/form-signal";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import type { CartPriceResult } from "@/domain/commerce/cart-pricing";
import type { CartLineDisplayKind } from "@/domain/catalog/presentation";
import { formatMoney } from "@/lib/money";
import { useCartStore } from "@/stores/cart-store";
import { useFavoritesStore } from "@/stores/favorites-store";

type PriceStatus = "idle" | "loading" | "success" | "error";

function getResponseError(payload: unknown): string | null {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return null;
}

function lineTypeLabel(kind: CartLineDisplayKind) {
  if (kind === "personalized") {
    return "Kişiselleştirilmiş ürün";
  }
  if (kind === "uploaded") {
    return "Yüklenen model";
  }
  if (kind === "licensed") {
    return "Lisanslı model";
  }
  return "Mağaza ürünü";
}

function lineKindColor(kind: CartLineDisplayKind) {
  if (kind === "personalized") {
    return "#FF6542";
  }
  if (kind === "uploaded") {
    return "#30D5D2";
  }
  if (kind === "licensed") {
    return "#7A42F4";
  }
  return "#4054FF";
}

function lineSettings(kind: CartLineDisplayKind, variantName: string | null) {
  if (kind === "uploaded") {
    return "Yazdırma ayarları değerlendirme sonrası netleşir.";
  }
  if (kind === "licensed") {
    return "Üretim, doğrulanmış izin kaydına bağlıdır.";
  }
  if (kind === "personalized") {
    return variantName
      ? `${variantName} · metin/logo bu fazda sepete yazılmaz`
      : "Kişiselleştirme varyant seçimiyle sınırlı";
  }
  return variantName ? variantName : "Katalog seçenekleri";
}

export function CartView() {
  const lines = useCartStore((state) => state.lines);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeLine = useCartStore((state) => state.removeLine);
  const clear = useCartStore((state) => state.clear);
  const favoriteIds = useFavoritesStore((state) => state.productIds);
  const favoritesHydrated = useFavoritesStore((state) => state.hasHydrated);
  const toggleFavorite = useFavoritesStore((state) => state.toggle);

  const inputKey = JSON.stringify(
    lines.map((line) => [
      line.productId,
      line.variantId ?? null,
      line.quantity,
    ]),
  );
  const [result, setResult] = useState<CartPriceResult | null>(null);
  const [pricedInputKey, setPricedInputKey] = useState<string | null>(null);
  const [status, setStatus] = useState<PriceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [failedImages, setFailedImages] = useState<string[]>([]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (lines.length === 0) {
      return;
    }

    const controller = new AbortController();
    const requestInputKey = inputKey;

    async function requestServerPrice() {
      setResult(null);
      setPricedInputKey(null);
      setError(null);
      setStatus("loading");

      try {
        const response = await fetch("/api/cart/price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lines: lines.map((line) => ({
              productId: line.productId,
              variantId: line.variantId ?? null,
              quantity: line.quantity,
            })),
          }),
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload: unknown = await response.json().catch(() => null);
          throw new Error(
            getResponseError(payload) ?? "Sepet fiyatı şu anda doğrulanamıyor.",
          );
        }

        const pricedCart = (await response.json()) as CartPriceResult;

        if (!controller.signal.aborted) {
          setResult(pricedCart);
          setPricedInputKey(requestInputKey);
          setStatus("success");
        }
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        setResult(null);
        setPricedInputKey(null);
        setStatus("error");
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Sepet fiyatı şu anda doğrulanamıyor.",
        );
      }
    }

    void requestServerPrice();

    return () => controller.abort();
  }, [hasHydrated, inputKey, lines, retryKey]);

  if (!hasHydrated) {
    return <CartLoadingState hydrated={hasHydrated} />;
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag aria-hidden="true" className="size-5" />}
        title="Sepetin şu anda boş"
        description="Hazır ürünleri keşfet. Varyantını seçtiğinde güncel fiyat ve stok ödeme öncesinde yeniden doğrulanır."
        action={{ href: "/magaza", label: "Mağazaya git" }}
      />
    );
  }

  if (
    status === "idle" ||
    status === "loading" ||
    pricedInputKey !== inputKey
  ) {
    return <CartLoadingState hydrated />;
  }

  if (status === "error" || !result) {
    return (
      <ErrorState
        title="Sepet doğrulanamadı"
        description={
          error ??
          "Güncel fiyat ve stok bilgisi alınamadı. Ödeme adımına geçmeden önce yeniden deneyin."
        }
        onRetry={() => setRetryKey((key) => key + 1)}
      />
    );
  }

  const remainingForFreeShipping = Math.max(
    0,
    result.freeShippingThresholdMinor - result.subtotalMinor,
  );
  const shippingProgress =
    result.freeShippingThresholdMinor > 0
      ? Math.min(
          100,
          (result.subtotalMinor / result.freeShippingThresholdMinor) * 100,
        )
      : 100;
  const leadTimes = result.lines
    .filter((line) => line.isAvailable)
    .map((line) => line.productionLeadTimeDays);
  const mixedLead =
    leadTimes.length > 1 &&
    leadTimes.some(
      (item) =>
        item.max !== leadTimes[0]?.max || item.min !== leadTimes[0]?.min,
    );

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section aria-labelledby="cart-lines-heading" className="min-w-0">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="cart-lines-heading" className="font-heading text-2xl font-bold">
            Ürünler
          </h2>
          <button
            type="button"
            onClick={clear}
            className="text-sm text-ink-secondary underline-offset-4 hover:underline"
          >
            Sepeti temizle
          </button>
        </div>

        {mixedLead ? (
          <p className="mb-4 rounded-md bg-violet/10 px-4 py-3 text-sm leading-6">
            Sepetteki ürünlerin üretim süreleri farklı. Teslimat, en uzun hazırlık
            süresine göre planlanır.
          </p>
        ) : null}

        <ul className="divide-y divide-hairline border-y border-hairline" aria-live="polite">
          {result.lines.map((line, index) => {
            const inputLine = lines[index];
            const cartProductId = inputLine?.productId ?? line.productId;
            const cartVariantId = inputLine?.variantId ?? line.variantId;
            const imageUrl = line.imageUrl;
            const imageFailed = !imageUrl || failedImages.includes(imageUrl);

            return (
              <li
                key={`${line.key}-${index}`}
                className="grid gap-4 py-5 sm:grid-cols-[6.5rem_minmax(0,1fr)_auto]"
              >
                <div className="media-frame relative aspect-square">
                  {imageFailed ? (
                    <div className="flex h-full items-center justify-center text-ink-muted">
                      <ImageIcon aria-hidden="true" className="size-6" />
                    </div>
                  ) : (
                    <Image
                      src={imageUrl}
                      alt={line.name}
                      fill
                      sizes="7rem"
                      className="object-cover"
                      onError={() =>
                        setFailedImages((current) =>
                          current.includes(imageUrl)
                            ? current
                            : [...current, imageUrl],
                        )
                      }
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <p
                    className="kind-signal"
                    style={{
                      ["--kind" as string]: lineKindColor(line.displayKind),
                    }}
                  >
                    {lineTypeLabel(line.displayKind)}
                  </p>
                  <div className="mt-1 flex flex-wrap items-start gap-2">
                    {line.slug ? (
                      <Link
                        href={`/urun/${line.slug}`}
                        className="font-heading text-lg font-bold hover:underline"
                      >
                        {line.name}
                      </Link>
                    ) : (
                      <p className="font-heading text-lg font-bold">{line.name}</p>
                    )}
                    {line.isDemo ? (
                      <span className="rounded-md bg-coral/15 px-2 py-0.5 text-xs font-semibold text-coral">
                        Demo
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-ink-secondary">
                    {lineSettings(line.displayKind, line.variantName)}
                  </p>
                  <p className="mt-2 text-xs text-ink-muted">
                    Hazırlık: {line.productionLeadTimeDays.min}–
                    {line.productionLeadTimeDays.max} iş günü
                  </p>
                  {!line.isAvailable ? (
                    <p className="mt-2 text-sm font-semibold text-error">
                      {line.availableQuantity > 0
                        ? `Yalnızca ${line.availableQuantity} adet uygun`
                        : "Bu seçenek şu anda satışa uygun değil"}
                    </p>
                  ) : null}

                  <div className="mt-4 flex w-fit items-center rounded-md border border-hairline p-0.5">
                    <button
                      type="button"
                      aria-label={`${line.name} adedini azalt`}
                      onClick={() =>
                        setQuantity(
                          cartProductId,
                          cartVariantId,
                          line.quantity - 1,
                        )
                      }
                      className="inline-flex size-11 items-center justify-center text-ink-secondary"
                    >
                      <Minus aria-hidden="true" className="size-3.5" />
                    </button>
                    <label
                      htmlFor={`cart-quantity-${index}`}
                      className="sr-only"
                    >
                      {line.name} adedi
                    </label>
                    <input
                      id={`cart-quantity-${index}`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={99}
                      value={line.quantity}
                      onChange={(event) => {
                        const nextQuantity = event.currentTarget.valueAsNumber;

                        if (Number.isFinite(nextQuantity)) {
                          setQuantity(
                            cartProductId,
                            cartVariantId,
                            Math.max(1, Math.min(99, Math.trunc(nextQuantity))),
                          );
                        }
                      }}
                      className="tabular w-11 border-0 bg-transparent text-center text-sm font-semibold outline-none"
                    />
                    <button
                      type="button"
                      aria-label={`${line.name} adedini artır`}
                      disabled={
                        line.quantity >= 99 ||
                        (line.availableQuantity > 0 &&
                          line.quantity >= line.availableQuantity)
                      }
                      onClick={() =>
                        setQuantity(
                          cartProductId,
                          cartVariantId,
                          line.quantity + 1,
                        )
                      }
                      className="inline-flex size-11 items-center justify-center text-ink-secondary disabled:opacity-35"
                    >
                      <Plus aria-hidden="true" className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-4 sm:flex-col sm:items-end">
                  <div className="text-right">
                    <p className="type-price">
                      {formatMoney(line.lineTotalMinor, result.currency)}
                    </p>
                    {line.quantity > 1 ? (
                      <p className="tabular mt-1 text-xs text-ink-muted">
                        {formatMoney(line.unitPriceMinor, result.currency)} /
                        adet
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={!favoritesHydrated}
                      aria-label={`${line.name} ürününü kaydet`}
                      onClick={() => toggleFavorite(cartProductId)}
                      className="inline-flex size-11 items-center justify-center text-ink-muted hover:text-coral disabled:opacity-40"
                    >
                      <Heart
                        aria-hidden="true"
                        className="size-4"
                        fill={
                          favoritesHydrated && favoriteIds.includes(cartProductId)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                    <button
                      type="button"
                      aria-label={`${line.name} ürününü sepetten çıkar`}
                      onClick={() => removeLine(cartProductId, cartVariantId)}
                      className="inline-flex size-11 items-center justify-center text-ink-muted hover:text-error"
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <aside
        aria-labelledby="cart-summary-heading"
        className="rounded-lg border border-hairline bg-optical p-5 lg:sticky lg:top-24"
      >
        <h2 id="cart-summary-heading" className="font-heading text-2xl font-bold">
          Sipariş özeti
        </h2>

        <div className="mt-5 rounded-lg bg-porcelain p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Truck aria-hidden="true" className="size-4" />
            {remainingForFreeShipping === 0
              ? "Ücretsiz kargo eşiği aşıldı"
              : `${formatMoney(remainingForFreeShipping, result.currency)} daha ekle`}
          </div>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Ücretsiz kargo ilerlemesi"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(shippingProgress)}
          >
            <div
              className="h-full bg-cobalt"
              style={{ width: `${shippingProgress}%` }}
            />
          </div>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-ink-secondary">Ara toplam</dt>
            <dd className="tabular font-medium">
              {formatMoney(result.subtotalMinor, result.currency)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-ink-secondary">Tahmini kargo</dt>
            <dd className="tabular font-medium">
              {formatMoney(result.estimatedShippingMinor, result.currency)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-ink-secondary">KDV</dt>
            <dd className="text-ink-muted">Fiyatlara dahildir</dd>
          </div>
          <div className="rule my-4" />
          <div className="flex items-baseline justify-between gap-4">
            <dt className="font-semibold">Toplam</dt>
            <dd className="type-price text-2xl">
              {formatMoney(result.totalMinor, result.currency)}
            </dd>
          </div>
        </dl>

        <label className="mt-5 block text-sm font-semibold">
          Kupon
          <input
            disabled
            placeholder="Kod altyapısı henüz açık değil"
            className="mt-2 h-11 w-full rounded-md border border-hairline bg-muted px-3 font-normal"
          />
        </label>

        {result.hasUnavailableItems ? (
          <>
            <p className="mt-5 rounded-md border border-error/25 bg-paper p-3 text-xs leading-5 text-error">
              Devam etmek için uygun olmayan ürünleri kaldır veya adetlerini
              güncelle.
            </p>
            <button
              type="button"
              disabled
              className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-md bg-brand px-5 text-sm font-semibold text-paper opacity-45"
            >
              Ödeme adımına geç
            </button>
          </>
        ) : (
          <Link
            href={"/odeme" as Route}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-brand px-5 py-3 text-center text-sm font-semibold text-paper hover:bg-brand-hover"
          >
            Ödeme adımına geç
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        )}

        <p className="mt-3 text-center text-xs leading-5 text-ink-muted">
          Ödeme entegrasyonu henüz kullanıma açık değil. Güncel fiyat bu sayfada
          sunucudan doğrulanır.
        </p>
      </aside>
    </div>
  );
}

function CartLoadingState({ hydrated }: { hydrated: boolean }) {
  return (
    <div
      role="status"
      aria-label={hydrated ? "Sepet fiyatı doğrulanıyor" : "Sepet yükleniyor"}
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]"
    >
      <span className="sr-only">
        {hydrated ? "Güncel fiyatlar doğrulanıyor…" : "Sepet yükleniyor…"}
      </span>
      <div aria-hidden="true" className="space-y-3">
        {Array.from({ length: 2 }, (_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-xl bg-muted"
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        className="flex h-72 animate-pulse items-center justify-center rounded-xl bg-muted"
      >
        <FormSignal spinning tone="dark" className="size-6" />
      </div>
    </div>
  );
}
