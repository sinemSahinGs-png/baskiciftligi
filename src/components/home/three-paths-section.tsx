"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowRight, Box, Search, Upload } from "lucide-react";

import { homepageJourneys } from "@/domain/home/homepage";
import { trackHomeEvent } from "@/lib/home/analytics";
import { cn } from "@/lib/utils";

const icons = [Search, Box, Upload] as const;
const accents = ["text-cyan", "text-violet", "text-orange"] as const;

export function ThreePathsSection() {
  const [selected, setSelected] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false,
    breakpoints: {
      "(min-width: 1024px)": { active: false },
    },
  });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section
      id="uc-uretim-yolu"
      data-journey-section
      className="home-section"
    >
      <div className="home-shell">
        <h2 className="home-title home-mask-reveal">Üç üretim yolu</h2>
        <p className="home-lede">Yaz, seç veya yükle. Hepsi aynı stüdyoda üretime bağlanır.</p>

        <div
          className="mt-5 overflow-hidden lg:overflow-visible"
          data-pinned="false"
          ref={emblaRef}
        >
          <div className="flex gap-3 lg:grid lg:grid-cols-3 lg:gap-3">
            {homepageJourneys.map((path, index) => (
              <div
                key={path.id}
                className="min-w-0 shrink-0 basis-[calc(100%-1.15rem)] lg:basis-auto"
              >
                <PathCard path={path} index={index} active={selected === index} />
              </div>
            ))}
          </div>
        </div>

        <div
          className="mt-4 flex items-center justify-center gap-2 lg:hidden"
          role="tablist"
          aria-label="Üretim yolu"
        >
          {homepageJourneys.map((path, index) => (
            <button
              key={path.id}
              type="button"
              role="tab"
              aria-selected={selected === index}
              aria-label={`${index + 1}. ${path.title}`}
              onClick={() => emblaApi?.scrollTo(index)}
              className="grid size-11 place-items-center"
            >
              <span
                className={cn(
                  "rounded-full transition-all duration-200",
                  selected === index ? "h-2 w-8 bg-cyan" : "size-2 bg-white/35",
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function PathCard({
  path,
  index,
  active,
}: {
  path: (typeof homepageJourneys)[number];
  index: number;
  active: boolean;
}) {
  const Icon = icons[index] ?? Search;
  return (
    <Link
      href={path.href}
      data-journey-panel={String(index + 1).padStart(2, "0")}
      data-motion-item="visible"
      onClick={() => {
        if (path.id === "model-yukle") trackHomeEvent({ name: "upload_cta_clicked" });
        if (path.id === "hazir-model") trackHomeEvent({ name: "ready_model_cta_clicked" });
      }}
      className={cn(
        "home-press-card group relative flex min-h-[13.5rem] flex-col overflow-hidden rounded-[1.25rem] border bg-[#141a21] p-5 sm:min-h-[15rem]",
        active ? "border-cyan/45" : "border-white/10",
        index === 2 && "border-orange/35",
      )}
    >
      <Icon className={cn("relative size-8", accents[index])} aria-hidden="true" />
      <h3 className="relative mt-5 font-heading text-[1.45rem] leading-tight font-bold tracking-[-0.04em] sm:text-2xl">
        {path.title}
      </h3>
      <p className="relative mt-2 max-w-xs text-base leading-7 text-white/80">
        {path.description}
      </p>
      <span className="relative mt-auto inline-flex min-h-11 items-center gap-2 pt-4 text-[0.9375rem] font-semibold">
        {path.cta}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
