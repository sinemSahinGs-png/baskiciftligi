"use client";

import { useEffect, useState, type RefObject } from "react";

import { motionViewport } from "@/lib/motion";
import { useScrollMotion } from "@/components/motion/scroll-motion-provider";

export function useSafeInView<T extends Element>(
  ref: RefObject<T | null>,
  options?: {
    once?: boolean;
    amount?: number;
    margin?: string;
    enabled?: boolean;
  },
) {
  const { ready, reduced } = useScrollMotion();
  const [observed, setObserved] = useState(false);
  const once = options?.once ?? true;
  const amount = options?.amount ?? motionViewport.amount;
  const margin = options?.margin ?? motionViewport.margin;
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    const node = ref.current;
    if (!enabled || reduced || !ready || !node) {
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      const timer = window.setTimeout(() => setObserved(true), 0);
      return () => window.clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setObserved(true);
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setObserved(false);
        }
      },
      { threshold: amount, rootMargin: margin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [amount, enabled, margin, once, ready, reduced, ref]);

  return !enabled || reduced || observed;
}
