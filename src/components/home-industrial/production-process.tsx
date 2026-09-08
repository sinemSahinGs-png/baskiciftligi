"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

import { industrialAssets } from "@/components/home-industrial/industrial-slots";
import { SlotImage } from "@/components/home-industrial/slot-image";
import { CadFrame } from "@/components/home-industrial/technical-grid";
import { InteractiveMedia, WordReveal } from "@/components/motion/premium";

const STAGES = [
  { id: "01", title: "DİLİMLEME", copy: "Katmanlar ve baskı hazırlığı." },
  { id: "02", title: "ÜRETİM", copy: "Parça yazıcıda üretilir." },
  { id: "03", title: "KALİTE KONTROL", copy: "Form ve yüzey kontrolü." },
  { id: "04", title: "PAKETLEME", copy: "Koruyucu paket ve sevkiyat." },
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
    const node = ref.current;
    if (!node) return;
    let frame = 0;
    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const box = node.getBoundingClientRect();
        const span = Math.max(1, pinned ? box.height - window.innerHeight : box.height * 0.7);
        const raw = Math.min(1, Math.max(0, -box.top / span));
        node.style.setProperty("--process-progress", String(raw));
        const nextStage = Math.min(3, Math.floor(raw * 4));
        setProgress((current) => {
          const currentStage = Math.min(3, Math.floor(current * 4));
          return currentStage === nextStage ? current : raw;
        });
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
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
        <WordReveal as="h2" id="process-heading" className="hi-title" text="ÜRETİM SÜRECİ" />
        <InteractiveMedia>
          <CadFrame
            className="hi-process-scene mt-4 overflow-hidden bg-[color:var(--bc-panel)]"
            data-industrial-asset="production-tunnel"
          >
            <SlotImage
              src={industrialAssets.productionTunnel}
              alt="Üretim tüneli: yazıcı sırası ve baskı nesnesi"
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="hi-scan-beam pointer-events-none absolute inset-y-0 left-[42%] z-10 w-px" />
            <p className="hi-process-note hi-mono">
              {STAGES[stageIndex]?.id} · {STAGES[stageIndex]?.copy}
            </p>
            <ol className="hi-process-overlay">
              {STAGES.map((item, index) => (
                <li
                  key={item.id}
                  data-process-step={item.id}
                  data-active={index === stageIndex ? "true" : "false"}
                  data-complete={index < stageIndex ? "true" : "false"}
                  onClick={() => setProgress((index + 0.15) / 4)}
                >
                  <p className="hi-mono">{item.id}</p>
                  <p className="hi-path-name mt-1 text-[1.05rem]">{item.title}</p>
                  <p className="hi-process-step-copy">{item.copy}</p>
                </li>
              ))}
            </ol>
          </CadFrame>
        </InteractiveMedia>
        <div className="hi-rail mt-3" aria-hidden="true">
          <span />
        </div>
      </div>
    </section>
  );
}
