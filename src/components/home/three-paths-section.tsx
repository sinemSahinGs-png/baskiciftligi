"use client";

import Link from "next/link";
import { ArrowRight, Box, Search, Upload } from "lucide-react";

import { FoundryGrid } from "@/components/brand/foundry-grid";
import { homepageJourneys } from "@/domain/home/homepage";
import { trackHomeEvent } from "@/lib/home/analytics";
import { cn } from "@/lib/utils";

const icons = [Search, Box, Upload] as const;
const worlds = [
  "bg-[#102226] text-light-text",
  "bg-[#171428] text-light-text",
  "bg-carbon text-light-text",
] as const;

export function ThreePathsSection() {
  return (
    <section
      id="uc-uretim-yolu"
      data-journey-section
      className="bg-[#f4f1ea] pt-4 pb-10 sm:pt-6 sm:pb-14"
    >
      <div className="home-shell">
        <h2 className="font-heading text-[1.65rem] leading-[1.08] font-bold tracking-[-0.04em] sm:text-3xl">
          Üç üretim yolu
        </h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-ink-secondary">
          Yaz, seç veya yükle. Hepsi aynı stüdyoda üretime bağlanır.
        </p>
        <div className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
          {homepageJourneys.map((path, index) => (
            <div
              key={path.id}
              className="min-w-0 shrink-0 basis-[min(80%,19rem)] snap-start lg:basis-auto"
            >
              <PathCard path={path} index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PathCard({
  path,
  index,
}: {
  path: (typeof homepageJourneys)[number];
  index: number;
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
        "group relative flex min-h-[13.5rem] flex-col overflow-hidden rounded-2xl p-5 transition duration-200 active:scale-[0.99] sm:min-h-[15rem]",
        worlds[index],
      )}
    >
      {index === 1 ? <FoundryGrid variant="blueprint" className="opacity-50" /> : null}
      <Icon className="relative size-5 text-cyan" aria-hidden="true" />
      <h3 className="relative mt-5 font-heading text-xl font-bold tracking-[-0.04em] sm:text-2xl">
        {path.title}
      </h3>
      <p className="relative mt-2 max-w-xs text-sm leading-6 text-white/75">
        {path.description}
      </p>
      <span className="relative mt-auto inline-flex min-h-11 items-center gap-2 pt-4 text-sm font-semibold">
        {path.cta}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
