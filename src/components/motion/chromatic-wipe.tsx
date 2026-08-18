"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

import { useScrollMotion } from "@/components/motion/scroll-motion-provider";
import { cn } from "@/lib/utils";

const tones: Array<{ test: (path: string) => boolean; className: string }> = [
  { test: (path) => path.startsWith("/magaza"), className: "from-[#4054ff] via-[#7a42f4]" },
  { test: (path) => path.startsWith("/urun"), className: "from-[#7a42f4] via-[#ff6542]" },
  { test: (path) => path.startsWith("/hazir-modeller"), className: "from-[#7a42f4] via-[#30d5d2]" },
  { test: (path) => path.startsWith("/model-yukle"), className: "from-[#30d5d2] via-[#070713]" },
  { test: (path) => path.startsWith("/kurumsal"), className: "from-[#ff9238] via-[#171721]" },
];

export function ChromaticWipe() {
  const pathname = usePathname();
  const { reduced, ready } = useScrollMotion();
  const [initialPath] = useState(pathname);

  if (reduced || !ready || pathname === initialPath) {
    return null;
  }

  const tone =
    tones.find((item) => item.test(pathname))?.className ??
    "from-[#4054ff] via-[#7a42f4]";

  return (
    <div
      key={pathname}
      aria-hidden="true"
      className={cn(
        "motion-route-wipe pointer-events-none fixed inset-0 z-[60] bg-linear-to-br",
        tone,
      )}
    />
  );
}
