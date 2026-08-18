"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";

import { useScrollMotion } from "@/components/motion/scroll-motion-provider";
import { useSafeInView } from "@/components/motion/use-safe-in-view";
import { splitMotionLines } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function RevealCopy({
  text,
  className,
  delay = 0.08,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { ready, reduced } = useScrollMotion();
  const inView = useSafeInView(ref, { once: true, amount: 0.18 });
  const lines = splitMotionLines(text);
  const state = reduced || !ready ? "visible" : inView ? "visible" : "idle";

  return (
    <p ref={ref} className={cn(className)} data-motion-state={state}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="flex flex-col gap-1">
        {lines.map((line, index) => (
          <span
            key={line}
            data-motion-line={state}
            className="motion-line"
            style={
              {
                "--motion-delay": `${delay + index * 0.09}s`,
              } as CSSProperties
            }
          >
            {line}
          </span>
        ))}
      </span>
    </p>
  );
}

export function RevealBlock({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { ready, reduced } = useScrollMotion();
  const inView = useSafeInView(ref, { once: true, amount: 0.16 });
  const state = reduced || !ready ? "visible" : inView ? "visible" : "idle";

  return (
    <div
      ref={ref}
      className={cn(className)}
      data-motion-item={state}
      data-motion-state={state}
      style={{ "--motion-delay": `${delay}s` } as CSSProperties}
    >
      {children}
    </div>
  );
}
