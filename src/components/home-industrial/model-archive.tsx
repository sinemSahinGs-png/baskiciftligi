"use client";

import type { Route } from "next";
import { useMemo, useState } from "react";

import { HomeTrackLink } from "@/components/home/home-track-link";
import type { ReadyModelCard } from "@/components/home/ready-models-section";
import { industrialAssets } from "@/components/home-industrial/industrial-slots";
import { SlotImage } from "@/components/home-industrial/slot-image";
import { InteractiveMedia, WordReveal } from "@/components/motion/premium";

type ArchiveItem = {
  id: string;
  src: string | null;
  asset: string;
  title: string;
  source: string;
  editorial: boolean;
  href?: string;
  licenseLabel: string;
  fileLabel: string;
  quoteEligible: boolean;
};

const EDITORIAL: ArchiveItem[] = [
  {
    id: "editorial-01",
    src: industrialAssets.archiveMain,
    asset: "archive-main",
    title: "Arşiv karesi 01",
    source: "Editoryal sunum",
    editorial: true,
    licenseLabel: "Sunum görseli · lisanslı ürün değil",
    fileLabel: "İndirilebilir dosya değil",
    quoteEligible: false,
  },
  {
    id: "editorial-02",
    src: industrialAssets.archiveThumb01,
    asset: "archive-thumb-01",
    title: "Arşiv karesi 02",
    source: "Editoryal sunum",
    editorial: true,
    licenseLabel: "Sunum görseli · lisanslı ürün değil",
    fileLabel: "İndirilebilir dosya değil",
    quoteEligible: false,
  },
  {
    id: "editorial-03",
    src: industrialAssets.archiveThumb02,
    asset: "archive-thumb-02",
    title: "Arşiv karesi 03",
    source: "Editoryal sunum",
    editorial: true,
    licenseLabel: "Sunum görseli · lisanslı ürün değil",
    fileLabel: "İndirilebilir dosya değil",
    quoteEligible: false,
  },
];

function toArchiveItem(model: ReadyModelCard): ArchiveItem {
  return {
    id: model.id,
    src: model.imageUrl ?? null,
    asset: `live-${model.id}`,
    title: model.name,
    source: model.sourceLabel ?? (model.source === "thingiverse" ? "Thingiverse" : "Doğrulanmış hazır model"),
    editorial: false,
    href: model.href,
    licenseLabel: model.licenseLabel?.trim()
      ? model.licenseLabel
      : model.licenseVerified
        ? "Lisans doğrulandı"
        : "Lisans kaydı yok",
    fileLabel: model.fileVerified ? "Üretim dosyası doğrulandı" : "Üretim dosyası henüz doğrulanmadı",
    quoteEligible: model.quoteEligible === true,
  };
}

export function ModelArchive({ models }: { models: ReadyModelCard[] }) {
  const live = models.slice(0, 5).map(toArchiveItem);
  const items = useMemo(() => {
    if (live.length >= 3) return live.slice(0, 5);
    return [...live, ...EDITORIAL].slice(0, Math.max(3, live.length + 1));
  }, [live]);
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
        <div className="hi-archive-head">
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
          Seçili model sahnede. Küçük kareler gerçek sonuçlardır; editoryal kareler sunumdur ve
          satılmaz.
        </p>

        <div className="hi-archive-layout mt-5">
          <InteractiveMedia>
            <div className="hi-archive-main" data-industrial-asset={current?.asset}>
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="hi-archive-slide absolute inset-0"
                  data-active={index === active ? "true" : "false"}
                  data-industrial-asset={item.editorial ? item.asset : undefined}
                >
                  <SlotImage
                    src={item.src}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 92vw, 62vw"
                    className="object-contain object-center"
                  />
                </div>
              ))}
              <span className="hi-crop-marker" aria-hidden="true" />
              <span className="hi-archive-scan" aria-hidden="true" />
            </div>
          </InteractiveMedia>
          <div className="hi-archive-side">
            <div className="hi-archive-meta" key={current?.id}>
              <p className="hi-path-name">{current?.title}</p>
              <p className="hi-mono mt-1">{current?.source}</p>
              <p className="hi-archive-fact">{current?.licenseLabel}</p>
              <p className="hi-archive-fact">{current?.fileLabel}</p>
            </div>
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
                  data-industrial-asset={item.editorial ? item.asset : undefined}
                >
                  <SlotImage
                    src={item.src}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
            <div className="sr-only" aria-hidden="true">
              {EDITORIAL.filter((item) => !items.some((entry) => entry.asset === item.asset)).map(
                (item) => (
                  <span key={item.asset} data-industrial-asset={item.asset} />
                ),
              )}
            </div>
            <div className="hi-archive-actions">
              {current?.quoteEligible && current.href ? (
                <HomeTrackLink
                  event="ready_model_cta_clicked"
                  href={current.href as Route}
                  className="hi-link"
                >
                  BUNUNLA FİYAT AL →
                </HomeTrackLink>
              ) : current?.href && !current.editorial ? (
                <HomeTrackLink
                  event="ready_model_cta_clicked"
                  href={current.href as Route}
                  className="hi-link"
                >
                  Modeli incele →
                </HomeTrackLink>
              ) : (
                <HomeTrackLink
                  event="ready_model_cta_clicked"
                  href={"/hazir-modeller" as Route}
                  className="hi-link"
                >
                  MODELLERİ KEŞFET →
                </HomeTrackLink>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
