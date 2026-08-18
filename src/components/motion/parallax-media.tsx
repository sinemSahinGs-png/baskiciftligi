"use client";

import { m, useScroll, useTransform } from "motion/react";
import { type ReactNode, useRef } from "react";

import { useScrollMotion } from "@/components/motion/scroll-motion-provider";
import { cn } from "@/lib/utils";

export function ParallaxMedia({
  children,
  className,
  distance = 28,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { allowParallax, reduced } = useScrollMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    allowParallax && !reduced ? [distance * -0.4, distance] : [0, 0],
  );

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <m.div style={{ y }} className="will-change-transform">
        {children}
      </m.div>
    </div>
  );
}

export function GridDrift({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { allowParallax, reduced } = useScrollMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    allowParallax && !reduced ? [0, 48] : [0, 0],
  );

  return (
    <m.div
      ref={ref}
      aria-hidden="true"
      style={{ y }}
      className={cn("pointer-events-none absolute inset-0", className)}
    >
      {children}
    </m.div>
  );
}
