"use client";

import { useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";

import { useScrollMotion } from "@/components/motion/scroll-motion-provider";

export function useScrollProgress(offset?: [string, string]) {
  const ref = useRef<HTMLElement | null>(null);
  const { reduced, allowParallax } = useScrollMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: (offset ?? ["start end", "end start"]) as ["start end", "end start"],
  });

  return {
    ref,
    progress: scrollYProgress,
    enabled: !reduced && allowParallax,
  };
}

export function useParallax(
  progress: MotionValue<number>,
  distance = 36,
  enabled = true,
) {
  return useTransform(progress, [0, 1], enabled ? [distance * -0.35, distance] : [0, 0]);
}
