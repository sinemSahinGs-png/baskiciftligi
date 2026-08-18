"use client";

import type { ReactNode } from "react";

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
  return (
    <section id={id} className={cn(atmosphere, className)} data-motion-state="visible">
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
