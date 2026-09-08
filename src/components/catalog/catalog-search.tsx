"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

const SEARCH_DEBOUNCE_MS = 320;

export function CatalogSearch({
  className,
  tone = "store",
}: {
  className?: string;
  tone?: "light" | "dark" | "store";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const urlQuery = searchParams.get("q") ?? "";
  const [value, setValue] = useState(urlQuery);
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);

  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery);
    setValue(urlQuery);
  }

  const commitQuery = useCallback(
    (nextValue: string) => {
      const query = nextValue.trim();
      if (query === urlQuery.trim()) {
        return;
      }
      const next = new URLSearchParams(queryString);
      if (query) {
        next.set("q", query);
      } else {
        next.delete("q");
      }
      next.delete("sayfa");
      const suffix = next.toString();
      router.push((suffix ? `${pathname}?${suffix}` : pathname) as Route);
    },
    [pathname, queryString, router, urlQuery],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      commitQuery(value);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [commitQuery, value]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    commitQuery(value);
  }

  return (
    <form
      onSubmit={submit}
      data-motion-state="visible"
      className={cn(tone === "store" ? "store-search" : "relative", className)}
    >
      <label htmlFor="catalog-search" className="sr-only">
        Ürün ara
      </label>
      <Search
        aria-hidden="true"
        className={cn(
          tone === "store"
            ? "store-search-icon size-5"
            : "pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2",
          tone === "light" && "text-white/65",
          tone === "dark" && "text-ink-muted",
        )}
      />
      <input
        id="catalog-search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Ürün ara..."
        autoComplete="off"
        className={
          tone === "store"
            ? undefined
            : cn(
                "h-14 w-full rounded-md border pr-4 pl-12 text-base outline-none",
                tone === "light"
                  ? "border-white/20 bg-white/10 text-light-text placeholder:text-white/55"
                  : "border-hairline bg-elevated text-dark-text placeholder:text-ink-muted",
              )
        }
      />
      {value ? (
        <button
          type="button"
          className={cn(
            tone === "store"
              ? "store-search-clear"
              : "absolute top-1/2 right-2 grid size-11 -translate-y-1/2 place-items-center",
          )}
          aria-label="Aramayı temizle"
          onClick={() => {
            setValue("");
            commitQuery("");
          }}
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      ) : null}
    </form>
  );
}
