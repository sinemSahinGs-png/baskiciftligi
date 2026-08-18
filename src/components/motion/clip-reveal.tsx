"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";

import { useScrollMotion } from "@/components/motion/scroll-motion-provider";
import { useSafeInView } from "@/components/motion/use-safe-in-view";
import { cn } from "@/lib/utils";

type ClipVariant = "left" | "up" | "scale" | "grid";

export function ClipReveal({
  children,
  className,
  variant = "left",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  variant?: ClipVariant;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { ready, reduced } = useScrollMotion();
  const inView = useSafeInView(ref, { once: true, amount: 0.18 });
  const state = reduced || !ready ? "visible" : inView ? "visible" : "idle";

  return (
    <div
      ref={ref}
      className={cn("motion-clip", className)}
      data-clip={variant}
      data-motion-clip={state}
      style={{ "--motion-delay": `${delay}s` } as CSSProperties}
    >
      {children}
    </div>
  );
}
