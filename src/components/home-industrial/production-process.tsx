"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

import { industrialAssets } from "@/components/home-industrial/industrial-slots";
import { SlotImage } from "@/components/home-industrial/slot-image";
import { CadFrame } from "@/components/home-industrial/technical-grid";

const STAGES = [
  { id: "01", title: "DİLİMLEME", copy: "Model hazırlanır." },
  { id: "02", title: "ÜRETİM", copy: "Fikrin üretilir." },
  { id: "03", title: "KALİTE KONTROL", copy: "Tüm detaylar kontrol edilir." },
  { id: "04", title: "PAKETLEME", copy: "Güvenle size ulaşır." },
] as const;

export function ProductionProcess() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [wide, setWide] = useState(false);
  const stageIndex = Math.min(3, Math.floor(progress * 4));
  const pinned = reduce === false && wide;

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setWide(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!pinned) return;
    const node = ref.current;
    if (!node) return;
    const onScroll = () => {
      const box = node.getBoundingClientRect();
      const span = Math.max(1, box.height - window.innerHeight);
      const raw = Math.min(1, Math.max(0, -box.top / span));
      node.style.setProperty("--process-progress", String(raw));
      setProgress(raw);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [pinned]);

  return (
    <section
      ref={ref}
      id="nasil-calisir"
      data-home-theme="cyan-scan"
      data-process-section=""
      data-process-pinned={pinned ? "true" : "false"}
      data-stage={STAGES[stageIndex]?.id}
      className="hi-section hi-process"
      aria-labelledby="process-heading"
    >
      <div className="hi-process-pin hi-shell">
        <p className="hi-kicker">FİKRİNİN YOLCULUĞU</p>
        <h2 id="process-heading" className="hi-title mt-2">
          ÜRETİM SÜRECİ
        </h2>
        <CadFrame
          className="hi-process-scene mt-5 overflow-hidden bg-[color:var(--bc-panel)]"
          data-industrial-asset="production-tunnel"
        >
          <SlotImage
            src={industrialAssets.productionTunnel}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[center_70%]"
          />
          <div className="hi-scan-beam pointer-events-none absolute inset-y-0 left-[42%] z-10 w-px" />
          <div
            className="hi-vase pointer-events-none absolute bottom-[16%] left-[8%] z-10 h-[8%] w-[18%] border border-[color:var(--bc-cyan)]"
            aria-hidden="true"
          />
        </CadFrame>
        <div className="hi-rail mt-4" aria-hidden="true">
          <span />
        </div>
        <ol className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {STAGES.map((item, index) => (
            <li
              key={item.id}
              data-process-step={item.id}
              data-active={index === stageIndex ? "true" : "false"}
              className={index === stageIndex ? "text-[color:var(--bc-orange)]" : ""}
            >
              <p className="hi-mono">{item.id}</p>
              <p className="hi-path-name mt-1 text-[1.05rem]">{item.title}</p>
              <p className="mt-1 text-sm text-[color:var(--bc-muted)]">{item.copy}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
