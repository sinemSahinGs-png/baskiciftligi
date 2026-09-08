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
      const delta = y - last;
      last = y;
      if (y > 12) root.dataset.headerScrolled = "";
      else delete root.dataset.headerScrolled;

      if (y < 8) {
        compact = false;
      } else if (delta > 6 && y > 28) {
        compact = true;
      } else if (delta < -6) {
        compact = false;
      }

      if (compact) root.dataset.headerCompact = "";
      else delete root.dataset.headerCompact;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      delete root.dataset.homeIndustrial;
      delete root.dataset.headerCompact;
      delete root.dataset.headerScrolled;
    };
  }, []);

  return null;
}
