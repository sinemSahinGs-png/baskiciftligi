"use client";

import type { ReactNode } from "react";

import { RevealCopy } from "@/components/motion/reveal-copy";
import { RevealHeading } from "@/components/motion/reveal-words";
import { cn } from "@/lib/utils";

export function PageMasthead({
  eyebrow,
  title,
  description,
  children,
  className,
  titleClassName = "display-title stack-title",
  descriptionClassName = "stack-body max-w-xl text-base leading-7",
  as = "h1",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div className={cn(className)}>
      {eyebrow ? (
        <p className="eyebrow" data-motion-line="visible">
          <span className="motion-line">{eyebrow}</span>
        </p>
      ) : null}
      <RevealHeading as={as} text={title} className={titleClassName} />
      {description ? (
        <RevealCopy text={description} className={descriptionClassName} />
      ) : null}
      {children}
    </div>
  );
}
