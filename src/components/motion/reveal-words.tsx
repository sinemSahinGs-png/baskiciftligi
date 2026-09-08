"use client";

import { WordReveal } from "@/components/motion/premium";

interface RevealWordsProps {
  text: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  className?: string;
  delay?: number;
  once?: boolean;
  id?: string;
}

export function RevealWords({
  text,
  as: Tag = "span",
  className,
  id,
}: RevealWordsProps) {
  return <WordReveal text={text} as={Tag} className={className} id={id} />;
}

export function RevealHeading({
  text,
  as = "h2",
  className,
  id,
}: Omit<RevealWordsProps, "as"> & { as?: "h1" | "h2" | "h3" }) {
  return <WordReveal text={text} as={as} className={className} id={id} />;
}
