"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

import { FormSignal } from "@/components/brand/form-signal";
import { FoundryGrid } from "@/components/brand/foundry-grid";
import { SafeImage } from "@/components/media/safe-image";
import {
  stageClass,
  stageRecipes,
  type StagePreset,
} from "@/domain/visual/stages";
import { cn } from "@/lib/utils";

interface ProductStageProps {
  stage: StagePreset;
  src?: string;
  alt: string;
  sizes?: string;
  preload?: boolean;
  framed?: boolean;
  isolated?: boolean;
  objectPosition?: string;
  mobileObjectPosition?: string;
  hoverSrc?: string;
  mobileSrc?: string;
  videoSrc?: string;
  grid?: boolean;
  children?: ReactNode;
  className?: string;
  imageClassName?: string;
  ratio?: "standard" | "featured" | "featuredCompact" | "square" | "none";
}

export function ProductStage({
  stage,
  src,
  alt,
  sizes = "(max-width: 640px) 50vw, 25vw",
  preload,
  framed,
  isolated = false,
  objectPosition = "50% 50%",
  mobileObjectPosition,
  hoverSrc,
  mobileSrc,
  videoSrc,
  grid,
  children,
  className,
  imageClassName,
  ratio = "none",
}: ProductStageProps) {
  const reduceMotion = useReducedMotion();
  const recipe = stageRecipes[stage];
  const showGrid = grid ?? recipe.grid;
  const honestFrame = framed ?? !isolated;
  const fitClass = isolated ? "object-contain" : "object-cover";

  return (
    <div
      className={cn(
        "product-stage relative w-full min-h-0 overflow-hidden",
        ratio === "standard" && "aspect-[4/5]",
        ratio === "featured" && "aspect-[4/3] md:aspect-[5/4]",
        ratio === "featuredCompact" && "aspect-[4/3]",
        ratio === "square" && "aspect-square",
        stageClass[stage],
        className,
      )}
      style={
        {
          "--object-position": objectPosition,
          "--mobile-object-position": mobileObjectPosition ?? objectPosition,
        } as CSSProperties
      }
    >
      {recipe.lighting === "split" ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(110deg,var(--stage)_0_48%,var(--stage-2)_52%)]"
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              recipe.lighting === "none"
                ? `linear-gradient(165deg, color-mix(in srgb, var(--stage) 88%, black), var(--stage-2))`
                : recipe.lighting === "soft"
                  ? `radial-gradient(90% 70% at 50% 18%, color-mix(in srgb, var(--stage) 55%, white), var(--stage-2) 78%)`
                  : `radial-gradient(120% 90% at 20% 0%, color-mix(in srgb, var(--stage) 88%, white), var(--stage-2) 72%)`,
          }}
        />
      )}

      {showGrid ? (
        <FoundryGrid
          variant={stage === "technical" ? "measure" : "corner"}
          className="opacity-55 max-md:hidden"
        />
      ) : null}
      {recipe.contour ? (
        <div
          aria-hidden="true"
          className="grid-contour absolute inset-0 opacity-50 max-md:hidden"
        />
      ) : null}
      {recipe.lighting !== "none" && recipe.lighting !== "split" ? (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-10 left-1/2 size-40 -translate-x-1/2 rounded-full bg-white/25 opacity-70 blur-3xl transition-opacity duration-300 group-hover/card:opacity-100 max-md:hidden"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-6 left-1/2 size-20 -translate-x-1/2 rounded-full bg-white/18 md:hidden"
          />
        </>
      ) : null}

      <div
        className={cn(
          "absolute inset-0",
          isolated ? "inset-[8%] sm:inset-[11%]" : honestFrame && "inset-4 sm:inset-6",
        )}
      >
        {mobileSrc ? (
          <SafeImage
            src={mobileSrc}
            alt={alt}
            fill
            sizes={sizes}
            preload={preload}
            className={cn(
              "product-stage-media md:hidden",
              fitClass,
              isolated ? "rounded-none" : "rounded-lg",
              imageClassName,
            )}
          />
        ) : null}
        <SafeImage
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          preload={preload}
          className={cn(
            "product-stage-media",
            mobileSrc && "max-md:hidden",
            fitClass,
            isolated ? "rounded-none" : "rounded-lg",
            imageClassName,
          )}
        />
        {hoverSrc && hoverSrc !== src && !reduceMotion ? (
          <SafeImage
            src={hoverSrc}
            alt=""
            fill
            sizes={sizes}
            className={cn(
              "product-stage-media opacity-0 transition-opacity duration-500 group-hover/card:opacity-100 group-focus-within/card:opacity-100 max-md:hidden",
              fitClass,
              isolated ? "rounded-none" : "rounded-lg",
            )}
          />
        ) : null}
        {videoSrc && !reduceMotion ? (
          <StageVideo
            src={videoSrc}
            className={cn(
              "absolute inset-0 size-full max-md:hidden",
              fitClass,
              isolated ? "rounded-none" : "rounded-lg",
            )}
          />
        ) : null}
      </div>

      {isolated && recipe.pedestal ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[18%] bottom-[7%] h-3 rounded-[100%] bg-black/25"
        />
      ) : null}
      {isolated && recipe.shadow ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[22%] bottom-[9%] h-5 rounded-[100%] bg-black/30 blur-md"
        />
      ) : null}
      {!isolated && recipe.shadow ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[16%] bottom-[6%] h-4 rounded-[100%] bg-black/20 blur-md"
        />
      ) : null}
      {recipe.measure ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-4 left-4 hidden text-[0.7rem] tracking-wide text-white/55 sm:block"
        >
          00
        </span>
      ) : null}
      {recipe.signal ? (
        <FormSignal className="pointer-events-none absolute right-3 bottom-3 size-4 text-white/70" />
      ) : null}
      {children}
    </div>
  );
}

function StageVideo({ src, className }: { src: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const updatePlayback = (visible: boolean) => {
      if (visible && document.visibilityState === "visible") {
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    };

    let visible = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        updatePlayback(visible);
      },
      { threshold: 0.15, rootMargin: "40px 0px" },
    );
    observer.observe(video);

    const onVisibility = () => updatePlayback(visible);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      video.pause();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      className={className}
    />
  );
}
