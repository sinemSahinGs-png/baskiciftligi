"use client";

import type { Route } from "next";
import { useState } from "react";

import { HomeTrackLink } from "@/components/home/home-track-link";
import { SlotImage } from "@/components/home-industrial/slot-image";
import { CadFrame } from "@/components/home-industrial/technical-grid";
import type { ReadyModelCard } from "@/components/home/ready-models-section";

export function ModelArchive({ models }: { models: ReadyModelCard[] }) {
  const visible = models.slice(0, 3);
  const [active, setActive] = useState(0);
  const current = visible[active] ?? visible[0];

  if (!current) {
    return (
      <section id="sana-gore-hazir-modeller" data-home-theme="mono" className="hi-section">
        <div className="hi-shell">
          <h2 className="hi-title">MODEL ARŞİVİ</h2>
          <HomeTrackLink event="ready_model_cta_clicked" href={"/hazir-modeller" as Route} className="hi-link mt-4">
            Tüm modelleri gör →
          </HomeTrackLink>
        </div>
      </section>
    );
  }

  const code = String(active + 1).padStart(4, "0");

  return (
    <section
      id="sana-gore-hazir-modeller"
      data-home-theme="mono"
      className="hi-section"
      aria-labelledby="archive-heading"
    >
      <div className="hi-shell">
        <div className="flex items-end justify-between gap-3 border-b border-[color:var(--bc-line)] pb-3">
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

        <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1.4fr)_5.5rem]">
          <div>
            <CadFrame className="relative aspect-[4/5] overflow-hidden bg-[color:var(--bc-panel)] md:aspect-[5/4]">
              <SlotImage
                src={current.imageUrl}
                alt={current.name}
                fill
                sizes="(max-width: 768px) 100vw, 70vw"
              />
            </CadFrame>
            <p className="hi-mono mt-3">
              #{code} {current.name}
            </p>
            <p className="mt-1 text-sm text-[color:var(--bc-muted)]">
              {current.category}
              {current.source === "curated" ? " · Küratörlü" : ""}
            </p>
            <HomeTrackLink
              event="ready_model_cta_clicked"
              href={current.href as Route}
              className="hi-link mt-2"
            >
              Modeli incele →
            </HomeTrackLink>
          </div>
          {visible.length > 1 ? (
            <div className="flex gap-2 md:flex-col">
              {visible.map((model, index) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={model.name}
                  data-active={index === active ? "true" : "false"}
                  className="relative aspect-square min-h-11 min-w-11 flex-1 overflow-hidden border border-[color:var(--bc-line)] md:flex-none"
                >
                  {index === active ? <span className="hi-frame absolute inset-0" aria-hidden="true" /> : null}
                  <SlotImage
                    src={model.imageUrl}
                    alt=""
                    fill
                    sizes="96px"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
