"use client";

import { HERO_TYPEWRITER } from "@/components/home-industrial/hero-media";
import { useHeroTypewriter } from "@/hooks/use-hero-typewriter";

export function HeroTypewriter({
  reducedMotion,
  restart,
  pauseRef,
}: {
  reducedMotion: boolean;
  restart: boolean;
  pauseRef: { current: boolean };
}) {
  const typewriter = useHeroTypewriter({
    enabled: true,
    reducedMotion,
    pauseRef,
    delayMs: restart ? HERO_TYPEWRITER.restartDelay : HERO_TYPEWRITER.initialDelay,
  });

  return (
    <span className="hi-hero-suggest" aria-hidden="true" data-hero-typewriter="">
      {typewriter.text}
      <span className="hi-hero-caret" data-complete={typewriter.complete ? "true" : "false"} />
    </span>
  );
}
