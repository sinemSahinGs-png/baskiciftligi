"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

import { industrialAssets } from "@/components/home-industrial/industrial-slots";
import { SlotImage } from "@/components/home-industrial/slot-image";
import { CadFrame } from "@/components/home-industrial/technical-grid";

const STAGES = [
  { id: "01", title: "DİLİMLEME", copy: "Hazırlık" },
  { id: "02", title: "ÜRETİM", copy: "Baskı" },
  { id: "03", title: "KALİTE KONTROL", copy: "Kontrol" },
  { id: "04", title: "PAKETLEME", copy: "Sevkiyat" },
] as const;

export function ProductionProcess() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [allowPin, setAllowPin] = useState(false);
  const stageIndex = Math.min(3, Math.floor(progress * 4));
  const pinned = allowPin && reduce !== true;

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 768px)");
    const update = () => setAllowPin(!motion.matches && desktop.matches);
    update();
    motion.addEventListener("change", update);
    desktop.addEventListener("change", update);
    return () => {
      motion.removeEventListener("change", update);
      desktop.removeEventListener("change", update);
    };
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
        <h2 id="process-heading" className="hi-title">
          ÜRETİM SÜRECİ
        </h2>
        <CadFrame
          className="hi-process-scene mt-4 overflow-hidden bg-[color:var(--bc-panel)]"
          data-industrial-asset="production-tunnel"
        >
          <SlotImage
            src={industrialAssets.productionTunnel}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[center_58%]"
          />
          <div className="hi-scan-beam pointer-events-none absolute inset-y-0 left-[42%] z-10 w-px" />
          <div
            className="hi-vase pointer-events-none absolute bottom-[28%] left-[10%] z-10 h-[10%] w-[20%] border border-[color:var(--bc-cyan)]"
            aria-hidden="true"
          />
          <ol className="hi-process-overlay">
            {STAGES.map((item, index) => (
              <li
                key={item.id}
                data-process-step={item.id}
                data-active={index === stageIndex ? "true" : "false"}
                className={index === stageIndex ? "text-[color:var(--bc-orange)]" : ""}
              >
                <p className="hi-mono">{item.id}</p>
                <p className="hi-path-name mt-1 text-[1.05rem]">{item.title}</p>
              </li>
            ))}
          </ol>
        </CadFrame>
        <div className="hi-rail mt-3" aria-hidden="true">
          <span />
        </div>
      </div>
    </section>
  );
}
