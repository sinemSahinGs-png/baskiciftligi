"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback, useRef, useState } from "react";

import { ModelImagePlaceholder } from "@/components/media/model-image-placeholder";
import { cn } from "@/lib/utils";

interface SafeImageProps extends Omit<ImageProps, "src" | "alt"> {
  src?: string | null;
  alt: string;
  fallbackLabel?: string;
  imageKey?: string;
  quality?: number;
  onVerifiedLoad?: (src: string) => void;
  onPermanentFail?: (src: string) => void;
  showSkeleton?: boolean;
}

function shouldUnoptimize(src: string) {
  if (src.startsWith("/catalog-media/")) return true;
  return src.startsWith("/demo/") && /\.svg(?:\?|$)/i.test(src);
}

function SafeImageInner({
  src,
  alt,
  fallbackLabel = "3D model",
  className,
  quality = 70,
  onVerifiedLoad,
  onPermanentFail,
  showSkeleton = true,
  priority,
  onLoad,
  onError,
  ...props
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const reportedRef = useRef<{ load?: string; fail?: string }>({});

  const reportLoad = useCallback(
    (mediaSrc: string) => {
      if (reportedRef.current.load === mediaSrc) return;
      reportedRef.current.load = mediaSrc;
      onVerifiedLoad?.(mediaSrc);
    },
    [onVerifiedLoad],
  );

  const reportFail = useCallback(
    (mediaSrc: string) => {
      if (reportedRef.current.fail === mediaSrc) return;
      reportedRef.current.fail = mediaSrc;
      onPermanentFail?.(mediaSrc);
    },
    [onPermanentFail],
  );

  const showImage = Boolean(src) && !failed;

  return (
    <>
      {showSkeleton || !showImage || !loaded ? (
        <ModelImagePlaceholder
          label={!showImage || failed ? fallbackLabel : ""}
        />
      ) : null}
      {showImage ? (
        <Image
          {...props}
          src={src as string}
          alt={alt}
          unoptimized={shouldUnoptimize(src as string)}
          quality={quality}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "low"}
          onError={(event) => {
            setFailed(true);
            reportFail(src as string);
            onError?.(event);
          }}
          onLoad={(event) => {
            const image = event.currentTarget;
            if (image.naturalWidth < 8 || image.naturalHeight < 8) {
              setFailed(true);
              reportFail(src as string);
              return;
            }
            setLoaded(true);
            reportLoad(src as string);
            onLoad?.(event);
          }}
          className={cn(
            "transition-opacity duration-300 motion-reduce:transition-none",
            loaded ? "opacity-100" : "opacity-0",
            className,
          )}
        />
      ) : null}
    </>
  );
}

export function SafeImage(props: SafeImageProps) {
  const remountKey = `${props.src ?? ""}:${props.imageKey ?? ""}`;
  return <SafeImageInner key={remountKey} {...props} />;
}
