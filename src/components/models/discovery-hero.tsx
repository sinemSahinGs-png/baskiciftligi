"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { useAnimatedPlaceholder } from "@/hooks/use-animated-placeholder";
import { cn } from "@/lib/utils";

export function DiscoveryHero({
  query,
  onQueryChange,
  onSubmit,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const { animatedText, showCaret, reducedMotion } = useAnimatedPlaceholder({
    isFocused: focused,
    hasValue: query.length > 0,
  });

  return (
    <header className="mx-auto w-full max-w-[72rem] px-1 pt-4 text-center sm:pt-5 md:pt-6">
      <p className="eyebrow text-xs sm:text-sm">Hazır modeller</p>
      <h1 className="mt-2 font-heading text-[clamp(1.75rem,7vw,2.125rem)] font-bold leading-[1.15] tracking-[-0.03em] sm:text-4xl lg:text-[2.65rem]">
        Ne üretmek istiyorsun?
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[color:var(--store-muted-dark)] sm:text-base">
        Binlerce model arasından seç, baskı seçeneklerini belirle, teklifini al.
      </p>

      <form
        className="relative mx-auto mt-4 max-h-[320px] max-w-2xl sm:mt-5"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 -inset-y-3 rounded-full bg-coral/[0.08] blur-3xl sm:inset-x-8 sm:-inset-y-4"
        />
        <label className="relative block">
          <span className="sr-only">Model ara</span>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[color:var(--store-muted-dark)]"
            />
            <input
              data-model-search-input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={reducedMotion ? "Vazo, telefon standı, figür…" : " "}
              className={cn(
                "h-[3.375rem] w-full border border-[color:var(--store-line-dark)] bg-white pr-[6.75rem] pl-11 text-base text-[color:var(--store-text-dark)] outline-none placeholder:text-[color:var(--store-muted-dark)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--store-orange)] sm:h-14 sm:pl-12 sm:pr-36",
              )}
              autoComplete="off"
              enterKeyHint="search"
            />
            {!query && !focused && !reducedMotion ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-11 flex w-[calc(100%-8.5rem)] -translate-y-1/2 items-center truncate text-base text-[color:var(--store-muted-dark)] sm:left-12 sm:w-[calc(100%-10rem)]"
              >
                {animatedText}
                {showCaret ? (
                  <span className="ml-px inline-block h-[1.1em] w-px animate-pulse bg-muted-light" />
                ) : null}
              </span>
            ) : null}
            <button
              type="submit"
              className="absolute top-1/2 right-2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center gap-1.5 bg-[color:var(--store-orange)] px-3.5 text-sm font-semibold text-[color:var(--store-black)] transition hover:opacity-90 sm:px-5"
            >
              <Search aria-hidden="true" className="size-4 sm:hidden" />
              <span className="hidden sm:inline">Model Bul</span>
              <span className="sm:hidden">Ara</span>
            </button>
          </div>
        </label>
      </form>
    </header>
  );
}
