"use client";

import { useId, useMemo, useState } from "react";
import { ArrowUpRight, ExternalLink } from "lucide-react";

import {
  buildPrintablesSearchUrl,
  sanitizePrintablesQuery,
  selectBestPrintablesEnglishQuery,
} from "@/lib/model-discovery/printables-redirect";
import { cn } from "@/lib/utils";

export function ExternalModelSearchCard({
  turkishQuery,
  englishOverride,
  onEnglishChange,
  onExplore,
  compact = false,
  className,
}: {
  turkishQuery: string;
  englishOverride?: string;
  onEnglishChange?: (value: string) => void;
  onExplore?: (href: string) => void;
  compact?: boolean;
  className?: string;
}) {
  const plan = useMemo(
    () => selectBestPrintablesEnglishQuery(turkishQuery),
    [turkishQuery],
  );
  const englishQuery = sanitizePrintablesQuery(
    englishOverride?.trim() || plan.englishQuery,
  );
  const [editOpen, setEditOpen] = useState(
    Boolean(englishOverride) && !plan.dictionaryMatch,
  );
  const previewId = useId();
  const href = buildPrintablesSearchUrl(englishQuery);

  if (!turkishQuery.trim()) {
    return (
      <section
        data-external-model-search
        className={cn(
          "rounded-xl border border-white/12 bg-white/[0.04] p-4 sm:p-5",
          className,
        )}
      >
        <p className="text-xs font-semibold tracking-[0.14em] text-muted-light uppercase">
          Daha fazla seçenek
        </p>
        <h2 className="mt-2 font-heading text-lg font-bold tracking-[-0.02em] sm:text-xl">
          Aradığın modeli web&apos;de keşfet.
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-light">
          Türkçe bir terim yaz; baskıya uygun İngilizce ifade hazırlanır ve harici model
          kütüphanesinde açılır.
        </p>
      </section>
    );
  }

  if (plan.blocked) {
    return (
      <section
        data-external-model-search
        className={cn(
          "rounded-xl border border-error/40 bg-error/10 p-4 sm:p-5",
          className,
        )}
      >
        <h2 className="font-heading text-lg font-bold">Bu arama desteklenmiyor</h2>
        <p className="mt-2 text-sm text-muted-light">
          Güvenlik politikası nedeniyle bu sorgu için harici arama açılmaz.
        </p>
      </section>
    );
  }

  return (
    <section
      data-external-model-search
      aria-label="Harici model kütüphanesi araması"
      className={cn(
        "rounded-xl border border-white/12 bg-white/[0.04] p-4 sm:p-5",
        compact && "max-w-2xl",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold tracking-[0.14em] text-muted-light uppercase">
          Daha fazla seçenek
        </p>
        <span className="rounded-md border border-white/12 px-2 py-0.5 text-[11px] text-muted-light">
          Harici model kütüphanesi
        </span>
      </div>

      <h2 className="mt-3 font-heading text-lg font-bold tracking-[-0.02em] sm:text-xl">
        Aradığın modeli web&apos;de keşfet.
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-light">
        Türkçe araman baskıya uygun İngilizce terime dönüştürülür ve harici model
        kütüphanesinde açılır.
      </p>

      <dl className="mt-4 space-y-1.5 text-sm" aria-live="polite" id={previewId}>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted-light">Araman:</dt>
          <dd className="font-medium text-light-text">{turkishQuery}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted-light">Aranacak ifade:</dt>
          <dd className="font-medium text-light-text">
            {englishQuery || "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-3">
        <button
          type="button"
          className="text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
          aria-expanded={editOpen}
          onClick={() => setEditOpen((open) => !open)}
        >
          Aramayı düzenle
        </button>
        {editOpen ? (
          <label className="mt-2 block max-w-md">
            <span className="sr-only">Harici arama ifadesi</span>
            <input
              value={englishQuery}
              onChange={(event) => onEnglishChange?.(event.target.value)}
              className="h-11 w-full rounded-md border border-white/15 bg-midnight/40 px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-coral/70"
              placeholder="figurine"
              maxLength={80}
              autoComplete="off"
            />
          </label>
        ) : null}
      </div>

      {href ? (
        <a
          href={href}
          data-external-search-cta
          rel="noopener noreferrer"
          onClick={(event) => {
            if (onExplore) {
              event.preventDefault();
              onExplore(href);
            }
          }}
          className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-coral px-5 text-sm font-semibold text-light-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-light-text"
        >
          Modelleri keşfet
          <ExternalLink aria-hidden="true" className="size-4" />
          <ArrowUpRight aria-hidden="true" className="size-4" />
          <span className="sr-only">(harici model kütüphanesinde açılır)</span>
        </a>
      ) : (
        <p className="mt-4 text-sm text-muted-light">Geçerli bir arama ifadesi yazın.</p>
      )}

      <p className="mt-3 text-xs leading-5 text-muted-light">
        Arama sonuçları harici model kütüphanesinde açılır.
      </p>
    </section>
  );
}
