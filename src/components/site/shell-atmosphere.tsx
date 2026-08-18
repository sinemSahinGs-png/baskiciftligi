"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function ShellAtmosphere({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const atmosphere =
    pathname === "/"
      ? "cinematic"
      : pathname.startsWith("/hazir-modeller")
        ? "violet"
        : pathname.startsWith("/model-yukle")
          ? "cockpit"
          : pathname.startsWith("/kurumsal")
            ? "foundry"
            : "porcelain";

  return (
    <div
      data-atmosphere={atmosphere}
      className={cn(
        "flex min-h-screen flex-col",
        atmosphere === "cinematic" && "bg-midnight text-light-text",
        atmosphere === "porcelain" && "bg-porcelain text-dark-text",
        atmosphere === "violet" && "atmosphere-violet",
        atmosphere === "cockpit" && "bg-midnight text-light-text",
        atmosphere === "foundry" && "atmosphere-foundry",
      )}
    >
      {children}
    </div>
  );
}
