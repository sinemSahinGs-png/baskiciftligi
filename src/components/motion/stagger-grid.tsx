import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function StaggerGrid({
  children,
  className,
  as: Tag = "div",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "ul" | "ol";
  delay?: number;
} & Record<string, unknown>) {
  return (
    <Tag
      {...rest}
      className={cn(className)}
      data-card-stagger=""
      data-motion-state="visible"
    >
      {children}
    </Tag>
  );
}

export function StaggerItem({
  children,
  className,
  as: Tag = "div",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  index?: number;
  as?: "div" | "li" | "article" | "figure";
} & Record<string, unknown>) {
  return (
    <Tag
      {...rest}
      className={cn(className)}
      data-motion-item="visible"
      data-motion-state="visible"
    >
      {children}
    </Tag>
  );
}
