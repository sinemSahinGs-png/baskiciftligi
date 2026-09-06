"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

import { TechnicalPlaceholder } from "@/components/home-industrial/technical-grid";
import { cn } from "@/lib/utils";

type SlotImageProps = Omit<ImageProps, "src" | "alt"> & {
  src?: string | null;
  alt: string;
};

export function SlotImage({
  src,
  alt,
  className,
  priority,
  onError,
  onLoad,
  ...props
}: SlotImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !src || failedSrc === src;
  const showImage = Boolean(src) && !failed;

  return (
    <>
      {failed ? <TechnicalPlaceholder /> : null}
      {showImage ? (
        <Image
          {...props}
          src={src as string}
          alt={alt}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "low"}
          className={cn("object-cover", className)}
          onError={(event) => {
            if (src) setFailedSrc(src);
            onError?.(event);
          }}
          onLoad={(event) => {
            const image = event.currentTarget;
            if (image.naturalWidth < 8 && src) {
              setFailedSrc(src);
              return;
            }
            onLoad?.(event);
          }}
        />
      ) : null}
    </>
  );
}
