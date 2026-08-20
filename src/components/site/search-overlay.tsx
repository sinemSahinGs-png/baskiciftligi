"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ArrowUpRight, Loader2, Search } from "lucide-react";

import { FormSignal } from "@/components/brand/form-signal";
import { siteConfig } from "@/config/site";
import type { Category, Product } from "@/domain/catalog/types";
import { matchesTurkish } from "@/lib/search/turkish-match";
import { foundryEase } from "@/lib/motion";
import { cn } from "@/lib/utils";

const trending = ["vazo", "telefon tutucu", "masaüstü düzenleyici", "kulaklık standı"] as const;
const recentKey = "baski-ciftligi-recent-searches";
const recentEvent = "baski-ciftligi-recent-searches";

interface SearchModelHit {
  source: string;
  externalId: string;
  title: string;
  creatorName: string;
  href: string;
}

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
  const openerRef = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [modelHits, setModelHits] = useState<SearchModelHit[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const recent = parseRecent(
    useSyncExternalStore(subscribeRecent, getRecentSnapshot, getRecentServerSnapshot),
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    openerRef.current = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => {
      openerRef.current?.focus();
    };
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

  const trimmed = query.trim();
  const productHits = useMemo(
    () =>
      trimmed
        ? products
            .filter((product) =>
              matchesTurkish(
                `${product.name} ${product.shortDescription ?? ""}`,
                trimmed,
              ),
            )
            .slice(0, 5)
        : [],
    [trimmed, products],
  );
  const categoryHits = useMemo(
    () =>
      trimmed
        ? categories
            .filter((category) => matchesTurkish(category.name, trimmed))
            .slice(0, 4)
        : [],
    [categories, trimmed],
  );

  useEffect(() => {
    abortRef.current?.abort();
    if (!trimmed) {
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    const handle = window.setTimeout(() => {
      setLoadingModels(true);
      setSearchError(null);
      void fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Arama tamamlanamadı.");
          }
          return response.json() as Promise<{
            models: SearchModelHit[];
            blocked?: boolean;
          }>;
        })
        .then((payload) => {
          setModelHits(payload.models ?? []);
          setBlocked(Boolean(payload.blocked));
        })
        .catch((error) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          setModelHits([]);
          setSearchError(error instanceof Error ? error.message : "Arama hatası");
        })
        .finally(() => {
          setLoadingModels(false);
        });
    }, 280);
    return () => {
      window.clearTimeout(handle);
      controller.abort();
    };
  }, [trimmed]);

  const displayModelHits = trimmed ? modelHits : [];
  const displayBlocked = trimmed ? blocked : false;
  const displayLoading = trimmed ? loadingModels : false;
  const displayError = trimmed ? searchError : null;

  const results = [
    ...productHits.map((product) => ({
      href: `/urun/${product.slug}`,
      label: product.name,
      meta: "Ürün",
      group: "Ürünler",
    })),
    ...categoryHits.map((category) => ({
      href: `/magaza/${category.slug}`,
      label: category.name,
      meta: "Kategori",
      group: "Kategoriler",
    })),
    ...displayModelHits.map((model) => ({
      href: model.href,
      label: model.title,
      meta: `${model.creatorName} · Model`,
      group: "Hazır modeller",
    })),
    ...(trimmed && displayModelHits.length === 0 && !displayLoading
      ? [
          {
            href: `/hazir-modeller?q=${encodeURIComponent(trimmed)}`,
            label: `Hazır modellerde “${trimmed}” ara`,
            meta: "Model kütüphanesi",
            group: "Hazır modeller",
          },
        ]
      : []),
  ];

  useEffect(() => {
    if (!trimmed) {
      abortRef.current?.abort();
    }
  }, [trimmed]);

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

  const resultSummary =
    trimmed && results.length > 0
      ? `${results.length} sonuç bulundu`
      : trimmed && !loadingModels
        ? "Sonuç bulunamadı"
        : "";

  return (
    <AnimatePresence>
      {open ? (
        <m.div
          className="fixed inset-0 z-50 flex flex-col bg-midnight text-light-text sm:items-center sm:justify-start sm:pt-[6vh]"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: 0.24, ease: foundryEase }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#4054ff_0%,transparent_48%,#10101a_100%)] opacity-45"
          />
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
            className="relative flex max-h-[100dvh] w-full flex-col border-white/12 bg-carbon/95 backdrop-blur-md sm:max-h-[min(88dvh,44rem)] sm:w-[min(100%-1.5rem,52rem)] sm:rounded-2xl sm:border sm:shadow-[0_30px_90px_rgb(7_7_19/0.55)]"
          >
            <form
              action="/arama"
              method="get"
              className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-4 sm:px-5"
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
              <Search aria-hidden="true" className="size-5 shrink-0 text-cyan" />
              <label htmlFor="overlay-search" id="search-overlay-title" className="sr-only">
                {siteConfig.name} içinde ara
              </label>
              <input
                ref={inputRef}
                id="overlay-search"
                name="q"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActiveIndex((index) => Math.min(results.length - 1, index + 1));
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
                placeholder="Ürün, kategori veya model ara"
                className="h-12 min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-muted-light"
                autoComplete="off"
              />
              {displayLoading ? (
                <Loader2 aria-hidden="true" className="size-5 animate-spin text-cyan" />
              ) : (
                <FormSignal className="size-5 shrink-0" />
              )}
            </form>

            <div
              aria-live="polite"
              aria-atomic="true"
              className="sr-only"
            >
              {resultSummary}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 sm:px-5">
              {displayBlocked ? (
                <p className="py-8 text-sm text-muted-light">
                  Bu arama desteklenmiyor.
                </p>
              ) : null}

              {trimmed && displayError ? (
                <p className="py-8 text-sm text-error">{displayError}</p>
              ) : null}

              {trimmed && !displayBlocked && results.length === 0 && !displayLoading && !displayError ? (
                <p className="py-8 text-sm text-muted-light">
                  “{query}” için sonuç yok. Farklı bir Türkçe terim deneyin.
                </p>
              ) : null}

              {trimmed && results.length > 0 ? (
                <div className="divide-y divide-white/10">
                  {(["Ürünler", "Kategoriler", "Hazır modeller"] as const).map((group) => {
                    const groupResults = results.filter((result) => result.group === group);
                    if (groupResults.length === 0) {
                      return null;
                    }
                    return (
                      <section key={group} className="py-3">
                        <h2 className="text-xs font-semibold tracking-wide text-muted-light uppercase">
                          {group}
                        </h2>
                        <ul>
                          {groupResults.map((result) => {
                            const index = results.indexOf(result);
                            return (
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
                                  <ArrowUpRight
                                    aria-hidden="true"
                                    className="size-4 shrink-0 text-muted-light"
                                  />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    );
                  })}
                </div>
              ) : null}

              {!trimmed ? (
                <div className="grid gap-8 py-6 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-muted-light">Son aramalar</p>
                    {recent.length > 0 ? (
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {recent.map((term) => (
                          <li key={term}>
                            <button
                              type="button"
                              onClick={() => go(`/hazir-modeller?q=${encodeURIComponent(term)}`, term)}
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
                    <p className="text-xs font-semibold text-muted-light">Önerilen aramalar</p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {trending.map((term) => (
                        <li key={term}>
                          <Link
                            href={`/hazir-modeller?q=${term}` as Route}
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
