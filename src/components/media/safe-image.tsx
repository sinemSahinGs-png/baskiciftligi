"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback, useRef, useState } from "react";
import { Box } from "lucide-react";

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

function isLocalMediaSrc(src: string) {
  return src.startsWith("/catalog-media/") || src.startsWith("/demo/");
}

function SafeImageInner({
  src,
  alt,
  fallbackLabel = "Görsel yakında",
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
          {fallbackLabel ? (
            <span className="mt-3 block text-xs font-semibold">{fallbackLabel}</span>
          ) : null}
        </div>
      </div>
    );
  }

  const mediaSrc = src as string;

  return (
    <>
      {showSkeleton && !loaded ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-white/[0.04] motion-reduce:animate-none"
        />
      ) : null}
      <Image
        src={mediaSrc}
        alt={alt}
        unoptimized={isLocalMediaSrc(mediaSrc)}
        quality={quality}
        priority={priority}
        onError={(event) => {
          setFailed(true);
          reportFail(mediaSrc);
          onError?.(event);
        }}
        onLoad={(event) => {
          const image = event.currentTarget;
          if (image.naturalWidth < 8 || image.naturalHeight < 8) {
            setFailed(true);
            reportFail(mediaSrc);
            return;
          }
          setLoaded(true);
          reportLoad(mediaSrc);
          onLoad?.(event);
        }}
        className={cn(
          "transition-opacity duration-300 motion-reduce:transition-none",
          loaded ? "opacity-100" : "opacity-0",
          className,
        )}
        {...props}
      />
    </>
  );
}

export function SafeImage(props: SafeImageProps) {
  const remountKey = `${props.src ?? ""}:${props.imageKey ?? ""}`;
  return <SafeImageInner key={remountKey} {...props} />;
}
