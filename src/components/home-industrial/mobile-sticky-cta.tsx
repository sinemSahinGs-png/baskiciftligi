"use client";

import type { Route } from "next";
import { useEffect, useState } from "react";

import { HomeTrackLink } from "@/components/home/home-track-link";

function intersecting(node: Element | null, threshold: number) {
  if (!node) return false;
  const box = node.getBoundingClientRect();
  const visible = Math.min(box.bottom, window.innerHeight) - Math.max(box.top, 0);
  return visible / Math.max(box.height, 1) >= threshold;
}

export function MobileStickyCta() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const update = () => {
      const hero = document.getElementById("ne-uretmek-istiyorsun");
      const paths = document.getElementById("uc-uretim-yolu");
      const finalCta = document.getElementById("basla");
      const footer = document.querySelector("footer");
      const catsHeading = document.getElementById("home-cats-heading");
      const archiveHeading = document.getElementById("archive-heading");
      const archiveLede = document.querySelector("#sana-gore-hazir-modeller .hi-lede");
      const stickyTop = window.innerHeight - 104;
      const overlapsSticky = (node: Element | null) => {
        if (!node) return false;
        const box = node.getBoundingClientRect();
        return box.bottom > stickyTop && box.top < window.innerHeight;
      };
      const categoryCopyOverlaps = [...document.querySelectorAll(".hi-cat-copy")].some((node) =>
        overlapsSticky(node),
      );
      setHidden(
        intersecting(hero, 0.08) ||
          intersecting(paths, 0.4) ||
          intersecting(finalCta, 0.12) ||
          intersecting(footer, 0.12) ||
          overlapsSticky(catsHeading) ||
          overlapsSticky(archiveHeading) ||
          overlapsSticky(archiveLede) ||
          categoryCopyOverlaps,
      );
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <HomeTrackLink
      event="upload_cta_clicked"
      href={"/model-yukle" as Route}
      data-hidden={hidden ? "true" : "false"}
      className="hi-sticky-cta hi-btn md:hidden"
    >
      Modelini yükle →
    </HomeTrackLink>
  );
}
