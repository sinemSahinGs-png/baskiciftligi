"use client";

import type { Route } from "next";
import { useMemo, useState } from "react";

import { HomeTrackLink } from "@/components/home/home-track-link";
import type { ReadyModelCard } from "@/components/home/ready-models-section";
import { industrialAssets } from "@/components/home-industrial/industrial-slots";
import { SlotImage } from "@/components/home-industrial/slot-image";
import { CadFrame } from "@/components/home-industrial/technical-grid";
import { InteractiveMedia, WordReveal } from "@/components/motion/premium";

const EDITORIAL = [
  {
    id: "editorial-01",
    src: industrialAssets.archiveMain,
    asset: "archive-main",
    title: "Arşiv karesi 01",
    source: "Editoryal görsel",
    editorial: true,
  },
  {
    id: "editorial-02",
    src: industrialAssets.archiveThumb01,
    asset: "archive-thumb-01",
    title: "Arşiv karesi 02",
    source: "Editoryal görsel",
    editorial: true,
  },
  {
    id: "editorial-03",
    src: industrialAssets.archiveThumb02,
    asset: "archive-thumb-02",
    title: "Arşiv karesi 03",
    source: "Editoryal görsel",
    editorial: true,
  },
] as const;

export function ModelArchive({ models }: { models: ReadyModelCard[] }) {
  const live = models.slice(0, 2).map((model) => ({
    id: model.id,
    src: model.imageUrl ?? null,
    asset: `live-${model.id}`,
    title: model.name,
    source: model.source === "thingiverse" ? "Thingiverse" : "Doğrulanmış hazır model",
    editorial: false,
    href: model.href,
  }));
  const items = useMemo(() => [...EDITORIAL.slice(0, 3), ...live].slice(0, 5), [live]);
  const [active, setActive] = useState(0);
  const current = items[active] ?? items[0];

  return (
    <section
      id="sana-gore-hazir-modeller"
      data-home-theme="ivory"
      className="hi-section hi-archive"
      aria-labelledby="archive-heading"
    >
      <div className="hi-shell">
        <div className="flex items-end justify-between gap-3">
          <WordReveal as="h2" id="archive-heading" className="hi-title" text="MODEL LABORATUVARI" />
          <HomeTrackLink
            event="ready_model_cta_clicked"
            href={"/hazir-modeller" as Route}
            className="hi-link shrink-0"
          >
            MODELLERİ KEŞFET →
          </HomeTrackLink>
        </div>
        <p className="hi-lede">
          Büyük sahne editoryal vitindir. Satın alınabilir modeller lisans ve dosya
          doğrulaması olan kayıtlardır; ejderha görseli doğrudan satılmaz.
        </p>

        <div className="hi-archive-layout mt-5">
          <InteractiveMedia>
            <CadFrame className="hi-archive-main" data-industrial-asset={current?.asset}>
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="hi-archive-slide absolute inset-0"
                  data-active={index === active ? "true" : "false"}
                >
                  <SlotImage
                    src={item.src}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 92vw, 70vw"
                    className="object-cover object-center"
                  />
                </div>
              ))}
              <span className="hi-crop-marker" aria-hidden="true" />
              <span className="hi-archive-scan" aria-hidden="true" />
              <div className="hi-archive-meta">
                <p className="hi-path-name">{current?.title}</p>
                <p className="hi-mono mt-1">
                  {current?.editorial ? "Editoryal · lisanslı ürün değil" : current?.source}
                </p>
              </div>
            </CadFrame>
          </InteractiveMedia>
          <div className="hi-archive-thumbs" role="list">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => setActive(index)}
                aria-label={item.title}
                aria-pressed={index === active}
                data-active={index === active ? "true" : "false"}
                data-industrial-asset={item.asset}
              >
                <SlotImage
                  src={item.src}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
