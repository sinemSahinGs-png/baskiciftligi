"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { FoundryGrid } from "@/components/brand/foundry-grid";
import { PinnedStory } from "@/components/motion/pinned-story";
import { StaggerGrid } from "@/components/motion/stagger-grid";
import { SectionIntro } from "@/components/home/section-intro";
import { homepageJourneys } from "@/domain/home/homepage";
import { cn } from "@/lib/utils";

const order = ["/magaza", "/hazir-modeller", "/model-yukle"] as const;
const worlds = [
  "bg-cobalt text-light-text",
  "bg-deep-ink text-light-text",
  "bg-carbon text-light-text",
];

export function ThreePathsSection() {
  const paths = order
    .map((href) => homepageJourneys.find((item) => item.href === href))
    .filter((item): item is (typeof homepageJourneys)[number] => Boolean(item));

  return (
    <section className="atmosphere-optical section-space-tight">
      <div className="shell">
        <SectionIntro
          title="Üç üretim yolu"
          description="Mağaza, kütüphane veya kendi dosyan."
        />
        <PinnedStory heightClassName="lg:h-[170vh]">
          {(progress) => {
            const active = Math.min(2, Math.floor(progress * 2.99));
            return (
              <StaggerGrid className="grid gap-3 lg:grid-cols-3 lg:gap-4">
                {paths.map((path, index) => {
                  const on = active >= index;
                  return (
                    <Link
                      key={path.id}
                      href={path.href}
                      data-motion-item="idle"
                      className={cn(
                        "group relative min-h-[20rem] overflow-hidden rounded-xl p-7 sm:min-h-[22rem] sm:p-9",
                        worlds[index],
                        on ? "opacity-100" : "lg:opacity-55",
                      )}
                    >
                      {index === 2 ? (
                        <FoundryGrid variant="measure" className="opacity-70" />
                      ) : null}
                      {index === 1 ? (
                        <FoundryGrid variant="blueprint" className="opacity-80" />
                      ) : null}
                      <p
                        className={cn(
                          "relative tabular text-4xl font-bold tracking-[-0.06em]",
                          on ? "text-cyan" : "text-cyan/50",
                        )}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <span
                        aria-hidden="true"
                        className="absolute top-10 right-7 left-7 hidden h-px origin-left bg-cyan/70 lg:block"
                        style={{ transform: `scaleX(${on ? 1 : 0.18})` }}
                      />
                      <h3 className="relative mt-8 font-heading text-3xl font-bold tracking-[-0.04em]">
                        {path.title}
                      </h3>
                      <p className="relative mt-4 max-w-sm text-sm leading-7 text-white/80">
                        {path.description}
                      </p>
                      <span className="relative mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
                        {path.cta}
                        <ArrowUpRight aria-hidden="true" className="size-4" />
                      </span>
                    </Link>
                  );
                })}
              </StaggerGrid>
            );
          }}
        </PinnedStory>
      </div>
    </section>
  );
}
