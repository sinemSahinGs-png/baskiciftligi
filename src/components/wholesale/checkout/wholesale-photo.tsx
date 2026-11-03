"use client";

import { useState } from "react";

import type { WholesalePhoto } from "@/lib/wholesale/photos";

export function WholesalePhotoFrame({
  photo,
  src,
  className,
  sizes,
  onOpen,
}: {
  photo: WholesalePhoto;
  src: string | null;
  className?: string;
  sizes: string;
  onOpen?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  const ratio = photo.hero ? "4 / 3" : "1 / 1";

  return (
    <button
      type="button"
      className={`ws-photo ${className ?? ""}`}
      style={{ aspectRatio: ratio }}
      onClick={() => showImage && onOpen?.()}
      aria-label={showImage ? `${photo.alt} — büyüt` : photo.alt}
      disabled={!showImage}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src ?? undefined}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          sizes={sizes}
          decoding="async"
          fetchPriority={photo.hero ? "high" : "low"}
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="ws-photo-fallback">
          <span className="ws-photo-mark" aria-hidden="true" />
          <span>Baskı Çiftliği</span>
        </span>
      )}
    </button>
  );
}
