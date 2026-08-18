"use client";

import type { Route } from "next";
import Link from "next/link";

import { SectionIntro } from "@/components/home/section-intro";
import { PinnedStory } from "@/components/motion/pinned-story";
import { StaggerGrid } from "@/components/motion/stagger-grid";
import { useScrollMotion } from "@/components/motion/scroll-motion-provider";
import {
  homepageMaterialCopy,
  homepageMaterialOrder,
} from "@/domain/home/homepage";
import type { Material } from "@/domain/catalog/types";

const swatches = ["#4054FF", "#FF6542", "#30D5D2", "#171721", "#7A42F4"];

function MaterialCards({
  materials,
  reveal = true,
}: {
  materials: Material[];
  reveal?: boolean;
}) {
  return materials.map((material, index) => {
    const extra =
      homepageMaterialCopy[material.slug as keyof typeof homepageMaterialCopy];
    const sample = material.colors[0]?.hex ?? swatches[index] ?? "#4054FF";
    return (
      <Link
        key={material.id}
        href={`/malzemeler/${material.slug}` as Route}
        data-motion-item={reveal ? "idle" : "visible"}
        className="motion-item min-w-0 overflow-hidden rounded-lg bg-optical lg:min-w-[17rem] lg:flex-1"
      >
        <span className="relative block h-28 overflow-hidden sm:h-32">
          <span
            className="absolute inset-0"
            style={{
              background: `linear-gradient(160deg, ${sample}, color-mix(in srgb, ${sample} 40%, #171721))`,
            }}
          />
          <span
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-[10px] border-white/25 shadow-[inset_0_0_0_10px_rgb(0_0_0/0.18)]"
            style={{ background: sample }}
          />
        </span>
        <span className="block p-4 text-dark-text">
          <span className="font-heading text-2xl font-bold tracking-[-0.04em]">
            {material.slug === "standart-recine" ? "SLA" : material.name}
          </span>
          <span className="mt-3 block text-sm font-semibold">{extra?.benefit}</span>
          <span className="mt-1 block text-sm text-ink-secondary">{extra?.usage}</span>
          <span className="mt-3 flex flex-wrap gap-2 text-[0.78rem] text-ink-secondary">
            <span>Esneklik {material.flexibility}/5</span>
            <span>Detay {material.surfaceQuality}/5</span>
            <span>{material.suitability}</span>
          </span>
        </span>
      </Link>
    );
  });
}

export function MaterialsSection({ materials }: { materials: Material[] }) {
  const visible = homepageMaterialOrder
    .map((slug) => materials.find((material) => material.slug === slug))
    .filter((material): material is Material => Boolean(material));
  const { allowPinned, reduced } = useScrollMotion();
  const pinned = allowPinned && !reduced;

  return (
    <section className="atmosphere-porcelain section-space">
      <div className="shell">
        <SectionIntro
          title="Malzeme laboratuvarı"
          description="Yüzey ve teknoloji birlikte okunur."
          action={{ href: "/malzemeler" as Route, label: "Malzeme rehberi" }}
        />
        {pinned ? (
          <PinnedStory heightClassName="lg:h-[155vh]">
            {(progress) => (
              <div className="overflow-hidden">
                <div
                  className="flex gap-3"
                  style={{
                    width: "168%",
                    transform: `translate3d(${progress * -36}%, 0, 0)`,
                  }}
                >
                  <MaterialCards materials={visible} reveal={false} />
                </div>
              </div>
            )}
          </PinnedStory>
        ) : (
          <StaggerGrid className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MaterialCards materials={visible} />
          </StaggerGrid>
        )}
      </div>
    </section>
  );
}
