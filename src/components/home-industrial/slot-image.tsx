"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

import { industrialSlotSrc } from "@/components/home-industrial/industrial-slots";
import { TechnicalPlaceholder } from "@/components/home-industrial/technical-grid";
import { cn } from "@/lib/utils";

type SlotImageProps = Omit<ImageProps, "src" | "alt"> & {
  src?: string | null;
  alt: string;
};

function resolveSrc(src?: string | null) {
  if (!src) return undefined;
  if (src.startsWith("/images/home-industrial/") && src.endsWith(".avif")) {
    return industrialSlotSrc(src.slice("/images/home-industrial/".length));
  }
  return src;
}

export function SlotImage({
  src,
  alt,
  className,
  priority,
  onError,
  onLoad,
  ...props
}: SlotImageProps) {
  const resolved = resolveSrc(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !resolved || failedSrc === resolved;
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const loaded = Boolean(resolved) && loadedSrc === resolved && !failed;
  const showImage = Boolean(resolved) && !failed;

  return (
    <>
      {!loaded || failed ? <TechnicalPlaceholder /> : null}
      {showImage ? (
        <Image
          {...props}
          src={resolved as string}
          alt={alt}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "low"}
          className={cn(
            "hi-mono-img object-cover",
            loaded ? "opacity-100" : "opacity-0",
            className,
          )}
          onError={(event) => {
            if (resolved) setFailedSrc(resolved);
            onError?.(event);
          }}
          onLoad={(event) => {
            const image = event.currentTarget;
            if (image.naturalWidth < 8) {
              if (resolved) setFailedSrc(resolved);
              return;
            }
            if (resolved) setLoadedSrc(resolved);
            onLoad?.(event);
          }}
        />
      ) : null}
    </>
  );
}
