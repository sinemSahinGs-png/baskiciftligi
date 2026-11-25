"use client";

import { createElement, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

function splitWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean);
}

type ScrollTag = "h2" | "h3" | "p" | "span";

export function ScrollWords({
  text,
  as = "span",
  className,
  id,
}: {
  text: string;
  as?: ScrollTag;
  className?: string;
  id?: string;
}) {
  const reduce = useReducedMotion() === true;
  const rootRef = useRef<HTMLElement>(null);
  const words = splitWords(text);
  const [shown, setShown] = useState(reduce ? words.length : 0);

  useEffect(() => {
    if (reduce) {
      setShown(words.length);
      return;
    }
    const root = rootRef.current;
    if (!root) return;
    const sync = () => {
      const box = root.getBoundingClientRect();
      const start = window.innerHeight * 0.9;
      const end = window.innerHeight * 0.48;
      const progress = Math.min(1, Math.max(0, (start - box.top) / Math.max(1, start - end)));
      setShown(Math.round(progress * words.length));
    };
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [reduce, words.length]);

  return createElement(
    as,
    { ref: rootRef, id, className },
    words.map((word, index) =>
      createElement(
        "span",
        {
          key: `${word}-${index}`,
          className: "octo-film-word",
          "data-on": shown > index ? "true" : "false",
        },
        word,
        index < words.length - 1 ? " " : "",
      ),
    ),
  );
}
