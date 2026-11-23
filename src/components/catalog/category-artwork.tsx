"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { TechnicalPlaceholder } from "@/components/home-industrial/technical-grid";
import { imageIsReady } from "@/components/media/image-ready";
import { cn } from "@/lib/utils";

export function CategoryArtwork({
  src,
  sizes,
  objectPosition = "50% 50%",
  className,
}: {
  src?: string | null;
  sizes: string;
  objectPosition?: string;
  className?: string;
}) {
  const imageSrc = src?.split("?")[0] || src;
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [srcKey, setSrcKey] = useState(imageSrc);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(!imageSrc);

  if (imageSrc !== srcKey) {
    setSrcKey(imageSrc);
    setReady(false);
    setFailed(!imageSrc);
  }

  const markReady = useCallback((image: HTMLImageElement) => {
    if (!imageIsReady(image)) return;
    setReady(true);
  }, []);

  useEffect(() => {
    const image = imageRef.current;
    if (!image || !imageSrc || failed) return;
    markReady(image);
  }, [failed, markReady, imageSrc]);

  const showImage = Boolean(imageSrc) && !failed;

  return (
    <>
      {!ready ? (
        <TechnicalPlaceholder className="category-artwork-fallback" />
      ) : null}
      {showImage ? (
        <Image
          ref={imageRef}
          src={imageSrc as string}
          alt=""
          fill
          sizes={sizes}
          quality={70}
          loading="eager"
          fetchPriority="auto"
          decoding="async"
          data-category-artwork={imageSrc as string}
          data-ready={ready ? "true" : "false"}
          style={{ objectPosition }}
          className={cn(
            "object-cover",
            ready ? "opacity-100" : "opacity-0",
            className,
          )}
          onLoad={(event) => markReady(event.currentTarget)}
          onError={() => {
            setFailed(true);
            setReady(false);
          }}
        />
      ) : null}
    </>
  );
}
