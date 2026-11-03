import Link from "next/link";

import { OctoMark } from "@/components/brand/octo-mark";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  compact?: boolean;
  inverted?: boolean;
}

export function Logo({ className, compact = false, inverted = true }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} ana sayfa`}
      className={cn(
        "group inline-flex min-h-11 max-w-[12.5rem] shrink-0 items-center gap-2 rounded-md sm:max-w-none sm:gap-2.5",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "relative grid size-8 place-items-center rounded-full border border-white/20 sm:size-9",
          inverted ? "text-light-text" : "text-ink",
        )}
      >
        <OctoMark className="size-6 sm:size-7" />
      </span>
      <span
        className={cn(
          "font-heading leading-[0.9] font-semibold tracking-[0.08em] uppercase",
          inverted ? "text-light-text" : "text-ink",
          compact && "sr-only",
        )}
      >
        <span className="block text-[0.95rem] sm:inline sm:text-[1.15rem]">OCTO</span>
        <span className="hidden sm:inline"> </span>
        <span className="block text-[0.95rem] text-[color:var(--octo-bio)] sm:inline sm:text-[1.15rem]">
          STUDIO
        </span>
      </span>
    </Link>
  );
}
