"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { domAnimation, LazyMotion, m, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  amount?: number;
}

const emptySubscribe = () => () => undefined;

export function Reveal({
  children,
  className,
  delay = 0,
  amount = 0.12,
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const shouldAnimate = isClient && reduceMotion === false;

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        initial={shouldAnimate ? { y: 18 } : false}
        whileInView={{ y: 0 }}
        viewport={{ once: true, amount, margin: "0px 0px -6% 0px" }}
        transition={
          shouldAnimate
            ? {
                duration: 0.6,
                delay,
                ease: [0.22, 1, 0.36, 1],
              }
            : { duration: 0 }
        }
        className={cn("opacity-100", className)}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
