"use client";

import { useEffect } from "react";

export type HomeScrollTheme = "mono" | "orange" | "inverse" | "cyan-scan";

export function ScrollThemeProvider() {
  useEffect(() => {
    const nodes = [...document.querySelectorAll<HTMLElement>("[data-home-theme]")];
    const world = document.querySelector<HTMLElement>(".octo-world");
    const path = document.querySelector<SVGPathElement>(".octo-journey-stroke");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let pathLength = 0;
    if (path) {
      try {
        pathLength = path.getTotalLength();
        path.style.strokeDasharray = String(pathLength);
        path.style.strokeDashoffset = reduce ? "0" : String(pathLength);
      } catch {
        pathLength = 0;
      }
    }

    let frame = 0;
    const update = () => {
      const vh = window.innerHeight;
      const max = Math.max(1, document.documentElement.scrollHeight - vh);
      const progress = Math.max(0, Math.min(1, window.scrollY / max));
      if (world) {
        world.style.setProperty("--octo-depth", progress.toFixed(4));
        world.style.setProperty(
          "--octo-handoff-shift",
          `${Math.round((progress - 0.08) * 36)}px`,
        );
      }
      if (path && pathLength && !reduce) {
        path.style.strokeDashoffset = String(pathLength * (1 - progress));
      }
      for (const node of nodes) {
        const box = node.getBoundingClientRect();
        const visible = Math.min(box.bottom, vh) - Math.max(box.top, 0);
        const ratio = Math.max(
          0,
          Math.min(1, visible / Math.max(1, Math.min(box.height, vh * 0.92))),
        );
        const theme = node.dataset.homeTheme;
        const fill =
          theme === "orange" || theme === "inverse"
            ? Math.max(18, Math.round(ratio * 100))
            : 0;
        node.style.setProperty("--hi-fill", `${fill}%`);
        if (theme === "orange" || theme === "inverse") {
          node.dataset.hiContrast = fill >= 42 ? "dark" : "light";
        }
      }
    };

    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return null;
}
