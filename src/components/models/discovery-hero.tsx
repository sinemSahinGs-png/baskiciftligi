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
    <header className="mx-auto w-full max-w-[72rem] text-center">
      <p className="eyebrow">Hazır modeller</p>
      <h1 className="mt-2 font-heading text-3xl font-bold tracking-[-0.03em] sm:text-4xl lg:text-[2.65rem]">
        Ne üretmek istiyorsun?
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-light sm:text-base">
        Binlerce model arasından seç, baskı seçeneklerini belirle, teklifini al.
      </p>

      <form
        className="relative mx-auto mt-8 max-w-2xl"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 -inset-y-4 rounded-full bg-coral/[0.07] blur-3xl"
        />
        <label className="relative block">
          <span className="sr-only">Model ara</span>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-light sm:left-5"
            />
            <input
              data-model-search-input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={reducedMotion ? "Vazo, telefon standı, figür…" : " "}
              className={cn(
                "h-14 w-full rounded-2xl border border-white/12 bg-white/[0.05] pr-[7.5rem] pl-12 text-base text-light-text shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] outline-none transition-shadow placeholder:text-transparent focus-visible:border-coral/40 focus-visible:ring-2 focus-visible:ring-coral/50 sm:h-[3.75rem] sm:pl-14 sm:pr-36",
              )}
              autoComplete="off"
              enterKeyHint="search"
            />
            {!query && !focused && !reducedMotion ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-12 flex max-w-[calc(100%-9rem)] -translate-y-1/2 items-center truncate text-base text-muted-light sm:left-14"
              >
                {animatedText}
                {showCaret ? (
                  <span className="ml-px inline-block h-[1.1em] w-px animate-pulse bg-muted-light" />
                ) : null}
              </span>
            ) : null}
            <button
              type="submit"
              className="absolute top-1/2 right-2 inline-flex min-h-10 -translate-y-1/2 items-center justify-center gap-1.5 rounded-xl bg-coral px-3.5 text-sm font-semibold text-midnight transition hover:brightness-110 sm:min-h-11 sm:px-5"
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
