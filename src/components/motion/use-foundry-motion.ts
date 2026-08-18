"use client";

import { useScrollMotion } from "@/components/motion/scroll-motion-provider";

export function useFoundryMotion() {
  const { reduced, allowParallax, allowPinned } = useScrollMotion();
  return {
    reduced,
    allowRich: allowParallax,
    allowPinned,
    coarse: !allowParallax && !reduced,
    narrow: !allowPinned && !reduced,
  };
}
