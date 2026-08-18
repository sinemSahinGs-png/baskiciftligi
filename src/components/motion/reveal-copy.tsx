import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function RevealCopy({
  text,
  className,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  return (
    <p className={cn(className)} data-motion-state="visible" data-motion-copy="visible">
      {text}
    </p>
  );
}

export function RevealBlock({
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
      data-motion-item="visible"
      data-motion-state="visible"
    >
      {children}
    </div>
  );
}
