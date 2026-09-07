"use client";

import { WordReveal } from "@/components/motion/premium";

export function StoreHeroTitle({ title }: { title: string }) {
  return <WordReveal as="h1" className="store-intro-title mt-2" text={title} />;
}
