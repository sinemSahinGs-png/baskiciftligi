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
  const [narrow, setNarrow] = useState(true);
  const [coarse, setCoarse] = useState(true);

  useEffect(() => {
    const coarseQuery = window.matchMedia("(pointer: coarse)");
    const narrowQuery = window.matchMedia("(max-width: 47.99rem)");
    const sync = () => {
      setCoarse(coarseQuery.matches);
      setNarrow(narrowQuery.matches);
    };
    sync();
    coarseQuery.addEventListener("change", sync);
    narrowQuery.addEventListener("change", sync);
    return () => {
      coarseQuery.removeEventListener("change", sync);
      narrowQuery.removeEventListener("change", sync);
    };
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
      allowPinned: ready && !reduced && !narrow,
      allowParallax: ready && !reduced && !coarse && !narrow,
    }),
    [ready, reduced, narrow, coarse],
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
