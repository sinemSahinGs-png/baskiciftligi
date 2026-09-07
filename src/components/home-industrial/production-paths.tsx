"use client";

import type { Route } from "next";
import { useEffect, useRef, useState } from "react";

import { HomeTrackLink } from "@/components/home/home-track-link";
import { industrialAssets } from "@/components/home-industrial/industrial-slots";
import { SlotImage } from "@/components/home-industrial/slot-image";
import { CadFrame } from "@/components/home-industrial/technical-grid";
import { InteractiveMedia, WordReveal } from "@/components/motion/premium";

const PATHS = [
  {
    id: "01",
    title: "FİKRİNİ ANLAT",
    copy: "Aklındaki fikri yaz, birlikte şekillendirelim.",
    cta: "Fikrini yaz",
    image: industrialAssets.pathIdeaDragon,
    asset: "path-idea-dragon",
    action: "focus" as const,
  },
  {
    id: "02",
    title: "HAZIR MODEL SEÇ",
    copy: "Binlerce model seni bekliyor.",
    cta: "Hazır modellere git",
    image: industrialAssets.pathReadyModel,
    asset: "path-ready-model",
    href: "/hazir-modeller" as Route,
    action: "link" as const,
  },
  {
    id: "03",
    title: "DOSYANI YÜKLE",
    copy: "Kendi dosyanla hemen başla.",
    cta: "Dosyanı yükle",
    image: industrialAssets.pathUploadObject,
    asset: "path-upload-object",
    href: "/model-yukle" as Route,
    action: "link" as const,
  },
] as const;

export function ProductionPaths() {
  const [active, setActive] = useState(0);
  const manualRef = useRef(false);
  const fineRef = useRef(false);

  useEffect(() => {
    fineRef.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const section = document.getElementById("uc-uretim-yolu");
    if (!section) return;
    let frame = 0;
    const onScroll = () => {
      if (manualRef.current) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const box = section.getBoundingClientRect();
        const vh = window.innerHeight;
        const progress = Math.max(0, Math.min(1, (vh * 0.45 - box.top) / Math.max(box.height, 1)));
        setActive(Math.min(2, Math.floor(progress * 3)));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  function select(index: number, commit = false) {
    if (commit) manualRef.current = true;
    setActive(index);
    const path = PATHS[index];
    if (commit && path.action === "focus") {
      document.getElementById("idea-command-input")?.focus();
      document.getElementById("ne-uretmek-istiyorsun")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
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
          <WordReveal as="h2" id="paths-heading" className="sr-only" text="Üç üretim yolu" />
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
              onClick={() => select(index, true)}
            >
              <span className="hi-path-num">{path.id}</span>
              <span>
                <span className="hi-path-name">{path.title}</span>
                <span className="hi-path-copy">{path.copy}</span>
              </span>
            </button>
          ))}
          <div className="hi-path-progress" aria-hidden="true">
            {PATHS.map((path, index) => (
              <span key={path.id} data-active={index === active ? "true" : "false"} />
            ))}
          </div>
          <div className="hi-path-cta-slot">
            {current.action === "link" && current.href === "/hazir-modeller" ? (
              <HomeTrackLink
                event="ready_model_cta_clicked"
                href={current.href}
                className="hi-link mt-1"
              >
                {current.cta} →
              </HomeTrackLink>
            ) : null}
            {current.action === "link" && current.href === "/model-yukle" ? (
              <HomeTrackLink
                event="upload_cta_clicked"
                href={current.href}
                className="hi-link mt-1"
              >
                {current.cta} →
              </HomeTrackLink>
            ) : null}
            {current.action === "focus" ? (
              <span className="hi-link mt-1 hi-path-cta-ghost">Fikrini yaz →</span>
            ) : null}
          </div>
        </div>
        <InteractiveMedia className="hi-path-media">
          <CadFrame className="hi-path-stage">
            {PATHS.map((path, index) => (
              <div
                key={path.image}
                className="absolute inset-0"
                data-active={index === active ? "true" : "false"}
                data-industrial-asset={path.asset}
              >
                <SlotImage
                  src={path.image}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center"
                />
              </div>
            ))}
            <p className="hi-mono absolute top-3 right-3 z-10">
              {current.id} / 03
            </p>
          </CadFrame>
        </InteractiveMedia>
      </div>
    </section>
  );
}
