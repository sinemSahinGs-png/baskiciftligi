"use client";

import { useEffect } from "react";

export function IndustrialHeaderEffects() {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.homeIndustrial = "";
    let last = window.scrollY;
    let compact = false;

    const update = () => {
      const y = window.scrollY;
      const goingDown = y > last;
      last = y;
      const next = y > 18 && goingDown;
      if (next !== compact) {
        compact = next;
        if (compact) root.dataset.headerCompact = "";
        else delete root.dataset.headerCompact;
      }
      if (y < 8) {
        compact = false;
        delete root.dataset.headerCompact;
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      delete root.dataset.homeIndustrial;
      delete root.dataset.headerCompact;
    };
  }, []);

  return null;
}
