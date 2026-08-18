"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useReducedMotion } from "motion/react";

const emptySubscribe = () => () => undefined;

interface ScrollMotionValue {
  ready: boolean;
  reduced: boolean;
  allowPinned: boolean;
  allowParallax: boolean;
}

const ScrollMotionContext = createContext<ScrollMotionValue>({
  ready: false,
  reduced: true,
  allowPinned: false,
  allowParallax: false,
});

export function ScrollMotionProvider({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const reduced = !isClient || reduceMotion !== false;
  const [ready, setReady] = useState(false);
  const [compact, setCompact] = useState(true);

  useEffect(() => {
    const compactQuery = window.matchMedia(
      "(max-width: 63.99rem), (pointer: coarse)",
    );
    const sync = () => {
      setCompact(compactQuery.matches);
    };
    sync();
    compactQuery.addEventListener("change", sync);
    return () => compactQuery.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const frame = window.requestAnimationFrame(() => {
      root.classList.add("motion-ready");
      root.dataset.reducedMotion = reduced ? "true" : "false";
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [reduced]);

  const value = useMemo<ScrollMotionValue>(
    () => ({
      ready,
      reduced,
      allowPinned: ready && !reduced && !compact,
      allowParallax: ready && !reduced && !compact,
    }),
    [ready, reduced, compact],
  );

  return (
    <ScrollMotionContext.Provider value={value}>
      {children}
    </ScrollMotionContext.Provider>
  );
}

export function useScrollMotion() {
  return useContext(ScrollMotionContext);
}
