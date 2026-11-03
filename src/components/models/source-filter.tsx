"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export type DiscoverySource = "all" | "internal" | "thingiverse";

export function SourceFilter({
  value,
  onChange,
}: {
  value: DiscoverySource;
  onChange: (next: DiscoverySource) => void;
  communityEnabled?: boolean;
}) {
  const t = useTranslations();
  const options: Array<{ id: DiscoverySource; label: string }> = [
    { id: "all", label: t("models.all") },
    { id: "internal", label: t("models.internal") },
    { id: "thingiverse", label: t("models.community") },
  ];

  return (
    <>
      <div className="hidden items-center gap-2 sm:flex" data-source-filter="">
        <span className="text-sm font-medium text-muted-light">{t("models.source")}</span>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              data-library-source={option.id}
              aria-pressed={value === option.id}
              onClick={() => onChange(option.id)}
              className={cn(
                "min-h-9 rounded-md px-3 text-sm font-semibold transition",
                value === option.id
                  ? "bg-coral text-midnight"
                  : "text-muted-light hover:text-light-text",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <MobileSourceSheet value={value} onChange={onChange} options={options} />
    </>
  );
}

function MobileSourceSheet({
  value,
  onChange,
  options,
}: {
  value: DiscoverySource;
  onChange: (next: DiscoverySource) => void;
  options: Array<{ id: DiscoverySource; label: string }>;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);
  const current = options.find((item) => item.id === value) ?? options[0]!;

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function close() {
    setOpen(false);
    openerRef.current?.focus();
  }

  function select(next: DiscoverySource) {
    onChange(next);
    close();
  }

  return (
    <div className="sm:hidden" data-source-filter-mobile="">
      <button
        ref={openerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/12 bg-white/[0.04] px-3.5 text-sm font-semibold text-light-text"
      >
        {t("models.source")}: {current.label}
        <ChevronDown aria-hidden="true" className="size-4 text-muted-light" />
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label={t("models.closeSource")}
            className="fixed inset-0 z-50 bg-black/55"
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("models.sourceFilter")}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-white/10 bg-carbon px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
          >
            <p className="text-sm font-semibold">{t("models.source")}</p>
            <ul className="mt-3 space-y-1">
              {options.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    data-library-source={option.id}
                    onClick={() => select(option.id)}
                    className={cn(
                      "flex min-h-12 w-full items-center justify-between rounded-lg px-3 text-sm font-semibold",
                      value === option.id
                        ? "bg-coral/15 text-coral"
                        : "text-light-text hover:bg-white/5",
                    )}
                  >
                    {option.label}
                    {value === option.id ? (
                      <span className="text-xs text-coral">{t("models.selected")}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function discoverySourceToApiParam(source: DiscoverySource): string {
  if (source === "internal") return "internal";
  if (source === "thingiverse") return "thingiverse";
  return "all";
}

export function parseDiscoverySource(
  raw: string | null,
  _communityEnabled?: boolean,
): DiscoverySource {
  if (raw === "thingiverse" || raw === "community") {
    return "thingiverse";
  }
  if (raw === "internal" || raw === "owned" || raw === "curated") return "internal";
  if (raw === "all") return "all";
  return "thingiverse";
}

export type SortOption = "recommended" | "newest" | "with_image";

export function SortFilter({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (next: SortOption) => void;
}) {
  const t = useTranslations();
  return (
    <label className="hidden items-center gap-2 md:flex">
      <span className="sr-only">{t("models.sort")}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as SortOption)}
        className="min-h-10 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-sm font-semibold text-light-text"
        aria-label={t("models.sort")}
      >
        <option value="recommended">{t("models.recommended")}</option>
        <option value="newest">{t("models.newest")}</option>
        <option value="with_image">{t("models.withImage")}</option>
      </select>
    </label>
  );
}
