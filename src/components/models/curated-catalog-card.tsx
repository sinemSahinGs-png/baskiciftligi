"use client";

import type { Route } from "next";
import Link from "next/link";
import { forwardRef } from "react";
import { ArrowRight } from "lucide-react";

import { ModelCardMedia } from "@/components/models/model-card-media";
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
  if (!model.slug || !model.titleTr?.trim()) return null;

  const isExternal = model.listingKind === "curated_external";
  const detailHref = (
    isExternal
      ? `/hazir-modeller/katalog/${model.slug}`
      : `/hazir-modeller/baski-ciftligi/${model.slug}`
  ) as Route;

  return (
    <article
      className={cn(
        "group flex h-full min-w-0 flex-col rounded-2xl border border-transparent transition duration-200 hover:border-coral/20 focus-within:border-coral/20 sm:hover:shadow-[0_0_0_1px_rgba(255,107,74,0.1),0_10px_28px_-18px_rgba(255,107,74,0.3)]",
        className,
      )}
      data-curated-card={model.listingKind}
    >
      <Link
        href={detailHref}
        className="flex h-full min-w-0 flex-col rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/60 focus-visible:ring-offset-2 focus-visible:ring-offset-carbon"
      >
        <ModelCardMedia
          src={model.previewImageUrl}
          alt={model.imageAlt || model.titleTr}
          badge="Baskı Çiftliği"
        />
        <div className="flex min-w-0 flex-1 flex-col p-2.5 sm:p-3">
          <h3 className="line-clamp-2 font-heading text-sm font-semibold leading-snug sm:text-base">
            {model.titleTr}
          </h3>
          {model.authorName ? (
            <p className="mt-1 truncate text-xs leading-4 text-muted-light">
              {model.authorName}
            </p>
          ) : null}
          <span
            data-model-card-cta=""
            className="mt-2.5 inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-coral/10 px-3 text-sm font-semibold text-coral transition duration-200 group-hover:bg-coral/18 sm:min-h-9 sm:w-fit"
          >
            Modeli İncele
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
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
