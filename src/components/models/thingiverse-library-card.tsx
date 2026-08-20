"use client";

import type { Route } from "next";
import Link from "next/link";
import { forwardRef } from "react";

import { SafeImage } from "@/components/media/safe-image";
import { cn } from "@/lib/utils";

export interface ThingiverseLibraryCardData {
  id: string;
  title: string;
  creatorName: string;
  thumbnailUrl?: string | null;
  sourceUrl: string;
  categoryLabel: string;
  licenseLabel?: string | null;
  licenseCode?: string | null;
  attributionText?: string | null;
  pricingAllowed?: boolean;
}

export const ThingiverseLibraryCard = forwardRef<
  HTMLButtonElement,
  {
    model: ThingiverseLibraryCardData;
    className?: string;
    onQuote?: (model: ThingiverseLibraryCardData) => void;
  }
>(function ThingiverseLibraryCard({ model, className, onQuote }, ref) {
  const canPrice = Boolean(model.pricingAllowed);
  const sourceHref = `/api/hazir-modeller/source-open?kind=thingiverse&id=${encodeURIComponent(model.id)}`;

  return (
    <article
      className={cn("flex h-full min-w-0 flex-col", className)}
      data-thingiverse-card=""
      data-pricing-allowed={canPrice ? "true" : "false"}
    >
      <div className="flex h-full flex-col">
        <Link
          href={`/hazir-modeller/thingiverse/${model.id}` as Route}
          className="relative aspect-[4/5] overflow-hidden rounded-lg bg-midnight/80"
        >
          {model.thumbnailUrl ? (
            <SafeImage
              src={model.thumbnailUrl}
              alt={model.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover"
              fallbackLabel="Önizleme yok"
            />
          ) : (
            <div className="grid h-full place-items-center text-xs text-muted-light">
              Görsel yok
            </div>
          )}
          <span className="absolute top-2 left-2 rounded bg-black/55 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white/90">
            Harici model
          </span>
        </Link>
        <div className="mt-3 flex flex-1 flex-col">
          <p className="text-xs text-muted-light">{model.categoryLabel}</p>
          <h3 className="mt-1 line-clamp-2 font-heading text-base font-semibold leading-snug">
            {model.title}
          </h3>
          <p className="mt-1 text-xs text-muted-light">{model.creatorName}</p>
          {model.licenseLabel ? (
            <p className="mt-1 text-[11px] text-muted-light">{model.licenseLabel}</p>
          ) : null}
          {canPrice ? (
            <button
              ref={ref}
              type="button"
              data-external-quote-cta=""
              className="mt-auto pt-3 text-left text-sm font-semibold text-coral underline-offset-4 hover:underline"
              onClick={() => onQuote?.(model)}
            >
              Dosyanı yükle ve fiyat al
            </button>
          ) : (
            <a
              href={sourceHref}
              data-external-source-only-cta=""
              className="mt-auto pt-3 text-sm font-semibold underline-offset-4 hover:underline"
            >
              Kaynak sayfasını görüntüle
            </a>
          )}
        </div>
      </div>
    </article>
  );
});
