"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";

import { SlotImage } from "@/components/home-industrial/slot-image";
import { industrialSlotSrc } from "@/components/home-industrial/industrial-slots";
import { homepageMaterialCopy, homepageMaterialCore } from "@/domain/home/homepage";
import type { Material } from "@/domain/catalog/types";

const TRAIT: Record<string, string> = {
  pla: "Çok yönlü",
  petg: "Dayanıklı",
  tpu: "Esnek",
};

export function MaterialsStrip({ materials }: { materials: Material[] }) {
  const visible = homepageMaterialCore
    .map((slug) => materials.find((material) => material.slug === slug))
    .filter((material): material is Material => Boolean(material));
  const [active, setActive] = useState(visible[0]?.slug ?? "pla");

  return (
    <section
      id="malzeme-secenekleri"
      data-home-theme="mono"
      className="hi-section"
      aria-labelledby="materials-heading"
    >
      <div className="hi-shell">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="materials-heading" className="hi-title">
              MALZEMELER
            </h2>
            <p className="hi-lede">Doğru malzeme, daha iyi sonuçlar.</p>
          </div>
          <Link href={"/malzemeler" as Route} className="hi-link">
            Tümünü gör →
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-px border border-[color:var(--bc-line)]">
          {visible.map((material) => (
            <button
              key={material.id}
              type="button"
              data-active={material.slug === active ? "true" : "false"}
              className="hi-material bg-[color:var(--bc-panel)] text-left"
              onClick={() => setActive(material.slug)}
            >
              <span className="relative block aspect-square overflow-hidden">
                <SlotImage
                  src={industrialSlotSrc(`material-${material.slug}.avif`)}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 33vw, 240px"
                />
              </span>
              <span className="block p-3">
                <span className="hi-path-name text-[1.05rem]">{material.name}</span>
                <span className="mt-1 block text-sm text-[color:var(--bc-muted)]">
                  {TRAIT[material.slug] ??
                    homepageMaterialCopy[material.slug as keyof typeof homepageMaterialCopy]?.benefit}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
