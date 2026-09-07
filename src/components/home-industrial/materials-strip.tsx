"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";

import { SlotImage } from "@/components/home-industrial/slot-image";
import { industrialMaterialSrc } from "@/components/home-industrial/industrial-slots";
import { homepageMaterialCopy, homepageMaterialCore } from "@/domain/home/homepage";
import type { Material } from "@/domain/catalog/types";

const TRAIT: Record<string, string> = {
  pla: "Çok yönlü",
  petg: "Dayanıklı",
  tpu: "Esnek",
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

  return (
    <section
      id="malzeme-secenekleri"
      data-home-theme="mono"
      className="hi-section"
      aria-labelledby="materials-heading"
    >
      <div className="hi-shell">
        <div className="flex items-end justify-between gap-3">
          <h2 id="materials-heading" className="hi-title">
            MALZEMELER
          </h2>
          <Link href={"/malzemeler" as Route} className="hi-link">
            Tümünü gör →
          </Link>
        </div>
        {activeCell ? (
          <div className="hi-material-hero mt-5 hi-frame">
            <SlotImage
              key={activeCell.slug}
              src={industrialMaterialSrc[activeCell.slug as keyof typeof industrialMaterialSrc]}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
        ) : null}
        <div className="hi-material-tabs">
          {cells.map((material) => (
            <button
              key={material.id}
              type="button"
              data-active={material.slug === active ? "true" : "false"}
              data-industrial-asset={`material-${material.slug}`}
              className="hi-material p-3"
              onClick={() => setActive(material.slug)}
            >
              <span className="hi-material-thumb">
                <SlotImage
                  src={industrialMaterialSrc[material.slug as keyof typeof industrialMaterialSrc]}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 33vw, 240px"
                  className="object-cover"
                />
              </span>
              <span className="mt-0 block md:mt-3">
                <span className="hi-path-name text-[1.15rem]">{material.name}</span>
                <span className="mt-1 block text-sm text-[color:var(--bc-muted)]">
                  {material.trait}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
