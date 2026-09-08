"use client";

import { useEffect, useState } from "react";

import { SafeImage } from "@/components/media/safe-image";
import { storePremiumAssets } from "@/components/storefront/store-premium-assets";
import { cn } from "@/lib/utils";

export function StoreEditorialArt() {
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <SafeImage
      src={
        desktop
          ? storePremiumAssets.editorialDesktop
          : storePremiumAssets.editorialMobile
      }
      alt=""
      fill
      sizes={desktop ? "(min-width: 768px) 48vw, 100vw" : "100vw"}
      fetchPriority="low"
      className={cn(
        "object-cover",
        desktop ? "object-[78%_48%]" : "object-[55%_42%]",
      )}
    />
  );
}
