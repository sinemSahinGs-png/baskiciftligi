"use client";

import { useMemo, useState } from "react";
import { Check, Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { FormSignal } from "@/components/brand/form-signal";
import type { Product } from "@/domain/catalog/types";
import { isPersonalizableProduct } from "@/domain/catalog/presentation";
import { announceStatus } from "@/lib/motion";
import { formatMoney } from "@/lib/money";
import { useCartStore } from "@/stores/cart-store";
import { useFavoritesStore } from "@/stores/favorites-store";

export function ProductConfigurator({ product }: { product: Product }) {
  const activeVariants = useMemo(
    () => product.variants.filter((variant) => variant.isActive),
    [product.variants],
  );
  const initialVariant =
    activeVariants.find((variant) => variant.inventoryQuantity > 0) ??
    activeVariants[0];
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    initialVariant?.id ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [layerComplete, setLayerComplete] = useState(false);
  const [favoritePulse, setFavoritePulse] = useState(false);

  const addLine = useCartStore((state) => state.addLine);
  const favoriteIds = useFavoritesStore((state) => state.productIds);
  const favoritesHydrated = useFavoritesStore((state) => state.hasHydrated);
  const toggleFavorite = useFavoritesStore((state) => state.toggle);

  const selectedVariant = activeVariants.find(
    (variant) => variant.id === selectedVariantId,
  );
  const requiresVariant = product.variants.length > 0;
  const availableQuantity = selectedVariant
    ? selectedVariant.inventoryQuantity
    : product.inventoryQuantity;
  const canPurchase =
    (!requiresVariant || Boolean(selectedVariant)) && availableQuantity > 0;
  const maximumQuantity = Math.min(99, Math.max(1, availableQuantity));
  const unitPriceMinor =
    product.priceMinor + (selectedVariant?.priceAdjustmentMinor ?? 0);
  const compareAtPriceMinor =
    product.compareAtPriceMinor === null
      ? null
      : product.compareAtPriceMinor +
        (selectedVariant?.priceAdjustmentMinor ?? 0);
  const isFavorite = favoritesHydrated && favoriteIds.includes(product.id);

  const chooseVariant = (variantId: string) => {
    setSelectedVariantId(variantId);
    setQuantity(1);
  };

  const updateQuantity = (nextQuantity: number) => {
    if (!Number.isFinite(nextQuantity)) {
      return;
    }

    setQuantity(
      Math.max(1, Math.min(maximumQuantity, Math.trunc(nextQuantity))),
    );
  };

  const addToCart = () => {
    if (!canPurchase) {
      return;
    }

    addLine({
      productId: product.id,
      variantId: selectedVariant?.id ?? null,
      quantity,
    });
    toast.success("Ürün sepete eklendi", {
      description: `${quantity} × ${product.name}`,
    });
    setLayerComplete(true);
    announceStatus(`${product.name} sepete eklendi.`);
    window.setTimeout(() => setLayerComplete(false), 700);
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="tabular text-3xl font-semibold text-foreground">
          {formatMoney(unitPriceMinor, product.currency)}
        </p>
        {compareAtPriceMinor && compareAtPriceMinor > unitPriceMinor ? (
          <p className="tabular text-base text-muted-foreground line-through">
            {formatMoney(compareAtPriceMinor, product.currency)}
          </p>
        ) : null}
      </div>

      {activeVariants.length > 0 ? (
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">
            Seçenek
            {selectedVariant ? (
              <span className="ml-2 font-normal text-muted-foreground">
                {selectedVariant.name}
              </span>
            ) : null}
          </legend>
          <div className="grid gap-2 lg:grid-cols-2">
            {activeVariants.map((variant) => {
              const isSelected = variant.id === selectedVariantId;
              const isUnavailable = variant.inventoryQuantity < 1;

              return (
                <label
                  key={variant.id}
                  className="relative flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-hairline bg-optical px-3 py-2.5 transition-colors hover:border-border-strong has-checked:border-cobalt has-checked:bg-cobalt/8 has-disabled:cursor-not-allowed has-disabled:opacity-45"
                >
                  <input
                    type="radio"
                    name="product-variant"
                    value={variant.id}
                    checked={isSelected}
                    disabled={isUnavailable}
                    onChange={() => chooseVariant(variant.id)}
                    className="sr-only"
                  />
                  {variant.colorHex ? (
                    <span
                      aria-hidden="true"
                      className="size-6 shrink-0 rounded-full border border-white/25 shadow-inner"
                      style={{ backgroundColor: variant.colorHex }}
                    />
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {variant.colorName ?? variant.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {isUnavailable
                        ? "Tükendi"
                        : `${variant.inventoryQuantity} adet uygun`}
                    </span>
                  </span>
                  {isSelected ? (
                    <Check aria-hidden="true" className="size-4 text-ink" />
                  ) : null}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {isPersonalizableProduct(product) ? (
        <div className="rounded-lg border border-coral/25 bg-coral/8 p-4">
          <p className="text-sm font-semibold">Kişiselleştirme</p>
          <p className="mt-2 text-sm leading-6 text-ink-secondary">
            İsim, unvan veya logo bu fazda sepete yazılmaz. Geçerli seçim renk
            ve varyanttır; üretim onayı sonrası metin istenir.
          </p>
        </div>
      ) : null}

      <div
        id="stock-note"
        className="grid gap-4 rounded-lg border border-hairline bg-optical p-4 text-sm"
      >
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            Uygunluk
          </p>
          <p
            className={
              canPurchase ? "mt-1 text-foreground" : "mt-1 text-destructive"
            }
          >
            {canPurchase
              ? `${availableQuantity} adet siparişe uygun`
              : "Şu anda siparişe uygun değil"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            Hazırlık süresi
          </p>
          <p className="mt-1 text-foreground">
            {product.productionLeadTimeDays.min}–
            {product.productionLeadTimeDays.max} iş günü
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div
          className="flex h-13 items-center justify-between rounded-md border border-hairline bg-optical px-1"
          aria-label="Ürün adedi"
        >
          <button
            type="button"
            aria-label="Adedi azalt"
            disabled={!canPurchase || quantity <= 1}
            onClick={() => updateQuantity(quantity - 1)}
            className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground disabled:opacity-35"
          >
            <Minus aria-hidden="true" className="size-4" />
          </button>
          <label htmlFor="product-quantity" className="sr-only">
            Adet
          </label>
          <input
            id="product-quantity"
            type="number"
            inputMode="numeric"
            min={1}
            max={maximumQuantity}
            value={quantity}
            disabled={!canPurchase}
            onChange={(event) =>
              updateQuantity(event.currentTarget.valueAsNumber)
            }
            className="tabular w-12 border-0 bg-transparent text-center text-sm font-bold outline-none"
          />
          <button
            type="button"
            aria-label="Adedi artır"
            disabled={!canPurchase || quantity >= maximumQuantity}
            onClick={() => updateQuantity(quantity + 1)}
            className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground disabled:opacity-35"
          >
            <Plus aria-hidden="true" className="size-4" />
          </button>
        </div>

        <button
          type="button"
          disabled={!canPurchase}
          aria-describedby="stock-note"
          onClick={addToCart}
          className={`inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-md bg-coral px-6 text-sm font-semibold text-light-text transition-transform duration-200 hover:bg-brand-hover active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 ${layerComplete ? "layer-complete-in bg-lime text-midnight hover:bg-lime" : ""}`}
        >
          {layerComplete ? (
            <FormSignal tone="dark" className="size-4" />
          ) : (
            <ShoppingBag aria-hidden="true" className="size-4" />
          )}
          {layerComplete
            ? "Katman tamam"
            : canPurchase
              ? "Sepete ekle"
              : "Stokta yok"}
        </button>

        <button
          type="button"
          disabled={!favoritesHydrated}
          aria-pressed={isFavorite}
          aria-label={
            favoritesHydrated
              ? isFavorite
                ? "Favorilerden çıkar"
                : "Favorilere ekle"
              : "Favori durumu yükleniyor"
          }
          onClick={() => {
            const next = !isFavorite;
            toggleFavorite(product.id);
            setFavoritePulse(true);
            window.setTimeout(() => setFavoritePulse(false), 320);
            announceStatus(
              next ? "Favorilere eklendi." : "Favorilerden çıkarıldı.",
            );
          }}
          className={`inline-flex size-13 shrink-0 items-center justify-center self-center rounded-md border border-hairline text-ink-secondary transition-transform duration-200 hover:text-ink disabled:opacity-40 aria-pressed:border-coral aria-pressed:bg-coral/10 aria-pressed:text-coral ${favoritePulse ? "scale-110" : ""}`}
        >
          <Heart
            aria-hidden="true"
            className="size-5"
            fill={isFavorite ? "currentColor" : "none"}
          />
        </button>
      </div>

      <p className="text-sm leading-6 text-ink-secondary">
        Fiyat seçili varyanta göre gösterilir. Sepetteki güncel fiyat ve
        uygunluk, sunucuda yeniden doğrulanır. Kargo tahmini sepet özetinde
        hesaplanır.
      </p>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-porcelain/95 p-3 backdrop-blur-sm lg:hidden">
        <div className="flex items-center gap-3">
          <p className="type-price min-w-0 flex-1 truncate text-base">
            {formatMoney(unitPriceMinor, product.currency)}
          </p>
          <button
            type="button"
            disabled={!canPurchase}
            onClick={addToCart}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-md bg-coral px-4 text-sm font-semibold text-light-text disabled:opacity-45"
          >
            {canPurchase ? "Sepete ekle" : "Stokta yok"}
          </button>
        </div>
      </div>
    </div>
  );
}

export const ProductPurchasePanel = ProductConfigurator;
