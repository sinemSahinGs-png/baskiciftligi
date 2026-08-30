"use client";

import type { Route } from "next";
import Link from "next/link";
import { forwardRef } from "react";

import { SafeImage } from "@/components/media/safe-image";
import { resolveLicenseCommercePolicyFromLabel } from "@/domain/external-models/license-commerce";
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

function licenseBadgeLabel(licenseLabel?: string | null) {
  const policy = resolveLicenseCommercePolicyFromLabel(licenseLabel);
  if (policy.tier === "auto_checkout") return "Üretime uygun";
  if (policy.tier === "estimate_consult") return "İnceleme gerekir";
  return "Danışma gerekir";
}

export const ThingiverseLibraryCard = forwardRef<
  HTMLButtonElement,
  {
    model: ThingiverseLibraryCardData;
    className?: string;
    onQuote?: (model: ThingiverseLibraryCardData) => void;
  }
>(function ThingiverseLibraryCard({ model, className, onQuote }, ref) {
  const policy = resolveLicenseCommercePolicyFromLabel(model.licenseLabel);
  const detailHref = `/hazir-modeller/thingiverse/${model.id}` as Route;

  return (
    <article
      className={cn("group flex h-full min-w-0 flex-col", className)}
      data-thingiverse-card=""
      data-pricing-allowed={policy.allowPayment ? "true" : "false"}
    >
      <Link
        href={detailHref}
        className="flex h-full min-w-0 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/60"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-midnight/80">
          {model.thumbnailUrl ? (
            <SafeImage
              src={model.thumbnailUrl}
              alt={model.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              fallbackLabel="Önizleme yok"
            />
          ) : (
            <div className="grid h-full place-items-center text-xs text-muted-light">
              Görsel yok
            </div>
          )}
          <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/90">
            {licenseBadgeLabel(model.licenseLabel)}
          </span>
        </div>
        <div className="mt-3 flex min-w-0 flex-1 flex-col">
          <h3 className="line-clamp-2 font-heading text-base font-semibold leading-snug">
            {model.title}
          </h3>
          <p className="mt-1 truncate text-xs text-muted-light">{model.creatorName}</p>
        </div>
      </Link>
      {policy.allowPayment ? (
        <button
          ref={ref}
          type="button"
          data-external-quote-cta=""
          className="mt-3 text-left text-sm font-semibold text-coral underline-offset-4 hover:underline"
          onClick={(event) => {
            event.preventDefault();
            onQuote?.(model);
          }}
        >
          Fiyatlandır
        </button>
      ) : (
        <Link
          href={detailHref}
          data-consultation-card-cta=""
          className="mt-3 text-sm font-semibold text-muted-light underline-offset-4 hover:text-light-text hover:underline"
        >
          Detayı gör
        </Link>
      )}
    </article>
  );
});
