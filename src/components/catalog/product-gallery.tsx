"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { Expand, ImageIcon, Play, X, ZoomIn, ZoomOut } from "lucide-react";

import { ProductStage } from "@/components/catalog/product-stage";
import type { ProductMedia } from "@/domain/catalog/types";
import type { StagePreset } from "@/domain/visual/stages";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  media: ProductMedia[];
  productName: string;
  stage?: StagePreset;
}

export function ProductGallery({
  media,
  productName,
  stage = "cobalt",
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedMediaIds, setFailedMediaIds] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });

  const activeMedia = media[activeIndex] ?? media[0];
  const hasFailed = activeMedia
    ? failedMediaIds.includes(activeMedia.id)
    : false;

  const markFailed = (id: string) => {
    setFailedMediaIds((current) =>
      current.includes(id) ? current : [...current, id],
    );
  };

  const select = useCallback(
    (index: number) => {
      setActiveIndex(index);
      emblaApi?.scrollTo(index);
    },
    [emblaApi],
  );

  useEffect(() => {
    if (!emblaApi) {
      return;
    }
    const onSelect = () => setActiveIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setZoomed(false);
  }, []);

  useEffect(() => {
    if (!lightboxOpen) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLightbox();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeLightbox, lightboxOpen]);

  const stageMedia = (item: ProductMedia | undefined, large = false) => (
    <ProductStage
      stage={stage}
      src={!item || hasFailed || item.type === "video" ? undefined : item.url}
      alt={item?.alt || productName}
      isolated={item?.isolated ?? false}
      objectPosition={item?.objectPosition}
      mobileObjectPosition={item?.mobileObjectPosition}
      sizes={large ? "100vw" : "(min-width: 1024px) 52vw, 100vw"}
      preload={activeIndex === 0}
      ratio={large ? "none" : "standard"}
      className={large ? "min-h-[70svh] rounded-none" : "rounded-xl"}
    >
      {!item || (item.id === activeMedia?.id && hasFailed) ? (
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3 text-white/70">
          <ImageIcon aria-hidden="true" className="size-10" />
          <p className="text-sm">Ürün görseli hazırlanıyor</p>
        </div>
      ) : item.type === "video" ? (
        <video
          key={item.id}
          src={item.url}
          controls
          playsInline
          preload="metadata"
          aria-label={`${productName} ürün videosu`}
          className="absolute inset-5 z-10 h-[calc(100%-2.5rem)] w-[calc(100%-2.5rem)] rounded-xl object-cover sm:inset-7"
        />
      ) : null}
    </ProductStage>
  );

  return (
    <div className="space-y-3 lg:sticky lg:top-24">
      <div className="relative lg:hidden" ref={emblaRef}>
        <div className="flex">
          {(media.length > 0 ? media : [undefined]).map((item) => (
            <div key={item?.id ?? "empty"} className="min-w-0 shrink-0 grow-0 basis-full">
              {stageMedia(item)}
            </div>
          ))}
        </div>
      </div>

      <div className="relative hidden lg:block">
        {stageMedia(activeMedia)}
        {activeMedia && activeMedia.type !== "video" ? (
          <div className="absolute right-4 bottom-4 z-20 flex gap-2">
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-midnight/70 px-3 text-sm font-semibold text-light-text"
            >
              <Expand aria-hidden="true" className="size-4" />
              Tam ekran
            </button>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-hairline text-sm font-semibold lg:hidden"
        onClick={() => setLightboxOpen(true)}
      >
        <Expand aria-hidden="true" className="size-4" />
        Galeriyi aç
      </button>

      {media.length > 1 ? (
        <div
          role="list"
          aria-label="Ürün medyaları"
          className="grid grid-cols-5 gap-2"
        >
          {media.map((item, index) => {
            const isActive = index === activeIndex;
            const thumbnailFailed = failedMediaIds.includes(item.id);

            return (
              <div key={item.id} role="listitem" className="aspect-square">
                <button
                  type="button"
                  aria-label={`${index + 1}. medyayı göster: ${item.alt || productName}`}
                  aria-pressed={isActive}
                  onClick={() => select(index)}
                  className={cn(
                    "relative size-full overflow-hidden rounded-md border bg-muted",
                    isActive ? "border-cobalt" : "border-hairline",
                  )}
                >
                  {item.type === "video" || thumbnailFailed ? (
                    <span className="flex h-full items-center justify-center text-ink-muted">
                      <Play aria-hidden="true" className="size-5" />
                    </span>
                  ) : (
                    <Image
                      src={item.url}
                      alt=""
                      fill
                      sizes="8rem"
                      className="object-cover"
                      onError={() => markFailed(item.id)}
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ) : null}

      {lightboxOpen ? (
        <div className="fixed inset-0 z-50 bg-midnight text-light-text">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="truncate text-sm font-semibold">{productName}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setZoomed((value) => !value)}
                className="inline-flex min-h-11 items-center gap-2 px-3 text-sm"
              >
                {zoomed ? (
                  <ZoomOut aria-hidden="true" className="size-4" />
                ) : (
                  <ZoomIn aria-hidden="true" className="size-4" />
                )}
                {zoomed ? "Uzaklaş" : "Yakınlaş"}
              </button>
              <button
                type="button"
                aria-label="Galeriyi kapat"
                onClick={closeLightbox}
                className="grid size-11 place-items-center"
              >
                <X />
              </button>
            </div>
          </div>
          <div
            className={cn(
              "h-[calc(100svh-4.5rem)] overflow-auto",
              zoomed && "cursor-zoom-out",
            )}
            onClick={() => zoomed && setZoomed(false)}
          >
            <div
              className={cn(
                "mx-auto transition-transform",
                zoomed ? "max-w-none scale-150 origin-top" : "max-w-5xl",
              )}
            >
              {stageMedia(activeMedia, true)}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
