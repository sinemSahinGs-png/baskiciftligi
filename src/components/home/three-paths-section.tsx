"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Box, Search, Upload } from "lucide-react";

import { HomeTrackLink } from "@/components/home/home-track-link";
import { homepageJourneys } from "@/domain/home/homepage";
import { cn } from "@/lib/utils";

const icons = [Search, Box, Upload] as const;
const accents = ["text-cyan", "text-violet", "text-orange"] as const;

export function ThreePathsSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const slides = [...track.children];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible?.target) return;
        const index = slides.indexOf(visible.target);
        if (index >= 0) setSelected(index);
      },
      { root: track, threshold: [0.55, 0.75] },
    );
    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, []);

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
          className="home-paths-viewport mt-5"
          data-pinned="false"
        >
          <div ref={trackRef} className="home-paths-track">
            {homepageJourneys.map((path, index) => (
              <div key={path.id} className="home-paths-slide">
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
              onClick={() => {
                const slide = trackRef.current?.children[index] as HTMLElement | undefined;
                slide?.scrollIntoView({ inline: "start", block: "nearest", behavior: "smooth" });
                setSelected(index);
              }}
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
  const event =
    path.id === "model-yukle"
      ? ("upload_cta_clicked" as const)
      : path.id === "hazir-model"
        ? ("ready_model_cta_clicked" as const)
        : undefined;

  return (
    <HomeTrackLink
      event={event}
      href={path.href}
      data-journey-panel={String(index + 1).padStart(2, "0")}
      data-motion-item="visible"
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
    </HomeTrackLink>
  );
}
