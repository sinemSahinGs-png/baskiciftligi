"use client";

import type { Route } from "next";
import { useEffect, useRef, useState } from "react";

import { HomeTrackLink } from "@/components/home/home-track-link";
import { industrialAssets } from "@/components/home-industrial/industrial-slots";
import { SlotImage } from "@/components/home-industrial/slot-image";
import { CadFrame } from "@/components/home-industrial/technical-grid";

const PATHS = [
  {
    id: "01",
    title: "FİKRİNİ ANLAT",
    copy: "Aklındaki fikri yaz, birlikte şekillendirelim.",
    image: industrialAssets.pathIdeaDragon,
    asset: "path-idea-dragon",
    action: "focus" as const,
  },
  {
    id: "02",
    title: "HAZIR MODEL SEÇ",
    copy: "Binlerce model seni bekliyor.",
    image: industrialAssets.pathReadyModel,
    asset: "path-ready-model",
    href: "/hazir-modeller" as Route,
    action: "link" as const,
  },
  {
    id: "03",
    title: "DOSYANI YÜKLE",
    copy: "Kendi dosyanla hemen başla.",
    image: industrialAssets.pathUploadObject,
    asset: "path-upload-object",
    href: "/model-yukle" as Route,
    action: "link" as const,
  },
] as const;

export function ProductionPaths() {
  const [active, setActive] = useState(0);
  const manualRef = useRef(false);

  useEffect(() => {
    const section = document.getElementById("uc-uretim-yolu");
    if (!section) return;
    const onScroll = () => {
      if (manualRef.current) return;
      const box = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.max(0, Math.min(1, (vh * 0.45 - box.top) / Math.max(box.height, 1)));
      setActive(Math.min(2, Math.floor(progress * 3)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function select(index: number) {
    manualRef.current = true;
    setActive(index);
    const path = PATHS[index];
    if (path.action === "focus") {
      document.getElementById("idea-command-input")?.focus();
      document.getElementById("ne-uretmek-istiyorsun")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const current = PATHS[active] ?? PATHS[0];

  return (
    <section
      id="uc-uretim-yolu"
      data-home-theme="mono"
      data-journey-section=""
      className="hi-section"
      aria-labelledby="paths-heading"
    >
      <div className="hi-shell hi-paths-layout">
        <div className="hi-paths-rail">
          <h2 id="paths-heading" className="sr-only">
            Üç üretim yolu
          </h2>
          {PATHS.map((path, index) => (
            <button
              key={path.id}
              type="button"
              data-journey-panel={path.id}
              data-active={index === active ? "true" : "false"}
              className="hi-path-btn"
              onClick={() => select(index)}
            >
              <span className="hi-path-num">{path.id}</span>
              <span>
                <span className="hi-path-name">{path.title}</span>
                <span className="hi-path-copy">{path.copy}</span>
              </span>
            </button>
          ))}
          {current.action === "link" && current.href === "/hazir-modeller" ? (
            <HomeTrackLink
              event="ready_model_cta_clicked"
              href={current.href}
              className="hi-link mt-1"
            >
              Hazır modellere git →
            </HomeTrackLink>
          ) : null}
          {current.action === "link" && current.href === "/model-yukle" ? (
            <HomeTrackLink
              event="upload_cta_clicked"
              href={current.href}
              className="hi-link mt-1"
            >
              Dosyanı yükle →
            </HomeTrackLink>
          ) : null}
        </div>
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
      </div>
    </section>
  );
}
