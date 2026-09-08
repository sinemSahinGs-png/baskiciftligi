import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  compact?: boolean;
  inverted?: boolean;
}

const wordmarkParts = siteConfig.wordmark.split(" ");

export function Logo({ className, compact = false, inverted = false }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} ana sayfa`}
      className={cn(
        "group inline-flex min-h-11 max-w-[11.5rem] shrink-0 items-center gap-2 rounded-md sm:max-w-none sm:gap-2.5",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="relative size-8 overflow-hidden rounded-md sm:size-9"
      >
        <Image
          src={siteConfig.logo.src}
          alt=""
          width={72}
          height={72}
          quality={70}
          sizes="36px"
          className="size-full object-cover"
          priority
        />
      </span>
      <span
        className={cn(
          "font-heading leading-[0.92] font-extrabold tracking-[-0.05em]",
          inverted ? "text-light-text" : "text-ink",
          compact && "sr-only",
        )}
      >
        {wordmarkParts.map((part) => (
          <span
            key={part}
            className="block text-[1.05rem] sm:inline sm:text-[1.28rem]"
          >
            {part}
            <span className="hidden sm:inline"> </span>
          </span>
        ))}
      </span>
    </Link>
  );
}
