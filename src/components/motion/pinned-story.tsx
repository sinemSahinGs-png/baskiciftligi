"use client";

import { useMotionValueEvent, useScroll } from "motion/react";
import { useRef, useState, type ReactNode } from "react";

import { useScrollMotion } from "@/components/motion/scroll-motion-provider";
import { cn } from "@/lib/utils";

export function PinnedStory({
  children,
  className,
  heightClassName = "lg:h-[180vh]",
}: {
  children: (progress: number) => ReactNode;
  className?: string;
  heightClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { allowPinned, reduced } = useScrollMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const [progress, setProgress] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    setProgress(value);
  });

  return (
    <div
      ref={ref}
      className={cn(allowPinned && !reduced ? heightClassName : undefined, className)}
      data-scroll-progress={progress.toFixed(2)}
    >
      <div
        className={cn(
          allowPinned && !reduced && "lg:sticky lg:top-24 lg:h-[calc(100svh-6rem)]",
        )}
      >
        {children(reduced || !allowPinned ? 1 : progress)}
      </div>
    </div>
  );
}
