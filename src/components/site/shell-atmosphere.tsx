"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function ShellAtmosphere({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const atmosphere =
    pathname === "/"
      ? "cinematic"
      : pathname.startsWith("/model-yukle")
        ? "cockpit"
        : pathname.startsWith("/kurumsal")
          ? "foundry"
          : "porcelain";

  return (
    <div
      data-atmosphere={atmosphere}
      data-storefront={atmosphere === "cinematic" ? undefined : ""}
      className={cn(
        "flex min-h-screen flex-col",
        atmosphere === "cinematic" && "bg-[color:var(--octo-abyss)] text-light-text",
        atmosphere === "porcelain" && "bg-[color:var(--octo-navy)] text-light-text",
        atmosphere === "cockpit" && "bg-[color:var(--octo-abyss)] text-light-text",
        atmosphere === "foundry" && "atmosphere-foundry",
      )}
    >
      {children}
    </div>
  );
}
