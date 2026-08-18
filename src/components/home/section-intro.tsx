"use client";

import type { Route } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { RevealCopy } from "@/components/motion/reveal-copy";
import { RevealHeading } from "@/components/motion/reveal-words";
import { cn } from "@/lib/utils";

export function SectionIntro({
  title,
  description,
  action,
  light = false,
}: {
  title: string;
  description: string;
  action?: { href: Route; label: string };
  light?: boolean;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
      <div className="max-w-[40rem]">
        <RevealHeading
          text={title}
          className={cn("section-title", light && "text-light-text")}
        />
        <RevealCopy
          text={description}
          className={cn("body-large stack-title", light && "text-light-text")}
        />
      </div>
      {action ? (
        <Link
          href={action.href}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"
        >
          {action.label}
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}
