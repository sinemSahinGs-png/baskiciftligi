"use client";

import type { Route } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";

import { FoundryGrid } from "@/components/brand/foundry-grid";
import { LicenseBadge } from "@/components/models/license-badge";
import { ModelSourceBadge } from "@/components/models/model-source-badge";
import type { ModelSource } from "@/components/models/model-source-badge";
import { PermissionStatus } from "@/components/models/permission-status";
import type { PermissionState } from "@/components/models/permission-status";
import { SafeImage } from "@/components/media/safe-image";
import { cn } from "@/lib/utils";

export interface ModelCardData {
  id: string;
  href: Route;
  name: string;
  creator: string;
  category: string;
  source: ModelSource;
  license: string;
  permission: PermissionState;
  startingPriceLabel?: string;
  thumbnailUrl?: string;
  sourceUrl?: string;
  popularityLabel?: string;
  verified?: boolean;
  fileCount?: number;
  attributionRequired?: boolean;
  automaticManufacturingAllowed?: boolean;
}

const sourceStage: Record<ModelSource, string> = {
  owned: "from-[#2a3cff] to-[#1a1460]",
  licensed: "from-[#ff6542] to-[#7a1f12]",
  thingiverse: "from-[#e8e6e1] to-[#9aa0a6]",
};

export function ModelCard({
  model,
  onFavorite,
  isFavorite = false,
}: {
  model: ModelCardData;
  onFavorite?: () => void;
  isFavorite?: boolean;
}) {
  const primaryLabel = "Modeli incele";
  const productionLabel = model.verified
    ? "Üretim seçeneklerini belirle"
    : "Üretim izni gerekli";

  return (
    <article className="group flex h-full min-w-0 flex-col">
      <div
        className={cn(
          "relative aspect-square min-h-0 overflow-hidden rounded-lg bg-linear-to-br",
          sourceStage[model.source],
        )}
      >
        <FoundryGrid variant="blueprint" className="opacity-60" />
        {model.thumbnailUrl ? (
          <SafeImage
            src={model.thumbnailUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-contain p-6"
            fallbackLabel="Önizleme yok"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center px-4 text-center">
            <div>
              <p className="text-xs font-semibold opacity-70">{model.source}</p>
              <p className="mt-2 line-clamp-2 text-sm font-semibold">{model.name}</p>
              <p className="mt-1 text-xs opacity-65">3D önizleme bağlı değil</p>
            </div>
          </div>
        )}
        <div className="absolute top-3 left-3 z-10">
          <ModelSourceBadge source={model.source} />
        </div>
        {onFavorite ? (
          <button
            type="button"
            aria-pressed={isFavorite}
            aria-label={
              isFavorite ? "Modeli favorilerden çıkar" : "Modeli kaydet"
            }
            onClick={onFavorite}
            className="absolute top-3 right-3 z-10 grid size-11 place-items-center rounded-full bg-midnight/55 text-light-text transition-transform duration-200 aria-pressed:scale-110 aria-pressed:text-coral"
          >
            <Heart
              aria-hidden="true"
              className="size-4"
              fill={isFavorite ? "currentColor" : "none"}
            />
          </button>
        ) : null}
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <p className="text-xs opacity-65">{model.category}</p>
        <h3 className="mt-1 font-heading text-xl leading-snug font-bold">
          <Link href={model.href} className="hover:underline">
            {model.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm opacity-70">{model.creator}</p>
        {model.popularityLabel ? (
          <p className="mt-1 text-xs opacity-60">{model.popularityLabel}</p>
        ) : null}
        {typeof model.fileCount === "number" ? (
          <p className="mt-1 text-xs opacity-60">{model.fileCount} yazdırılabilir dosya</p>
        ) : null}
        {model.attributionRequired ? (
          <p className="mt-1 text-xs opacity-60">Atıf zorunlu</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <LicenseBadge label={model.license} />
        </div>
        <div className="mt-3">
          <PermissionStatus state={model.permission} compact />
        </div>
        {model.startingPriceLabel ? (
          <p className="type-price mt-3 text-sm">{model.startingPriceLabel}</p>
        ) : (
          <p className="mt-3 text-sm opacity-65">Başlangıç fiyatı yok</p>
        )}
        <div className="mt-4 grid gap-2">
          <Link
            href={model.href}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-current/20 text-sm font-semibold"
          >
            {primaryLabel}
          </Link>
          {model.source === "thingiverse" && model.sourceUrl ? (
            <a
              href={model.sourceUrl}
              rel="noreferrer"
              target="_blank"
              className="inline-flex min-h-11 items-center justify-center text-sm font-semibold underline"
            >
              Thingiverse’da aç
            </a>
          ) : null}
          {model.verified ? (
            <Link
              href={model.href}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-cobalt text-sm font-semibold text-light-text"
            >
              {productionLabel}
            </Link>
          ) : (
            <p className="text-xs opacity-65">{productionLabel}</p>
          )}
        </div>
      </div>
    </article>
  );
}
