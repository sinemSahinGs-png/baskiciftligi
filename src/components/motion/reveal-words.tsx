"use client";

import { useRef, type CSSProperties, type ElementType } from "react";

import { useScrollMotion } from "@/components/motion/scroll-motion-provider";
import { useSafeInView } from "@/components/motion/use-safe-in-view";
import { motionStagger, splitMotionWords } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface RevealWordsProps {
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
  once?: boolean;
  id?: string;
}

export function RevealWords({
  text,
  as: Tag = "span",
  className,
  delay = 0,
  once = true,
  id,
}: RevealWordsProps) {
  const ref = useRef<HTMLElement | null>(null);
  const { ready, reduced } = useScrollMotion();
  const inView = useSafeInView(ref, { once, amount: 0.2 });
  const tokens = splitMotionWords(text);
  const state = reduced || !ready ? "visible" : inView ? "visible" : "idle";
  const wordNumbers = tokens.map((token, index) =>
    /^\s+$/.test(token)
      ? -1
      : tokens.slice(0, index).filter((item) => !/^\s+$/.test(item)).length,
  );

  return (
    <Tag
      ref={ref}
      id={id}
      className={cn("motion-heading", className)}
      data-motion-state={state}
      data-reduced-motion={reduced ? "true" : "false"}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {tokens.map((token, index) => {
          if (/^\s+$/.test(token)) {
            return <span key={`s-${index}`}>{token}</span>;
          }
          const current = wordNumbers[index] ?? 0;
          return (
            <span
              key={`w-${index}`}
              data-motion-word={state}
              className="motion-word"
              style={
                {
                  "--motion-delay": `${delay + current * motionStagger.word}s`,
                } as CSSProperties
              }
            >
              {token}
            </span>
          );
        })}
      </span>
    </Tag>
  );
}

export function RevealHeading({
  text,
  as = "h2",
  className,
  id,
}: Omit<RevealWordsProps, "as"> & { as?: "h1" | "h2" | "h3" }) {
  return <RevealWords text={text} as={as} className={className} id={id} />;
}
