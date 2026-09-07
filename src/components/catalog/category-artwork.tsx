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
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [srcKey, setSrcKey] = useState(src);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(!src);

  if (src !== srcKey) {
    setSrcKey(src);
    setReady(false);
    setFailed(!src);
  }

  const markReady = useCallback((image: HTMLImageElement) => {
    if (!imageIsReady(image)) return;
    setReady(true);
  }, []);

  useEffect(() => {
    const image = imageRef.current;
    if (!image || !src || failed) return;
    markReady(image);
  }, [failed, markReady, src]);

  const showImage = Boolean(src) && !failed;

  return (
    <>
      {!ready ? (
        <TechnicalPlaceholder className="category-artwork-fallback" />
      ) : null}
      {showImage ? (
        <Image
          ref={imageRef}
          src={src as string}
          alt=""
          fill
          sizes={sizes}
          quality={70}
          loading="lazy"
          fetchPriority="low"
          decoding="async"
          data-category-artwork={src as string}
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
