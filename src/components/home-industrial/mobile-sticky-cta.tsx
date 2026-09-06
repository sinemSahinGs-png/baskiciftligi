"use client";

import type { Route } from "next";
import { useEffect, useState } from "react";

import { HomeTrackLink } from "@/components/home/home-track-link";

export function MobileStickyCta() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const finalCta = document.getElementById("basla");
    const footer = document.querySelector("footer");
    if (!finalCta) return;
    const observer = new IntersectionObserver(
      (entries) => {
        setHidden(entries.some((entry) => entry.isIntersecting));
      },
      { threshold: 0.12 },
    );
    observer.observe(finalCta);
    if (footer) observer.observe(footer);
    return () => observer.disconnect();
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
