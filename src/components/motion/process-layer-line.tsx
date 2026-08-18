"use client";

import { m } from "motion/react";
import { useRef } from "react";

import { useScrollMotion } from "@/components/motion/scroll-motion-provider";
import { useSafeInView } from "@/components/motion/use-safe-in-view";
import { foundryEase } from "@/lib/motion";

export function ProcessLayerLine({
  progress,
}: {
  progress?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const { reduced } = useScrollMotion();
  const inView = useSafeInView(ref, { once: true, amount: 0.2 });
  const amount =
    typeof progress === "number" ? progress : reduced || inView ? 1 : 0;

  return (
    <>
      <svg
        ref={ref}
        aria-hidden="true"
        viewBox="0 0 100 2"
        preserveAspectRatio="none"
        className="absolute top-[1.15rem] right-[8%] left-[8%] hidden h-px overflow-visible text-cyan/55 md:block"
      >
        <m.line
          x1="0"
          y1="1"
          x2="100"
          y2="1"
          stroke="currentColor"
          strokeWidth="1.25"
          vectorEffect="non-scaling-stroke"
          initial={false}
          animate={{ pathLength: amount }}
          transition={{ duration: 0.45, ease: foundryEase }}
        />
      </svg>
      <span
        aria-hidden="true"
        className="absolute top-3 bottom-8 left-1 w-px origin-top bg-cyan/40 md:hidden"
        style={{
          transform: `scaleY(${Math.max(0.12, amount)})`,
          transition: reduced
            ? "none"
            : "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
    </>
  );
}
