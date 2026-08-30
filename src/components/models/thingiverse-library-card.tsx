"use client";

import type { Route } from "next";
import Link from "next/link";

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

export function ThingiverseLibraryCard({
  model,
  className,
}: {
  model: ThingiverseLibraryCardData;
  className?: string;
}) {
  const detailHref = `/hazir-modeller/thingiverse/${model.id}` as Route;

  return (
    <article
      className={cn("group flex h-full min-w-0 flex-col", className)}
      data-thingiverse-card=""
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
        </div>
        <div className="mt-3 flex min-w-0 flex-1 flex-col">
          <h3 className="line-clamp-2 font-heading text-base font-semibold leading-snug">
            {model.title}
          </h3>
          <p className="mt-1 truncate text-xs text-muted-light">{model.creatorName}</p>
          <span
            data-production-request-card-cta=""
            className="mt-3 text-sm font-semibold text-coral"
          >
            Üretim talebi oluştur
          </span>
        </div>
      </Link>
    </article>
  );
}
