"use client";

import { useMotionValueEvent, useScroll } from "motion/react";
import { useRef, useState, type ReactNode } from "react";

import { useScrollMotion } from "@/components/motion/scroll-motion-provider";
import { cn } from "@/lib/utils";

export function PinnedStory({
  children,
  className,
  heightClassName = "h-[160vh]",
}: {
  children: (progress: number) => ReactNode;
  className?: string;
  heightClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { allowPinned, reduced } = useScrollMotion();
  const pin = allowPinned && !reduced;
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const [progress, setProgress] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    if (!pin) {
      return;
    }
    const rounded = Math.round(value * 20) / 20;
    setProgress((current) => (current === rounded ? current : rounded));
  });

  const shown = pin ? progress : 1;

  return (
    <div
      ref={ref}
      className={cn(pin ? heightClassName : "static h-auto min-h-0", className)}
      data-scroll-progress={shown.toFixed(2)}
      data-pinned={pin ? "true" : "false"}
    >
      <div
        className={cn(
          pin ? "sticky top-24 h-[calc(100svh-6rem)]" : "static h-auto min-h-0",
        )}
      >
        {children(shown)}
      </div>
    </div>
  );
}
