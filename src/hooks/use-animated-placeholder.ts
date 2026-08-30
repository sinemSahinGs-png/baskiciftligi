"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const DEFAULT_PHRASES = [
  "vazo",
  "telefon standı",
  "figür",
  "masaüstü düzenleyici",
  "kişiye özel tasarım",
] as const;

function randomBetween(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function useAnimatedPlaceholder({
  phrases = DEFAULT_PHRASES,
  staticPlaceholder = "Model ara…",
  enabled = true,
  isFocused,
  hasValue,
}: {
  phrases?: readonly string[];
  staticPlaceholder?: string;
  enabled?: boolean;
  isFocused: boolean;
  hasValue: boolean;
}) {
  const reducedMotion = useReducedMotion() ?? false;
  const [animatedText, setAnimatedText] = useState("");
  const phraseIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const deletingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageVisibleRef = useRef(true);

  useEffect(() => {
    function onVisibility() {
      pageVisibleRef.current = document.visibilityState === "visible";
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const shouldAnimate =
      enabled && !reducedMotion && !isFocused && !hasValue && pageVisibleRef.current;

    if (!shouldAnimate) {
      return;
    }

    function schedule(next: () => void, delay: number) {
      timerRef.current = setTimeout(() => {
        if (!pageVisibleRef.current || isFocused || hasValue) return;
        next();
      }, delay);
    }

    function tick() {
      const phrase = phrases[phraseIndexRef.current] ?? phrases[0] ?? "";
      const deleting = deletingRef.current;

      if (!deleting && charIndexRef.current <= phrase.length) {
        setAnimatedText(phrase.slice(0, charIndexRef.current));
        if (charIndexRef.current === phrase.length) {
          schedule(() => {
            deletingRef.current = true;
            tick();
          }, randomBetween(1200, 1600));
          return;
        }
        charIndexRef.current += 1;
        schedule(tick, randomBetween(70, 110));
        return;
      }

      if (deleting && charIndexRef.current >= 0) {
        setAnimatedText(phrase.slice(0, charIndexRef.current));
        if (charIndexRef.current === 0) {
          deletingRef.current = false;
          phraseIndexRef.current = (phraseIndexRef.current + 1) % phrases.length;
          schedule(tick, 300);
          return;
        }
        charIndexRef.current -= 1;
        schedule(tick, randomBetween(40, 65));
      }
    }

    tick();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, reducedMotion, isFocused, hasValue, phrases]);

  const showAnimation = enabled && !reducedMotion && !isFocused && !hasValue;

  return {
    placeholder: staticPlaceholder,
    animatedText: showAnimation ? animatedText : "",
    showCaret: showAnimation,
    reducedMotion,
  };
}

export { DEFAULT_PHRASES };
