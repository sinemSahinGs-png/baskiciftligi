"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { Box } from "lucide-react";

import { cn } from "@/lib/utils";

interface SafeImageProps extends Omit<ImageProps, "src" | "alt"> {
  src?: string | null;
  alt: string;
  fallbackLabel?: string;
}

function isLocalMediaSrc(src: string) {
  return src.startsWith("/catalog-media/") || src.startsWith("/demo/");
}

export function SafeImage({
  src,
  alt,
  fallbackLabel = "Görsel yakında",
  className,
  ...props
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  if (!showImage) {
    return (
      <div
        className={cn(
          "absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_38%,rgba(33,212,253,0.14),transparent_46%),linear-gradient(160deg,#171c22,#0b0f13)]",
          className,
        )}
      >
        <div className="px-4 text-center text-muted-foreground">
          <Box aria-hidden="true" className="mx-auto size-8 opacity-70" />
          <span className="mt-3 block text-xs font-semibold">
            {fallbackLabel}
          </span>
        </div>
      </div>
    );
  }

  const mediaSrc = src as string;

  return (
    <Image
      src={mediaSrc}
      alt={alt}
      unoptimized={isLocalMediaSrc(mediaSrc)}
      onError={() => setFailed(true)}
      onLoad={(event) => {
        const image = event.currentTarget;
        if (image.naturalWidth < 8 || image.naturalHeight < 8) {
          setFailed(true);
        }
      }}
      className={className}
      {...props}
    />
  );
}
