"use client";

import { Check, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { SafeImage } from "@/components/media/safe-image";
import type { AdminCategory } from "@/domain/catalog/admin-types";
import { cn } from "@/lib/utils";

type CategoryPickerProps = {
  categories: AdminCategory[];
  primarySlug: string | null;
  additionalSlugs: string[];
  onSelectPrimary: (slug: string) => void;
  onToggleAdditional: (slug: string) => void;
  error?: string;
};

function CategoryArtwork({
  category,
}: {
  category: AdminCategory;
}) {
  const [broken, setBroken] = useState(false);

  if (category.imageUrl && !broken) {
    return (
      <SafeImage
        src={category.imageUrl}
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
        className="object-cover object-center"
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <div
      className="absolute inset-0 grid place-items-center bg-gradient-to-br from-cyan/20 via-black/40 to-violet/20"
      aria-hidden="true"
    >
      <span className="font-heading text-2xl font-bold tracking-wide text-cyan/85">
        {category.name.slice(0, 2).toUpperCase()}
      </span>
    </div>
  );
}

export function CategoryPicker({
  categories,
  primarySlug,
  additionalSlugs,
  onSelectPrimary,
  onToggleAdditional,
  error,
}: CategoryPickerProps) {
  const [query, setQuery] = useState("");
  const [showAdditional, setShowAdditional] = useState(additionalSlugs.length > 0);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    if (!normalized) {
      return categories;
    }
    return categories.filter(
      (category) =>
        category.name.toLocaleLowerCase("tr-TR").includes(normalized) ||
        category.description.toLocaleLowerCase("tr-TR").includes(normalized),
    );
  }, [categories, query]);

  return (
    <div id="category-picker" className="@container space-y-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Kategori ara…"
          className="h-11 min-h-11 w-full rounded-xl border border-white/12 bg-black/20 pr-3 pl-10 text-sm outline-none focus:border-cyan"
          aria-label="Kategori ara"
        />
      </div>

      {categories.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/15 p-4 text-sm text-muted-foreground">
          Önce bir kategori oluşturun.
        </p>
      ) : (
        <div
          className="grid auto-rows-fr grid-cols-1 gap-3 @[420px]:grid-cols-2 @[720px]:grid-cols-3"
          role="radiogroup"
          aria-label="Birincil kategori"
          data-testid="category-card-grid"
        >
          {filtered.map((category) => {
            const selected = primarySlug === category.slug;
            return (
              <button
                key={category.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSelectPrimary(category.slug)}
                data-testid={`category-card-${category.slug}`}
                data-selected={selected ? "true" : "false"}
                className={cn(
                  "group relative isolate flex h-full min-h-[100px] w-full min-w-0 flex-col justify-end overflow-hidden rounded-2xl border text-left transition-[border-color,box-shadow,background-color] duration-200 motion-reduce:transition-none sm:min-h-[112px] xl:min-h-[132px]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan",
                  selected
                    ? "category-card-selected-pulse border-cyan shadow-[0_0_0_1px_rgb(33_212_253/0.55),0_18px_44px_-22px_rgb(33_212_253/0.95)]"
                    : "border-white/12 hover:border-white/30",
                )}
              >
                <CategoryArtwork category={category} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15" />
                <div className="relative z-10 flex items-end justify-between gap-2 p-3 sm:p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white sm:text-base">
                      {category.name}
                    </p>
                    {category.description ? (
                      <p className="mt-1 hidden line-clamp-2 text-xs leading-5 text-white/70 xl:block">
                        {category.description}
                      </p>
                    ) : null}
                  </div>
                  {selected ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-cyan/50 bg-cyan/20 px-2 py-1 text-[0.62rem] font-bold text-cyan">
                      <Check className="size-3.5" aria-hidden="true" />
                      Seçili
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {categories.length > 0 ? (
        <details
          open={showAdditional}
          onToggle={(event) => setShowAdditional(event.currentTarget.open)}
          className="rounded-2xl border border-white/10 bg-black/15"
        >
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
            Ek kategoriler
            {additionalSlugs.length ? (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({additionalSlugs.length} seçili)
              </span>
            ) : null}
          </summary>
          <div className="flex flex-wrap gap-2 border-t border-white/10 p-4">
            {categories
              .filter((category) => category.slug !== primarySlug)
              .map((category) => {
                const selected = additionalSlugs.includes(category.slug);
                return (
                  <button
                    key={category.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onToggleAdditional(category.slug)}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-2 rounded-full border px-3 text-xs font-semibold",
                      selected
                        ? "border-cyan/40 bg-cyan/10 text-cyan"
                        : "border-white/12 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {selected ? <Check className="size-3.5" /> : null}
                    {category.name}
                  </button>
                );
              })}
          </div>
        </details>
      ) : null}

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
