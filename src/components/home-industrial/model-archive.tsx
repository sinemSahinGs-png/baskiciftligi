"use client";

import type { Route } from "next";
import { useState } from "react";

import { HomeTrackLink } from "@/components/home/home-track-link";
import { industrialAssets } from "@/components/home-industrial/industrial-slots";
import { SlotImage } from "@/components/home-industrial/slot-image";
import { CadFrame } from "@/components/home-industrial/technical-grid";
import type { ReadyModelCard } from "@/components/home/ready-models-section";

const EDITORIAL = [
  {
    src: industrialAssets.archiveMain,
    asset: "archive-main",
    label: "Arşiv karesi 01",
  },
  {
    src: industrialAssets.archiveThumb01,
    asset: "archive-thumb-01",
    label: "Arşiv karesi 02",
  },
  {
    src: industrialAssets.archiveThumb02,
    asset: "archive-thumb-02",
    label: "Arşiv karesi 03",
  },
] as const;

export function ModelArchive({ models }: { models: ReadyModelCard[] }) {
  const [active, setActive] = useState(0);
  const current = EDITORIAL[active] ?? EDITORIAL[0];
  const liveModels = models.slice(0, 3);

  return (
    <section
      id="sana-gore-hazir-modeller"
      data-home-theme="mono"
      className="hi-section"
      aria-labelledby="archive-heading"
    >
      <div className="hi-shell">
        <div className="flex items-end justify-between gap-3">
          <h2 id="archive-heading" className="hi-title">
            MODEL ARŞİVİ
          </h2>
          <HomeTrackLink
            event="ready_model_cta_clicked"
            href={"/hazir-modeller" as Route}
            className="hi-link shrink-0"
          >
            Tüm modelleri gör →
          </HomeTrackLink>
        </div>

        <div className="hi-archive-layout mt-5">
          <CadFrame className="hi-archive-main" data-industrial-asset={current.asset}>
            <SlotImage
              src={current.src}
              alt=""
              fill
              sizes="(max-width: 768px) 88vw, 70vw"
              className="object-cover object-center"
            />
            <p className="hi-mono absolute bottom-3 left-3 z-10">Görsel arşiv</p>
          </CadFrame>
          <div className="hi-archive-thumbs">
            {EDITORIAL.map((item, index) => (
              <button
                key={item.asset}
                type="button"
                onClick={() => setActive(index)}
                aria-label={item.label}
                data-active={index === active ? "true" : "false"}
                data-industrial-asset={item.asset}
              >
                {index === active ? (
                  <span className="hi-frame absolute inset-0" aria-hidden="true" />
                ) : null}
                <SlotImage
                  src={item.src}
                  alt=""
                  fill
                  sizes="88px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {liveModels.length > 0 ? (
          <div className="mt-4">
            <p className="hi-kicker">Canlı hazır modeller</p>
            <ul className="mt-2 grid gap-px border border-[color:var(--bc-line)]">
              {liveModels.map((model) => (
                <li
                  key={model.id}
                  className="flex min-h-11 items-center justify-between gap-3 bg-[color:var(--bc-panel)] px-3 py-2"
                >
                  <span className="block text-sm font-semibold">{model.name}</span>
                  <HomeTrackLink
                    event="ready_model_cta_clicked"
                    href={model.href as Route}
                    className="hi-link shrink-0 text-[0.8rem]"
                  >
                    İncele →
                  </HomeTrackLink>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
