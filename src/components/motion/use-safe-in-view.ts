"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

import { motionViewport } from "@/lib/motion";
import { useScrollMotion } from "@/components/motion/scroll-motion-provider";

function isInInitialViewport(node: Element) {
  const rect = node.getBoundingClientRect();
  return rect.bottom > 12 && rect.top < window.innerHeight * 0.88;
}

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
  const latched = useRef(false);
  const once = options?.once ?? true;
  const amount = options?.amount ?? motionViewport.amount;
  const margin = options?.margin ?? motionViewport.margin;
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    const node = ref.current;
    if (!enabled || reduced || !ready || !node || latched.current) {
      return;
    }
    if (typeof IntersectionObserver === "undefined" || isInInitialViewport(node)) {
      const frame = window.requestAnimationFrame(() => {
        latched.current = true;
        setObserved(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          latched.current = true;
          setObserved(true);
          if (once) {
            observer.disconnect();
          }
        }
      },
      { threshold: amount, rootMargin: margin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [amount, enabled, margin, once, ready, reduced, ref]);

  if (!enabled || reduced || !ready) {
    return true;
  }

  return observed;
}

export function motionState(visible: boolean, reduced: boolean, ready: boolean) {
  return reduced || !ready || visible ? "visible" : "idle";
}
