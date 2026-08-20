"use client";

import type { Route } from "next";
import Link from "next/link";
import { forwardRef } from "react";

import { SafeImage } from "@/components/media/safe-image";
import { cn } from "@/lib/utils";

export interface CuratedCatalogCardData {
  id: string;
  slug: string;
  titleTr: string;
  categoryLabel: string | null;
  listingKind: "studio" | "curated_external";
  previewImageUrl: string | null;
  imageAlt: string | null;
  authorName: string | null;
  platformType?: string | null;
  platformLabel?: string | null;
  sourceUrl?: string | null;
  hasProductionFile?: boolean;
  licenseName?: string | null;
  licenseVerified?: boolean;
  attribution?: string | null;
}

export const CuratedCatalogCard = forwardRef<
  HTMLButtonElement,
  {
    model: CuratedCatalogCardData;
    className?: string;
    onExternalQuote?: (model: CuratedCatalogCardData) => void;
  }
>(function CuratedCatalogCard({ model, className, onExternalQuote }, ref) {
  const isExternal = model.listingKind === "curated_external";
  const detailHref = (
    isExternal
      ? `/hazir-modeller/katalog/${model.slug}`
      : `/hazir-modeller/baski-ciftligi/${model.slug}`
  ) as Route;

  return (
    <article
      className={cn("flex h-full min-w-0 flex-col", className)}
      data-curated-card={model.listingKind}
    >
      <div className="group flex h-full flex-col">
        <Link
          href={detailHref}
          className="relative aspect-[4/5] overflow-hidden rounded-lg bg-midnight/80"
        >
          {model.previewImageUrl ? (
            <SafeImage
              src={model.previewImageUrl}
              alt={model.imageAlt || model.titleTr}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              fallbackLabel="Önizleme yok"
            />
          ) : (
            <div className="grid h-full place-items-center px-3 text-center text-xs text-muted-light">
              Görsel yok
            </div>
          )}
          {isExternal ? (
            <span className="absolute top-2 left-2 rounded bg-black/55 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white/90">
              Harici model
            </span>
          ) : null}
        </Link>
        <div className="mt-3 flex flex-1 flex-col">
          {model.categoryLabel ? (
            <p className="text-xs text-muted-light">{model.categoryLabel}</p>
          ) : null}
          <h3 className="mt-1 line-clamp-2 font-heading text-base font-semibold leading-snug sm:text-lg">
            <Link href={detailHref} className="hover:underline">
              {model.titleTr}
            </Link>
          </h3>
          {isExternal ? (
            <button
              ref={ref}
              type="button"
              data-external-quote-cta=""
              className="mt-auto pt-3 text-left text-sm font-semibold text-coral underline-offset-4 hover:underline"
              onClick={() => onExternalQuote?.(model)}
            >
              Dosyanı yükle ve fiyat al
            </button>
          ) : (
            <Link
              href={detailHref}
              className="mt-auto pt-3 text-sm font-semibold underline-offset-4 hover:underline"
            >
              Modeli incele
            </Link>
          )}
        </div>
      </div>
    </article>
  );
});
