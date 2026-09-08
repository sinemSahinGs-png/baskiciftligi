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
          loading={priority ? undefined : "lazy"}
          fetchPriority={priority ? "high" : "low"}
          className={cn("object-cover", className)}
          onError={(event) => {
            if (src) setFailedSrc(src);
            onError?.(event);
          }}
          unoptimized={
            typeof src === "string" &&
            (src.startsWith("/images/") || src.startsWith("/catalog-media/"))
          }
          onLoad={(event) => {
            onLoad?.(event);
          }}
        />
      ) : null}
    </>
  );
}
