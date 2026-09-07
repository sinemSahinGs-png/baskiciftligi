"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState, type KeyboardEvent } from "react";

import { SlotImage } from "@/components/home-industrial/slot-image";
import { industrialMaterialSrc } from "@/components/home-industrial/industrial-slots";
import { InteractiveMedia, WordReveal } from "@/components/motion/premium";
import { homepageMaterialCopy, homepageMaterialCore } from "@/domain/home/homepage";
import type { Material } from "@/domain/catalog/types";

const TRAIT: Record<string, string> = {
  pla: "Çok yönlü günlük üretim",
  petg: "Daha dayanıklı, nem ve darbe",
  tpu: "Esnek, darbeyi emer",
};

export function MaterialsStrip({ materials }: { materials: Material[] }) {
  const cells = homepageMaterialCore.map((slug) => {
    const material = materials.find((item) => item.slug === slug);
    return {
      slug,
      id: material?.id ?? slug,
      name: material?.name ?? slug.toUpperCase(),
      trait:
        TRAIT[slug] ??
        homepageMaterialCopy[slug as keyof typeof homepageMaterialCopy]?.benefit ??
        "",
    };
  });
  const [active, setActive] = useState(cells[0]?.slug ?? "pla");
  const activeCell = cells.find((item) => item.slug === active) ?? cells[0];
  const activeIndex = Math.max(0, cells.findIndex((item) => item.slug === active));

  function onTabKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") {
      return;
    }
    event.preventDefault();
    if (event.key === "Home") {
      setActive(cells[0]?.slug ?? active);
      return;
    }
    if (event.key === "End") {
      setActive(cells[cells.length - 1]?.slug ?? active);
      return;
    }
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = cells[(activeIndex + delta + cells.length) % cells.length];
    if (next) setActive(next.slug);
  }

  return (
    <section
      id="malzeme-secenekleri"
      data-home-theme="ivory"
      className="hi-section hi-materials"
      aria-labelledby="materials-heading"
    >
      <div className="hi-shell">
        <div className="hi-materials-head">
          <WordReveal as="h2" id="materials-heading" className="hi-title" text="MALZEMELER" />
          <Link href={"/malzemeler" as Route} className="hi-link">
            Tümünü gör →
          </Link>
        </div>
        {activeCell ? (
          <InteractiveMedia
            className="hi-material-hero mt-3 hi-frame"
            data-material={activeCell.slug}
          >
            <SlotImage
              key={activeCell.slug}
              src={industrialMaterialSrc[activeCell.slug as keyof typeof industrialMaterialSrc]}
              alt={`${activeCell.name} katman dokusu`}
              fill
              sizes="100vw"
              className="object-cover"
            />
            <span className="hi-material-light" aria-hidden="true" />
          </InteractiveMedia>
        ) : null}
        <div
          className="hi-material-tabs"
          role="tablist"
          aria-label="Malzeme seçimi"
          onKeyDown={onTabKey}
        >
          {cells.map((material) => (
            <button
              key={material.id}
              type="button"
              role="tab"
              id={`material-tab-${material.slug}`}
              aria-selected={material.slug === active}
              tabIndex={material.slug === active ? 0 : -1}
              data-active={material.slug === active ? "true" : "false"}
              data-industrial-asset={`material-${material.slug}`}
              className="hi-material"
              onClick={() => setActive(material.slug)}
            >
              {material.name}
            </button>
          ))}
        </div>
        {activeCell ? (
          <p className="hi-material-copy" aria-live="polite">
            {activeCell.name}
            <span> · {activeCell.trait}</span>
          </p>
        ) : null}
      </div>
    </section>
  );
}
