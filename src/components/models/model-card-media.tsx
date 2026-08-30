"use client";

import { SafeImage } from "@/components/media/safe-image";
import {
  cardImageFromCandidate,
  collectThingiverseGalleryCandidates,
  hasUsableThingiverseThumbnail,
} from "@/domain/external-models/thingiverse-images";
import { cn } from "@/lib/utils";

export function ModelCardMedia({
  src,
  alt,
  badge,
  className,
  priority = false,
}: {
  src?: string | null;
  alt: string;
  badge?: string;
  className?: string;
  priority?: boolean;
}) {
  const displaySrc =
    cardImageFromCandidate(
      collectThingiverseGalleryCandidates({ thumbnailUrl: src })[0] ?? null,
    ) ?? (hasUsableThingiverseThumbnail(src) ? src : null);

  return (
    <div
      className={cn(
        "relative aspect-[4/5] overflow-hidden rounded-2xl bg-midnight/80 sm:rounded-[1.125rem]",
        className,
      )}
    >
      <SafeImage
        src={displaySrc}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
        quality={70}
        className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
        fallbackLabel=""
        showSkeleton
      />
      {badge ? (
        <span className="absolute top-2 left-2 rounded-full bg-black/55 px-2.5 py-0.5 text-xs font-medium text-white/90 backdrop-blur-sm">
          {badge}
        </span>
      ) : null}
    </div>
  );
}
