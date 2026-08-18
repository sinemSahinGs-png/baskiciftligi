"use client";

import { useRef, type ReactNode } from "react";

import { useScrollMotion } from "@/components/motion/scroll-motion-provider";
import { useSafeInView } from "@/components/motion/use-safe-in-view";
import { cn } from "@/lib/utils";

export function ScrollSection({
  children,
  className,
  atmosphere,
  id,
}: {
  children: ReactNode;
  className?: string;
  atmosphere?: string;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const { ready, reduced } = useScrollMotion();
  const inView = useSafeInView(ref, { once: true, amount: 0.12 });
  const state = reduced || !ready ? "visible" : inView ? "visible" : "idle";

  return (
    <section
      ref={ref}
      id={id}
      className={cn(atmosphere, className)}
      data-motion-state={state}
    >
      {children}
    </section>
  );
}

export function SectionAtmosphere({
  className,
  tone = "cobalt",
}: {
  className?: string;
  tone?: "cobalt" | "violet" | "coral" | "carbon" | "cyan";
}) {
  return (
    <div
      aria-hidden="true"
      data-atmosphere-tone={tone}
      className={cn("motion-atmosphere pointer-events-none absolute inset-0", className)}
    />
  );
}
