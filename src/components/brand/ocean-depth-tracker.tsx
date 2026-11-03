"use client";

import { useEffect } from "react";

export function OceanDepthTracker() {
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const depth = Math.min(1, Math.max(0, window.scrollY / max));
      root.style.setProperty("--octo-depth", depth.toFixed(3));
      root.dataset.octoDepth = String(Math.round(depth * 6));
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      root.style.removeProperty("--octo-depth");
      delete root.dataset.octoDepth;
    };
  }, []);
  return null;
}
