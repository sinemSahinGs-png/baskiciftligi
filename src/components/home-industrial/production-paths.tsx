"use client";

import type { Route } from "next";
import { useEffect, useRef, useState } from "react";

import { HomeTrackLink } from "@/components/home/home-track-link";
import { industrialAssets } from "@/components/home-industrial/industrial-slots";
import { SlotImage } from "@/components/home-industrial/slot-image";
import { InteractiveMedia, WordReveal } from "@/components/motion/premium";

const PATHS = [
  {
    id: "01",
    title: "FİKRİNİ ANLAT",
    copy: "Aklındaki nesneyi yaz; uygun modelleri ve üretim yolunu birlikte netleştirelim.",
    image: industrialAssets.pathIdeaDragon,
    asset: "path-idea-dragon",
    action: "focus" as const,
  },
  {
    id: "02",
    title: "HAZIR MODEL SEÇ",
    copy: "Lisansı ve dosyası doğrulanmış modeller arasından seç, fiyatı netleştir.",
    image: industrialAssets.pathReadyModel,
    asset: "path-ready-model",
    href: "/hazir-modeller" as Route,
    action: "link" as const,
    event: "ready_model_cta_clicked" as const,
  },
  {
    id: "03",
    title: "DOSYANI YÜKLE",
    copy: "STL veya 3MF dosyanla üretime başla; ölçü ve malzeme sonraki adımda.",
    image: industrialAssets.pathUploadObject,
    asset: "path-upload-object",
    href: "/model-yukle" as Route,
    action: "link" as const,
    event: "upload_cta_clicked" as const,
  },
] as const;

export function ProductionPaths() {
  const [active, setActive] = useState(0);
  const pointerStart = useRef<number | null>(null);
  const fineRef = useRef(false);

  useEffect(() => {
    fineRef.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }, []);

  function select(index: number) {
    setActive(Math.max(0, Math.min(PATHS.length - 1, index)));
  }

  function focusIdea() {
    document.getElementById("ne-uretmek-istiyorsun")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    window.setTimeout(() => {
      document.getElementById("idea-command-input")?.focus();
    }, 180);
  }

  const current = PATHS[active] ?? PATHS[0];

  return (
    <section
      id="uc-uretim-yolu"
      data-home-theme="mono"
      data-journey-section=""
      className="hi-section hi-paths"
      aria-labelledby="paths-heading"
    >
      <div className="hi-shell hi-paths-layout">
        <div className="hi-paths-rail">
          <WordReveal as="h2" id="paths-heading" className="hi-paths-title" text="Üç üretim yolu" />
          <p className="hi-paths-count hi-mono" aria-live="polite">
            {current.id} / 03
          </p>
          {PATHS.map((path, index) => (
            <button
              key={path.id}
              type="button"
              data-journey-panel={path.id}
              data-active={index === active ? "true" : "false"}
              className="hi-path-btn"
              onMouseEnter={() => {
                if (fineRef.current) select(index);
              }}
              onFocus={() => select(index)}
              onClick={() => select(index)}
            >
              <span className="hi-path-num">{path.id}</span>
              <span>
                <span className="hi-path-name">{path.title}</span>
                <span className="hi-path-copy">{path.copy}</span>
              </span>
            </button>
          ))}
          <div className="hi-path-cta-slot">
            <p className="hi-path-copy" data-path-mobile-copy="">
              {current.copy}
            </p>
            {current.action === "link" ? (
              <HomeTrackLink
                event={current.event}
                href={current.href}
                className="hi-btn hi-path-cta"
              >
                {current.title} →
              </HomeTrackLink>
            ) : (
              <button type="button" className="hi-btn hi-path-cta" onClick={focusIdea}>
                Fikrini yaz →
              </button>
            )}
          </div>
        </div>
        <InteractiveMedia className="hi-path-media">
          <div
            className="hi-path-stage"
            onPointerDown={(event) => {
              pointerStart.current = event.clientX;
            }}
            onPointerUp={(event) => {
              if (pointerStart.current == null) return;
              const delta = event.clientX - pointerStart.current;
              pointerStart.current = null;
              if (delta < -40) select(active + 1);
              if (delta > 40) select(active - 1);
            }}
          >
            {PATHS.map((path, index) => (
              <div
                key={path.image}
                className="absolute inset-0"
                data-active={index === active ? "true" : "false"}
                data-industrial-asset={path.asset}
                data-neighbor={
                  index === active - 1 ? "prev" : index === active + 1 ? "next" : undefined
                }
              >
                <SlotImage
                  src={path.image}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 58vw"
                  className="object-cover object-center"
                />
              </div>
            ))}
            <span className="hi-path-connector" aria-hidden="true" />
            <p className="hi-mono absolute top-3 right-3 z-10">
              {current.id} / 03
            </p>
            <p className="hi-paths-hint hi-mono" aria-hidden="true">
              {current.title}
            </p>
          </div>
        </InteractiveMedia>
      </div>
    </section>
  );
}
