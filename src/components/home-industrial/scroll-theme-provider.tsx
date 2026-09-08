"use client";

import { useEffect } from "react";

export type HomeScrollTheme = "mono" | "orange" | "inverse" | "cyan-scan";

export function ScrollThemeProvider() {
  useEffect(() => {
    const nodes = [...document.querySelectorAll<HTMLElement>("[data-home-theme]")];
    if (nodes.length === 0) return;

    let frame = 0;
    const update = () => {
      const vh = window.innerHeight;
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
