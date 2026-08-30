"use client";

import type { Route } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ModelCardMedia } from "@/components/models/model-card-media";
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
  if (!model.id || !model.title?.trim()) return null;

  const detailHref = `/hazir-modeller/thingiverse/${model.id}` as Route;

  return (
    <article
      className={cn(
        "group flex h-full min-w-0 flex-col rounded-2xl border border-transparent transition duration-200 hover:border-coral/20 focus-within:border-coral/20 sm:hover:shadow-[0_0_0_1px_rgba(255,107,74,0.1),0_10px_28px_-18px_rgba(255,107,74,0.3)]",
        className,
      )}
      data-thingiverse-card=""
    >
      <Link
        href={detailHref}
        className="flex h-full min-w-0 flex-col rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/60 focus-visible:ring-offset-2 focus-visible:ring-offset-carbon"
      >
        <ModelCardMedia src={model.thumbnailUrl} alt={model.title} badge="Topluluk" />
        <div className="flex min-w-0 flex-1 flex-col p-2.5 sm:p-3">
          <h3 className="line-clamp-2 font-heading text-sm font-semibold leading-snug sm:text-base">
            {model.title}
          </h3>
          <p className="mt-1 truncate text-xs leading-4 text-muted-light">
            {model.creatorName}
          </p>
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
    </article>
  );
}
