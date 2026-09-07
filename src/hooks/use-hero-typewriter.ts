"use client";

import { useEffect, useRef, useState } from "react";

import {
  HERO_IDEA_EXAMPLES,
  HERO_TYPEWRITER,
  vary,
} from "@/components/home-industrial/hero-media";

export function useHeroTypewriter({
  enabled,
  reducedMotion,
  rng = Math.random,
  pauseRef,
  delayMs,
}: {
  enabled: boolean;
  reducedMotion: boolean;
  rng?: () => number;
  pauseRef?: { current: boolean };
  delayMs?: number;
}) {
  const [animatedText, setAnimatedText] = useState("");
  const [animatedComplete, setAnimatedComplete] = useState(false);
  const phraseIndex = useRef(0);
  const charIndex = useRef(0);
  const deleting = useRef(false);

  useEffect(() => {
    if (reducedMotion || !enabled) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const wait = (ms: number, next: () => void) => {
      const fire = () => {
        if (cancelled) return;
        if (document.visibilityState === "hidden" || pauseRef?.current) {
          timer = setTimeout(fire, 120);
          return;
        }
        next();
      };
      timer = setTimeout(fire, ms);
    };

    const tick = () => {
      if (cancelled) return;
      const phrase = HERO_IDEA_EXAMPLES[phraseIndex.current] ?? HERO_IDEA_EXAMPLES[0];
      if (!deleting.current) {
        const next = phrase.slice(0, charIndex.current);
        setAnimatedText(next);
        if (charIndex.current >= phrase.length) {
          setAnimatedComplete(true);
          wait(vary(HERO_TYPEWRITER.pauseCompleteMin, HERO_TYPEWRITER.pauseCompleteMax, rng), () => {
            deleting.current = true;
            tick();
          });
          return;
        }
        setAnimatedComplete(false);
        charIndex.current += 1;
        wait(vary(HERO_TYPEWRITER.typeMin, HERO_TYPEWRITER.typeMax, rng), tick);
        return;
      }

      charIndex.current = Math.max(0, charIndex.current - 1);
      setAnimatedText(phrase.slice(0, charIndex.current));
      setAnimatedComplete(false);
      if (charIndex.current === 0) {
        deleting.current = false;
        phraseIndex.current = (phraseIndex.current + 1) % HERO_IDEA_EXAMPLES.length;
        wait(vary(HERO_TYPEWRITER.pauseEmptyMin, HERO_TYPEWRITER.pauseEmptyMax, rng), tick);
        return;
      }
      wait(vary(HERO_TYPEWRITER.deleteMin, HERO_TYPEWRITER.deleteMax, rng), tick);
    };

    phraseIndex.current = 0;
    charIndex.current = 0;
    deleting.current = false;
    wait(delayMs ?? HERO_TYPEWRITER.initialDelay, () => {
      charIndex.current = 1;
      setAnimatedText(HERO_IDEA_EXAMPLES[0].slice(0, 1));
      setAnimatedComplete(false);
      wait(vary(HERO_TYPEWRITER.typeMin, HERO_TYPEWRITER.typeMax, rng), tick);
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [delayMs, enabled, pauseRef, reducedMotion, rng]);

  return {
    text: reducedMotion ? HERO_IDEA_EXAMPLES[0] : enabled ? animatedText : "",
    complete: reducedMotion ? true : enabled ? animatedComplete : false,
    showOverlay: enabled,
  };
}
