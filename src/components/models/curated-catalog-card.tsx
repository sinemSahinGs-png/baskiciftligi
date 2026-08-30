"use client";

import type { Route } from "next";
import Link from "next/link";
import { forwardRef } from "react";
import { ArrowRight } from "lucide-react";

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
      className={cn(
        "group flex h-full min-w-0 flex-col rounded-xl border border-transparent transition duration-200 hover:border-coral/25 hover:shadow-[0_0_0_1px_rgba(255,107,74,0.12),0_12px_32px_-20px_rgba(255,107,74,0.35)] focus-within:border-coral/25",
        className,
      )}
      data-curated-card={model.listingKind}
    >
      <Link
        href={detailHref}
        className="flex h-full min-w-0 flex-col rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/60 focus-visible:ring-offset-2 focus-visible:ring-offset-carbon"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-midnight/80">
          {model.previewImageUrl ? (
            <SafeImage
              src={model.previewImageUrl}
              alt={model.imageAlt || model.titleTr}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
              fallbackLabel="Önizleme yok"
            />
          ) : (
            <div className="grid h-full place-items-center px-3 text-center text-xs text-muted-light">
              Görsel yok
            </div>
          )}
          <span className="absolute top-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
            Baskı Çiftliği
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col p-3">
          <h3 className="line-clamp-2 font-heading text-base font-semibold leading-snug">
            {model.titleTr}
          </h3>
          {model.authorName ? (
            <p className="mt-1 truncate text-xs text-muted-light">{model.authorName}</p>
          ) : null}
          <span
            data-model-card-cta=""
            className="mt-3 inline-flex min-h-9 w-fit items-center gap-1.5 rounded-lg bg-coral/10 px-3 text-sm font-semibold text-coral transition duration-200 group-hover:bg-coral/20"
          >
            Modeli İncele
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-200 group-hover:translate-x-1"
            />
          </span>
        </div>
      </Link>
      {isExternal && onExternalQuote ? (
        <button ref={ref} type="button" className="sr-only" onClick={() => onExternalQuote(model)}>
          Harici teklif
        </button>
      ) : null}
    </article>
  );
});
