"use client";

import { HERO_TYPEWRITER } from "@/components/home-industrial/hero-media";
import { useHeroTypewriter } from "@/hooks/use-hero-typewriter";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

export function HeroTypewriter({
  reducedMotion,
  restart,
  pauseRef,
}: {
  reducedMotion: boolean;
  restart: boolean;
  pauseRef: { current: boolean };
}) {
  const t = useTranslations("home");
  const examples = useMemo(
    () => [t("example1"), t("example2"), t("example3"), t("example4"), t("example5")],
    [t],
  );
  const typewriter = useHeroTypewriter({
    enabled: true,
    reducedMotion,
    pauseRef,
    delayMs: restart ? HERO_TYPEWRITER.restartDelay : HERO_TYPEWRITER.initialDelay,
    examples,
  });

  return (
    <span className="hi-hero-suggest" aria-hidden="true" data-hero-typewriter="">
      {typewriter.text}
      <span className="hi-hero-caret" data-complete={typewriter.complete ? "true" : "false"} />
    </span>
  );
}
