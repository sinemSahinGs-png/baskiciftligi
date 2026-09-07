"use client";

import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Heart, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { FormSignal } from "@/components/brand/form-signal";
import { ProductStage } from "@/components/catalog/product-stage";
import { PriceDisplay } from "@/components/commerce/price-display";
import { InteractiveMedia } from "@/components/motion/premium";
import { resolveProductVisual } from "@/domain/catalog/media";
import { storeProductAction } from "@/domain/catalog/presentation";
import type { Product } from "@/domain/catalog/types";
import { announceStatus } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useFavoritesStore } from "@/stores/favorites-store";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  featured?: boolean;
  tone?: "default" | "store";
}

const badgeLabels: Record<Product["badges"][number], string> = {
  new: "Yeni",
  bestseller: "Öne çıkan",
  limited: "Sınırlı",
};

export function ProductCard({
  product,
  priority = false,
  featured = false,
  tone = "default",
}: ProductCardProps) {
  const availableVariants = useMemo(
    () => product.variants.filter((variant) => variant.isActive),
    [product.variants],
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    () =>
      availableVariants.find((variant) => variant.inventoryQuantity > 0)?.id ??
      availableVariants[0]?.id ??
      null,
  );
  const [layerComplete, setLayerComplete] = useState(false);
  const [favoritePulse, setFavoritePulse] = useState(false);

  const selectedVariant =
    availableVariants.find((variant) => variant.id === selectedVariantId) ??
    availableVariants[0];
  const visual = resolveProductVisual(product);
  const addLine = useCartStore((state) => state.addLine);
  const favoriteIds = useFavoritesStore((state) => state.productIds);
  const favoritesHydrated = useFavoritesStore((state) => state.hasHydrated);
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const isFavorite = favoritesHydrated && favoriteIds.includes(product.id);
  const inventoryQuantity = selectedVariant
    ? selectedVariant.inventoryQuantity
    : product.inventoryQuantity;
  const canAdd =
    product.status === "active" &&
    inventoryQuantity > 0 &&
    (product.variants.length === 0 || Boolean(selectedVariant));
  const priceMinor =
    product.priceMinor + (selectedVariant?.priceAdjustmentMinor ?? 0);
  const productHref = `/urun/${product.slug}` as Route;
  const badge = product.badges[0];
  const action = storeProductAction(product);
  const isStore = tone === "store";
  const stockLabel =
    inventoryQuantity > 0
      ? product.kind === "made_to_order"
        ? "Siparişe göre"
        : "Stokta"
      : "Tükendi";
  const summary = [product.materialSummary || product.materialCode, stockLabel]
    .filter(Boolean)
    .join(" · ");

  function handleQuickAdd() {
    if (!canAdd || action.kind !== "add") {
      return;
    }
    addLine({
      productId: product.id,
      variantId: selectedVariant?.id ?? null,
      quantity: 1,
    });
    toast.success(
      product.isDemo ? "Demo ürün yerel sepete eklendi." : "Ürün sepete eklendi.",
      {
        description: selectedVariant
          ? `${product.name} · ${selectedVariant.name}`
          : product.name,
      },
    );
    setLayerComplete(true);
    announceStatus(`${product.name} sepete eklendi.`);
    window.setTimeout(() => setLayerComplete(false), 700);
  }

  const favoriteButton = (
    <button
      type="button"
      aria-label={
        isFavorite
          ? `${product.name} ürününü favorilerden çıkar`
          : `${product.name} ürününü favorilere ekle`
      }
      aria-pressed={isFavorite}
      disabled={!favoritesHydrated}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!favoritesHydrated) {
          return;
        }
        const next = !isFavorite;
        toggleFavorite(product.id);
        setFavoritePulse(true);
        window.setTimeout(() => setFavoritePulse(false), 320);
        announceStatus(
          next
            ? `${product.name} favorilere eklendi.`
            : `${product.name} favorilerden çıkarıldı.`,
        );
      }}
      className={cn(
        isStore
          ? "store-card-fav"
          : "absolute top-3 right-3 z-20 inline-flex size-11 items-center justify-center rounded-full bg-midnight/55 text-light-text transition-transform duration-200",
        isFavorite && (isStore ? "text-[color:var(--shop-orange)]" : "text-coral"),
        favoritePulse && "scale-110",
      )}
    >
      <Heart
        aria-hidden="true"
        className={cn("size-4", isFavorite && "fill-current")}
      />
    </button>
  );

  const purchaseControl = isStore
    ? action.kind === "add"
      ? (
          <button
            type="button"
            disabled={!canAdd}
            onClick={handleQuickAdd}
            data-complete={layerComplete ? "true" : undefined}
            aria-label={
              canAdd
                ? `${product.name} ürününü sepete ekle`
                : `${product.name} şu anda sepete eklenemiyor`
            }
            className="store-card-cart"
          >
            {layerComplete ? (
              <FormSignal tone="dark" className="size-4" />
            ) : (
              <ShoppingBag aria-hidden="true" className="size-4" />
            )}
            <span>{layerComplete ? "Eklendi" : action.label}</span>
          </button>
        )
      : (
          <Link href={productHref} className="store-card-text-action">
            {action.label}
          </Link>
        )
    : action.kind === "add"
      ? (
          <button
            type="button"
            disabled={!canAdd}
            onClick={handleQuickAdd}
            aria-label={
              canAdd
                ? `${product.name} ürününü sepete ekle`
                : `${product.name} şu anda sepete eklenemiyor`
            }
            className={cn(
              "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-midnight text-sm font-semibold text-light-text",
              layerComplete && "layer-complete-in bg-lime text-midnight",
            )}
          >
            {layerComplete ? (
              <FormSignal tone="dark" className="size-4" />
            ) : (
              <Plus aria-hidden="true" className="size-4" />
            )}
            {layerComplete ? "Katman tamam" : "Sepete ekle"}
          </button>
        )
      : (
          <Link
            href={productHref}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-midnight text-sm font-semibold text-light-text"
          >
            {action.label}
          </Link>
        );

  const stageChildren = (
    <>
      <Link
        href={productHref}
        aria-label={`${product.name} ürününü görüntüle`}
        className="absolute inset-0 z-[1]"
      >
        <span className="sr-only">{product.name}</span>
      </Link>
      {badge || product.isDemo ? (
        <span
          className={
            isStore
              ? "store-card-badge"
              : "absolute top-3 left-3 z-20 bg-midnight/70 px-2.5 py-1 text-[0.75rem] font-semibold text-light-text"
          }
        >
          {product.isDemo ? "Demo" : badgeLabels[badge]}
        </span>
      ) : null}
      {favoriteButton}
    </>
  );

  return (
    <article
      data-product-slug={product.slug}
      className={cn(
        isStore
          ? "store-card"
          : "group/card flex h-full min-w-0 flex-col transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none max-md:transform-none md:hover:-translate-y-1.5",
      )}
    >
      {isStore ? (
        <InteractiveMedia>
          <ProductStage
            stage={visual.stage}
            src={visual.primary?.url}
            hoverSrc={visual.hover?.url}
            mobileSrc={visual.mobile?.url}
            videoSrc={visual.video?.url}
            alt={visual.primary?.alt ?? product.name}
            isolated
            objectPosition={visual.objectPosition}
            mobileObjectPosition={visual.mobileObjectPosition}
            sizes={
              featured
                ? "(max-width: 768px) 100vw, 40vw"
                : "(max-width: 640px) 46vw, (max-width: 1280px) 22vw, 18vw"
            }
            preload={priority}
            ratio="square"
            grid={false}
            className="store-card-media"
            imageClassName="store-card-image"
          >
            {stageChildren}
          </ProductStage>
        </InteractiveMedia>
      ) : (
        <ProductStage
          stage={visual.stage}
          src={visual.primary?.url}
          hoverSrc={visual.hover?.url}
          mobileSrc={visual.mobile?.url}
          videoSrc={visual.video?.url}
          alt={visual.primary?.alt ?? product.name}
          isolated={visual.isolated}
          objectPosition={visual.objectPosition}
          mobileObjectPosition={visual.mobileObjectPosition}
          sizes={
            featured
              ? "(max-width: 768px) 100vw, 40vw"
              : "(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 20vw"
          }
          preload={priority}
          ratio="standard"
          className="rounded-lg"
        >
          {stageChildren}
        </ProductStage>
      )}

      <div className={isStore ? "store-card-body" : "flex flex-1 flex-col pt-3"}>
        {!isStore && availableVariants.length > 1 ? (
          <div
            role="group"
            aria-label={`${product.name} renkleri`}
            className="mb-2 flex gap-1.5"
          >
            {availableVariants.slice(0, 4).map((variant) => (
              <button
                key={variant.id}
                type="button"
                aria-label={variant.colorName ?? variant.name}
                aria-pressed={variant.id === selectedVariant?.id}
                onClick={() => setSelectedVariantId(variant.id)}
                className={cn(
                  "size-5 rounded-full border",
                  variant.id === selectedVariant?.id
                    ? "border-ink ring-2 ring-ink/15"
                    : "border-hairline",
                )}
                style={{ backgroundColor: variant.colorHex ?? "#d9d4cb" }}
              />
            ))}
          </div>
        ) : null}
        <Link
          href={productHref}
          className={cn(
            isStore ? "store-card-name" : "line-clamp-2 leading-snug font-medium hover:underline",
            !isStore && featured
              ? "text-[1.15rem] sm:text-[1.25rem]"
              : !isStore
                ? "text-[1.02rem] sm:text-[1.08rem]"
                : undefined,
          )}
        >
          {product.name}
        </Link>
        {isStore && summary ? <p className="store-card-meta">{summary}</p> : null}
        {isStore ? (
          <>
            <PriceDisplay
              priceMinor={priceMinor}
              compareAtPriceMinor={product.compareAtPriceMinor}
              currency={product.currency}
              className="store-card-price"
            />
            <div className="store-card-buy">{purchaseControl}</div>
          </>
        ) : (
          <>
            <PriceDisplay
              priceMinor={priceMinor}
              compareAtPriceMinor={product.compareAtPriceMinor}
              currency={product.currency}
              className="mt-1.5"
            />
            <div className="mt-auto pt-3">{purchaseControl}</div>
          </>
        )}
      </div>
    </article>
  );
}
