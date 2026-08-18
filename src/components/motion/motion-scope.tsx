"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { useScrollMotion } from "@/components/motion/scroll-motion-provider";
import { useSafeInView } from "@/components/motion/use-safe-in-view";
import { motionViewport } from "@/lib/motion";

export function MotionScope({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { ready, reduced } = useScrollMotion();
  const inView = useSafeInView(ref, { once: true, amount: 0.12 });

  useEffect(() => {
    const root = ref.current;
    if (!root) {
      return;
    }
    const visible = reduced || !ready ? true : inView;
    const state = visible ? "visible" : "idle";
    for (const item of root.querySelectorAll<HTMLElement>("[data-motion-item]")) {
      item.dataset.motionItem = state;
    }
    for (const item of root.querySelectorAll<HTMLElement>("[data-motion-line]")) {
      item.dataset.motionLine = state;
    }
  }, [inView, ready, reduced]);

  useEffect(() => {
    const root = ref.current;
    if (!root || reduced || !ready) {
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      return;
    }
    const extras = [...root.querySelectorAll<HTMLElement>("[data-motion-item],[data-motion-line]")];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }
          const target = entry.target as HTMLElement;
          if (target.dataset.motionItem) {
            target.dataset.motionItem = "visible";
          }
          if (target.dataset.motionLine) {
            target.dataset.motionLine = "visible";
          }
          observer.unobserve(target);
        }
      },
      { threshold: motionViewport.amount, rootMargin: motionViewport.margin },
    );
    extras.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [ready, reduced]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
