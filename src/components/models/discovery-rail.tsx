"use client";

import {
  Flower2,
  Gamepad2,
  KeyRound,
  LayoutGrid,
  Monitor,
  Smartphone,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const DISCOVERY_ITEMS: Array<{ term: string; icon: LucideIcon }> = [
  { term: "Vazo", icon: Flower2 },
  { term: "Telefon standı", icon: Smartphone },
  { term: "Figür", icon: Sparkles },
  { term: "Saksı", icon: Flower2 },
  { term: "Masaüstü düzenleyici", icon: LayoutGrid },
  { term: "Duvar dekoru", icon: Monitor },
  { term: "Anahtarlık", icon: KeyRound },
  { term: "Oyun aksesuarı", icon: Gamepad2 },
];

export function DiscoveryRail({ onSelect }: { onSelect: (term: string) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reducedMotion || paused) return;
    const track = trackRef.current;
    if (!track) return;

    let offset = 0;
    let raf = 0;

    function step() {
      if (document.visibilityState !== "visible") {
        raf = requestAnimationFrame(step);
        return;
      }
      offset += 0.18;
      const half = track!.scrollWidth / 2;
      if (half > 0 && offset >= half) offset = 0;
      track!.style.transform = `translateX(-${offset}px)`;
      raf = requestAnimationFrame(step);
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion, paused]);

  const items = reducedMotion ? DISCOVERY_ITEMS : [...DISCOVERY_ITEMS, ...DISCOVERY_ITEMS];

  return (
    <section
      className="mx-auto mt-6 w-full max-w-[72rem] px-4 sm:mt-8"
      aria-label="Şu anda keşfedilenler"
    >
      <p className="text-center text-sm font-medium text-muted-light">
        Şu anda keşfedilenler
      </p>
      <div
        ref={scrollerRef}
        className={cn(
          "relative mt-3",
          reducedMotion && "overflow-x-auto overscroll-x-contain",
        )}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-carbon to-transparent sm:w-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-carbon to-transparent sm:w-10" />
        <div
          className={cn(
            "overflow-hidden",
            reducedMotion && "overflow-x-auto px-1",
          )}
        >
          <div
            ref={trackRef}
            className={cn(
              "flex w-max gap-2.5 px-2 pb-1",
              reducedMotion && "w-auto",
            )}
            role="list"
          >
            {items.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={`${item.term}-${index}`}
                  type="button"
                  role="listitem"
                  data-discovery-pill=""
                  onClick={() => onSelect(item.term.toLocaleLowerCase("tr-TR"))}
                  className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 text-sm text-light-text backdrop-blur-sm transition hover:border-coral/30 hover:bg-coral/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/60"
                >
                  <Icon aria-hidden="true" className="size-3.5 text-coral/80" />
                  {item.term}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export { DISCOVERY_ITEMS };
