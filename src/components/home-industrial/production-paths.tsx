"use client";

import type { Route } from "next";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { CadFrame } from "@/components/home-industrial/technical-grid";
import { SlotImage } from "@/components/home-industrial/slot-image";
import { trackHomeEvent } from "@/lib/home/analytics";

const PATHS = [
  {
    id: "01",
    title: "FİKRİNİ ANLAT",
    copy: "Aklındaki fikri yaz, birlikte şekillendirelim.",
    image: "/images/home-industrial/path-idea-dragon.avif",
    meta: "FİKİR > MODEL > GERÇEK",
    action: "focus" as const,
  },
  {
    id: "02",
    title: "HAZIR MODEL SEÇ",
    copy: "Binlerce model seni bekliyor.",
    image: "/images/home-industrial/path-ready-model.avif",
    meta: "ARŞİV / HAZIR MODEL",
    href: "/hazir-modeller" as Route,
    action: "link" as const,
  },
  {
    id: "03",
    title: "DOSYANI YÜKLE",
    copy: "Kendi dosyanla hemen başla.",
    image: "/images/home-industrial/path-upload-object.avif",
    meta: "STL / 3MF",
    href: "/model-yukle" as Route,
    action: "link" as const,
  },
] as const;

export function ProductionPaths() {
  const router = useRouter();
  const [active, setActive] = useState(0);

  useEffect(() => {
    const section = document.getElementById("uc-uretim-yolu");
    if (!section) return;
    const onScroll = () => {
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
    setActive(index);
    const path = PATHS[index];
    if (path.action === "focus") {
      document.getElementById("idea-command-input")?.focus();
      document.getElementById("ne-uretmek-istiyorsun")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (path.href === "/model-yukle") {
      trackHomeEvent({ name: "upload_cta_clicked" });
    }
    if (path.href === "/hazir-modeller") {
      trackHomeEvent({ name: "ready_model_cta_clicked" });
    }
    router.push(path.href);
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
      <div className="hi-shell grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:items-center">
        <div>
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
                <span className="mt-1 block text-sm leading-5 text-[color:var(--bc-muted)]">
                  {path.copy}
                </span>
              </span>
            </button>
          ))}
        </div>
        <CadFrame className="relative aspect-[4/5] min-h-56 overflow-hidden bg-[color:var(--bc-panel)] md:aspect-[5/6]">
          <SlotImage
            key={current.image}
            src={current.image}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
          <p className="hi-mono absolute right-3 bottom-3 z-10">{current.meta}</p>
          <p className="hi-mono absolute top-3 right-3 z-10">
            {current.id} / 03
          </p>
        </CadFrame>
      </div>
    </section>
  );
}
