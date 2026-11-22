"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function isLilDiscPath(pathname: string | null) {
  return pathname === "/kategori/lil-disc";
}

export function HideOnLilDisc({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (isLilDiscPath(pathname)) return null;
  return children;
}
