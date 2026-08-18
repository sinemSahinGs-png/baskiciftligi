import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function MediaReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn(className)}
      data-motion-media="visible"
      data-motion-state="visible"
    >
      {children}
    </div>
  );
}
