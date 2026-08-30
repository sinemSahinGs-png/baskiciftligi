"use client";

import { SafeImage } from "@/components/media/safe-image";
import { cn } from "@/lib/utils";

export function ModelCardMedia({
  src,
  alt,
  badge,
  className,
}: {
  src?: string | null;
  alt: string;
  badge?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[4/5] overflow-hidden rounded-2xl bg-midnight/80 sm:rounded-[1.125rem]",
        className,
      )}
    >
      <SafeImage
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
        fallbackLabel="Görsel yakında"
      />
      {badge ? (
        <span className="absolute top-2 left-2 rounded-full bg-black/55 px-2.5 py-0.5 text-xs font-medium text-white/90 backdrop-blur-sm">
          {badge}
        </span>
      ) : null}
    </div>
  );
}
