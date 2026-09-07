"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { imageIsReady } from "@/components/media/image-ready";
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
  preload,
  onLoad,
  onError,
  ...props
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
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

  const markReady = useCallback(
    (image: HTMLImageElement) => {
      if (!src || failed) return;
      if (!imageIsReady(image)) return;
      setLoaded(true);
      reportLoad(src);
    },
    [failed, reportLoad, src],
  );

  useEffect(() => {
    const image = imageRef.current;
    if (!image || !src || failed) return;

    const sync = () => markReady(image);
    sync();
    image.addEventListener("load", sync);
    const observer = new IntersectionObserver(() => sync(), { threshold: 0.01 });
    observer.observe(image);
    return () => {
      image.removeEventListener("load", sync);
      observer.disconnect();
    };
  }, [failed, markReady, src]);

  const showImage = Boolean(src) && !failed;
  const showPlaceholder = !showImage || failed || (showSkeleton && !loaded);

  return (
    <>
      {showPlaceholder ? (
        <ModelImagePlaceholder
          label={!showImage || failed ? fallbackLabel : ""}
        />
      ) : null}
      {showImage ? (
        <Image
          {...props}
          ref={imageRef}
          src={src as string}
          alt={alt}
          unoptimized={shouldUnoptimize(src as string)}
          quality={quality}
          priority={Boolean(priority || preload)}
          loading={priority || preload ? "eager" : "lazy"}
          fetchPriority={priority || preload ? "high" : "low"}
          onError={(event) => {
            setFailed(true);
            reportFail(src as string);
            onError?.(event);
          }}
          onLoad={(event) => {
            const image = event.currentTarget;
            if (!imageIsReady(image)) {
              return;
            }
            markReady(image);
            onLoad?.(event);
          }}
          className={cn("relative z-[1]", className)}
        />
      ) : null}
    </>
  );
}

export function SafeImage(props: SafeImageProps) {
  const remountKey = `${props.src ?? ""}:${props.imageKey ?? ""}`;
  return <SafeImageInner key={remountKey} {...props} />;
}
