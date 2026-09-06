"use client";

import { useEffect } from "react";

export type HomeScrollTheme = "mono" | "orange" | "inverse" | "cyan-scan";

export function ScrollThemeProvider() {
  useEffect(() => {
    const nodes = [...document.querySelectorAll<HTMLElement>("[data-home-theme]")];
    if (nodes.length === 0) return;

    const update = () => {
      const vh = window.innerHeight;
      for (const node of nodes) {
        const box = node.getBoundingClientRect();
        const visible = Math.min(box.bottom, vh) - Math.max(box.top, 0);
        const ratio = Math.max(0, Math.min(1, visible / Math.max(1, Math.min(box.height, vh * 0.92))));
        const fill =
          node.dataset.homeTheme === "orange"
            ? Math.max(85, Math.round(ratio * 100))
            : 0;
        node.style.setProperty("--hi-fill", `${fill}%`);
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return null;
}
