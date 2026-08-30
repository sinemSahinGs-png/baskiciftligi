"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type DiscoverySource = "all" | "internal" | "thingiverse";

const SOURCE_OPTIONS: Array<{ id: DiscoverySource; label: string }> = [
  { id: "all", label: "Tümü" },
  { id: "internal", label: "Baskı Çiftliği" },
  { id: "thingiverse", label: "Topluluk" },
];

export function SourceFilter({
  value,
  onChange,
  communityEnabled,
}: {
  value: DiscoverySource;
  onChange: (next: DiscoverySource) => void;
  communityEnabled: boolean;
}) {
  const options = communityEnabled
    ? SOURCE_OPTIONS
    : SOURCE_OPTIONS.filter((item) => item.id !== "thingiverse");

  return (
    <>
      <div className="hidden items-center gap-2 sm:flex" data-source-filter="">
        <span className="text-sm font-medium text-muted-light">Kaynak</span>
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
        Kaynak: {current.label}
        <ChevronDown aria-hidden="true" className="size-4 text-muted-light" />
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Kaynak filtresini kapat"
            className="fixed inset-0 z-50 bg-black/55"
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Kaynak filtresi"
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-white/10 bg-carbon px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
          >
            <p className="text-sm font-semibold">Kaynak</p>
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
                      <span className="text-xs text-coral">Seçili</span>
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
  communityEnabled: boolean,
): DiscoverySource {
  if (raw === "thingiverse" || raw === "community") {
    return communityEnabled ? "thingiverse" : "all";
  }
  if (raw === "internal" || raw === "owned" || raw === "curated") return "internal";
  return "all";
}

export type SortOption = "recommended" | "newest" | "with_image";

export function SortFilter({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (next: SortOption) => void;
}) {
  return (
    <label className="hidden items-center gap-2 md:flex">
      <span className="sr-only">Sırala</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as SortOption)}
        className="min-h-10 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-sm font-semibold text-light-text"
        aria-label="Sırala"
      >
        <option value="recommended">Önerilen</option>
        <option value="newest">En yeni</option>
        <option value="with_image">Görseli olanlar</option>
      </select>
    </label>
  );
}
