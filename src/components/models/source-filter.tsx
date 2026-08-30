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
    <div className="flex items-center gap-2" data-source-filter="">
      <span className="text-xs font-medium text-muted-light">Kaynak</span>
      <div className="hidden rounded-lg border border-white/10 bg-white/[0.03] p-0.5 sm:flex">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            data-library-source={option.id}
            aria-pressed={value === option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "min-h-8 rounded-md px-3 text-xs font-semibold transition",
              value === option.id
                ? "bg-coral text-midnight"
                : "text-muted-light hover:text-light-text",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <MobileSourceSelect value={value} onChange={onChange} options={options} />
    </div>
  );
}

function MobileSourceSelect({
  value,
  onChange,
  options,
}: {
  value: DiscoverySource;
  onChange: (next: DiscoverySource) => void;
  options: Array<{ id: DiscoverySource; label: string }>;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find((item) => item.id === value) ?? options[0]!;

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

  return (
    <div ref={rootRef} className="relative sm:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold"
      >
        {current.label}
        <ChevronDown aria-hidden="true" className="size-3.5" />
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute top-full right-0 z-20 mt-1 min-w-[9rem] rounded-lg border border-white/10 bg-carbon py-1 shadow-lg"
        >
          {options.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                role="option"
                aria-selected={value === option.id}
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-xs font-semibold hover:bg-white/5"
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
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
    <label className="flex items-center gap-2">
      <span className="sr-only">Sırala</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as SortOption)}
        className="min-h-9 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-xs font-semibold text-light-text"
        aria-label="Sırala"
      >
        <option value="recommended">Önerilen</option>
        <option value="newest">En yeni</option>
        <option value="with_image">Görseli olanlar</option>
      </select>
    </label>
  );
}
