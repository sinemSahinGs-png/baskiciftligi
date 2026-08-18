"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ArrowUpRight, Search } from "lucide-react";

import { FormSignal } from "@/components/brand/form-signal";
import { siteConfig } from "@/config/site";
import type { Category, Product } from "@/domain/catalog/types";
import { foundryEase } from "@/lib/motion";
import { cn } from "@/lib/utils";

const trending = ["vazo", "masaüstü", "kişiye özel", "heykel"] as const;
const recentKey = "somut-recent-searches";
const recentEvent = "somut-recent-searches";

function subscribeRecent(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(recentEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(recentEvent, onChange);
  };
}

function getRecentSnapshot() {
  return window.localStorage.getItem(recentKey) ?? "[]";
}

function getRecentServerSnapshot() {
  return "[]";
}

function parseRecent(raw: string) {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string").slice(0, 6)
      : [];
  } catch {
    return [];
  }
}

interface SearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  products: Product[];
}

export function SearchOverlay({
  open,
  onOpenChange,
  categories,
  products,
}: SearchOverlayProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const recent = parseRecent(
    useSyncExternalStore(
      subscribeRecent,
      getRecentSnapshot,
      getRecentServerSnapshot,
    ),
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const normalized = query.trim().toLocaleLowerCase("tr-TR");
  const productHits = useMemo(
    () =>
      normalized
        ? products
            .filter((product) =>
              `${product.name} ${product.shortDescription}`
                .toLocaleLowerCase("tr-TR")
                .includes(normalized),
            )
            .slice(0, 5)
        : [],
    [normalized, products],
  );
  const categoryHits = useMemo(
    () =>
      normalized
        ? categories
            .filter((category) =>
              category.name.toLocaleLowerCase("tr-TR").includes(normalized),
            )
            .slice(0, 4)
        : [],
    [categories, normalized],
  );

  const results = [
    ...productHits.map((product) => ({
      href: `/urun/${product.slug}`,
      label: product.name,
      meta: "Ürün",
    })),
    ...categoryHits.map((category) => ({
      href: `/magaza/${category.slug}`,
      label: category.name,
      meta: "Kategori",
    })),
    ...(normalized
      ? [
          {
            href: `/hazir-modeller?q=${encodeURIComponent(query)}`,
            label: `Hazır modellerde “${query}”`,
            meta: "Model",
          },
        ]
      : []),
  ];

  function remember(term: string) {
    const next = [term, ...recent.filter((item) => item !== term)].slice(0, 6);
    window.localStorage.setItem(recentKey, JSON.stringify(next));
    window.dispatchEvent(new Event(recentEvent));
  }

  function go(href: string, term?: string) {
    if (term) {
      remember(term);
    }
    onOpenChange(false);
    router.push(href as Route);
  }

  return (
    <AnimatePresence>
      {open ? (
    <m.div
      className="fixed inset-0 z-50 bg-midnight text-light-text"
      initial={
        reduceMotion ? false : { clipPath: "inset(0 0 100% 0)" }
      }
      animate={{ clipPath: "inset(0 0 0 0)" }}
      exit={
        reduceMotion
          ? { opacity: 0 }
          : { clipPath: "inset(0 0 100% 0)" }
      }
      transition={{ duration: 0.36, ease: foundryEase }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#4054ff_0%,transparent_48%,#10101a_100%)] opacity-45"
      />
      <div aria-hidden="true" className="grid-fade absolute inset-0 opacity-70" />
      <button
        type="button"
        aria-label="Aramayı kapat"
        className="absolute inset-0"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-overlay-title"
        className="relative mx-auto mt-[8vh] w-[min(100%-1.5rem,52rem)] overflow-hidden rounded-2xl border border-white/12 bg-carbon/85 shadow-[0_30px_90px_rgb(7_7_19/0.55)] backdrop-blur-md"
      >
        <form
          action="/arama"
          method="get"
          className="flex items-center gap-3 px-5 py-5"
          onSubmit={(event) => {
            const value = query.trim();
            if (!value) {
              event.preventDefault();
              return;
            }
            remember(value);
            onOpenChange(false);
          }}
        >
          <Search aria-hidden="true" className="size-5 text-cyan" />
          <label htmlFor="overlay-search" id="search-overlay-title" className="sr-only">
            {siteConfig.name} içinde ara
          </label>
          <input
            ref={inputRef}
            id="overlay-search"
            name="q"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) =>
                  Math.min(results.length - 1, index + 1),
                );
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(0, index - 1));
              }
              if (event.key === "Enter" && results[activeIndex] && query.trim()) {
                event.preventDefault();
                go(results[activeIndex].href, query.trim());
              }
            }}
            placeholder="Ne arıyorsun?"
            className="h-12 min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-muted-light"
          />
          <FormSignal className="size-5" />
        </form>

        <div className="border-t border-white/10 px-5 pb-8">
          {normalized && results.length === 0 ? (
            <p className="py-8 text-sm text-muted-light">
              “{query}” için sonuç yok. Kategori veya model adıyla tekrar dene.
            </p>
          ) : null}

          {normalized && results.length > 0 ? (
            <ul className="divide-y divide-white/10">
              {results.map((result, index) => (
                <li key={result.href}>
                  <button
                    type="button"
                    onClick={() => go(result.href, query.trim())}
                    className={cn(
                      "flex min-h-12 w-full items-center justify-between gap-4 py-3 text-left",
                      index === activeIndex && "bg-white/8",
                    )}
                  >
                    <span>
                      <span className="block text-sm font-semibold">
                        {result.label}
                      </span>
                      <span className="text-xs text-muted-light">{result.meta}</span>
                    </span>
                    <ArrowUpRight aria-hidden="true" className="size-4 text-muted-light" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {!normalized ? (
            <div className="grid gap-8 py-6 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-muted-light">
                  Son aramalar
                </p>
                {recent.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {recent.map((term) => (
                      <li key={term}>
                        <button
                          type="button"
                          onClick={() => go(`/arama?q=${encodeURIComponent(term)}`, term)}
                          className="min-h-11 rounded-md border border-white/15 px-3 text-sm"
                        >
                          {term}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted-light">Henüz arama yok.</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-light">
                  Önerilen aramalar
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {trending.map((term) => (
                    <li key={term}>
                      <Link
                        href={`/arama?q=${term}` as Route}
                        onClick={() => onOpenChange(false)}
                        className="inline-flex min-h-11 items-center rounded-md border border-white/15 px-3 text-sm"
                      >
                        {term}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </m.div>
      ) : null}
    </AnimatePresence>
  );
}
