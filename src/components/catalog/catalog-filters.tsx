"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { LayoutGrid, List, SlidersHorizontal, X } from "lucide-react";

import type { Category, Collection, Material } from "@/domain/catalog/types";

interface CatalogFiltersProps {
  categories: Category[];
  collections?: Collection[];
  materials?: Material[];
  productCount: number;
  view?: "grid" | "list";
  onViewChange?: (view: "grid" | "list") => void;
}

const sortOptions = [
  { value: "", label: "Öne çıkan" },
  { value: "newest", label: "Yeni" },
  { value: "price_asc", label: "Fiyat: artan" },
  { value: "price_desc", label: "Fiyat: azalan" },
] as const;

export function CatalogFilters({
  categories,
  collections = [],
  materials = [],
  productCount,
  view = "grid",
  onViewChange,
}: CatalogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  const current = (key: string) => searchParams.get(key) ?? "";

  function applyParams(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams.toString());
    mutate(next);
    next.delete("sayfa");
    const query = next.toString();
    router.push((query ? `${pathname}?${query}` : pathname) as Route);
  }

  function setParam(key: string, value: string) {
    applyParams((next) => {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    });
  }

  useEffect(() => {
    if (!open && !sortOpen) {
      return;
    }
    if (open) {
      closeRef.current?.focus();
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setSortOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, sortOpen]);

  const chips = [
    current("q") ? { key: "q", label: `Arama: ${current("q")}` } : null,
    current("category")
      ? {
          key: "category",
          label:
            categories.find((category) => category.slug === current("category"))
              ?.name ?? current("category"),
        }
      : null,
    current("koleksiyon")
      ? {
          key: "koleksiyon",
          label:
            collections.find((item) => item.slug === current("koleksiyon"))
              ?.name ?? `Koleksiyon: ${current("koleksiyon")}`,
        }
      : null,
    current("stok") ? { key: "stok", label: current("stok") } : null,
    current("kisisel") ? { key: "kisisel", label: "Kişiselleştirilebilir" } : null,
    current("uygunluk") ? { key: "uygunluk", label: "Stokta / üretilebilir" } : null,
    current("malzeme") ? { key: "malzeme", label: current("malzeme") } : null,
    current("sure") ? { key: "sure", label: `En fazla ${current("sure")} gün` } : null,
    current("min") || current("max")
      ? {
          key: "price",
          label: `Fiyat ${current("min") || "0"}–${current("max") || "∞"} ₺`,
        }
      : null,
  ].filter((chip): chip is { key: string; label: string } => Boolean(chip));

  const filters = (namePrefix: string) => (
    <div className="space-y-6 text-sm">
      <fieldset>
        <legend className="mb-2 font-semibold">Kategori</legend>
        <select
          value={current("category")}
          onChange={(event) => setParam("category", event.target.value)}
          className="h-11 w-full border border-[color:var(--shop-line)] bg-[color:var(--shop-white)] px-3"
        >
          <option value="">Tümü</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </fieldset>
      {collections.length > 0 ? (
        <fieldset>
          <legend className="mb-2 font-semibold">Koleksiyon</legend>
          <select
            value={current("koleksiyon")}
            onChange={(event) => setParam("koleksiyon", event.target.value)}
            className="h-11 w-full border border-[color:var(--shop-line)] bg-[color:var(--shop-white)] px-3"
          >
            <option value="">Tümü</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.slug}>
                {collection.name}
              </option>
            ))}
          </select>
        </fieldset>
      ) : null}
      {materials.length > 0 ? (
        <fieldset>
          <legend className="mb-2 font-semibold">Malzeme</legend>
          <select
            value={current("malzeme")}
            onChange={(event) => setParam("malzeme", event.target.value)}
            className="h-11 w-full border border-[color:var(--shop-line)] bg-[color:var(--shop-white)] px-3"
          >
            <option value="">Tümü</option>
            {materials.map((material) => (
              <option key={material.id} value={material.name}>
                {material.name}
              </option>
            ))}
          </select>
        </fieldset>
      ) : null}
      <fieldset>
        <legend className="mb-2 font-semibold">Ürün tipi</legend>
        <div className="space-y-2">
          {[
            ["", "Hepsi"],
            ["hazir", "Hazır stok"],
            ["siparis", "Siparişe göre"],
          ].map(([value, label]) => (
            <label key={value} className="flex min-h-11 items-center gap-2">
              <input
                type="radio"
                name={`${namePrefix}-stok`}
                checked={current("stok") === value}
                onChange={() => setParam("stok", value)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-semibold">Uygunluk</legend>
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={current("uygunluk") === "stokta"}
            onChange={(event) =>
              setParam("uygunluk", event.target.checked ? "stokta" : "")
            }
          />
          Üretilebilir / stokta
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={current("kisisel") === "1"}
            onChange={(event) =>
              setParam("kisisel", event.target.checked ? "1" : "")
            }
          />
          Kişiselleştirilebilir
        </label>
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-semibold">Üretim süresi</legend>
        <select
          value={current("sure")}
          onChange={(event) => setParam("sure", event.target.value)}
          className="h-11 w-full border border-[color:var(--shop-line)] bg-[color:var(--shop-white)] px-3"
        >
          <option value="">Fark etmez</option>
          <option value="3">En fazla 3 gün</option>
          <option value="5">En fazla 5 gün</option>
          <option value="10">En fazla 10 gün</option>
        </select>
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-semibold">Fiyat (₺)</legend>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            defaultValue={current("min")}
            onBlur={(event) => setParam("min", event.target.value)}
            className="h-11 border border-[color:var(--shop-line)] bg-[color:var(--shop-white)] px-3"
          />
          <input
            type="number"
            min={0}
            placeholder="Maks"
            defaultValue={current("max")}
            onBlur={(event) => setParam("max", event.target.value)}
            className="h-11 border border-[color:var(--shop-line)] bg-[color:var(--shop-white)] px-3"
          />
        </div>
      </fieldset>
    </div>
  );

  return (
    <>
      <div className="store-toolbar-wrap">
        <div className="store-toolbar">
          <button
            type="button"
            className="store-tool store-filter-mobile-trigger"
            aria-expanded={open}
            aria-controls="store-filter-sheet"
            onClick={() => setOpen(true)}
          >
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            FİLTRELE
          </button>
          <button
            type="button"
            className="store-tool store-sort-mobile"
            aria-expanded={sortOpen}
            aria-controls="store-sort-sheet"
            onClick={() => setSortOpen(true)}
          >
            SIRALA
          </button>
          <label className="sr-only" htmlFor="catalog-sort">
            Sırala
          </label>
          <select
            id="catalog-sort"
            value={current("siralama")}
            onChange={(event) => setParam("siralama", event.target.value)}
            className="store-tool store-sort-select"
            aria-label="Sırala"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value ? option.label : "SIRALA"}
              </option>
            ))}
          </select>
          <p className="store-tool-count">{productCount} ÜRÜN</p>
          {onViewChange ? (
            <div className="store-view-toggle" role="group" aria-label="Görünüm">
              <button
                type="button"
                aria-pressed={view === "grid"}
                aria-label="Izgara görünümü"
                onClick={() => onViewChange("grid")}
              >
                <LayoutGrid aria-hidden="true" className="size-4" />
              </button>
              <button
                type="button"
                aria-pressed={view === "list"}
                aria-label="Liste görünümü"
                onClick={() => onViewChange("list")}
              >
                <List aria-hidden="true" className="size-4" />
              </button>
            </div>
          ) : null}
        </div>
        {chips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 py-3">
            <p className="w-full text-xs font-semibold tracking-[0.12em] text-[color:var(--shop-muted)] uppercase">
              Aktif filtreler
            </p>
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => {
                  if (chip.key === "price") {
                    applyParams((next) => {
                      next.delete("min");
                      next.delete("max");
                    });
                    return;
                  }
                  setParam(chip.key, "");
                }}
                className="inline-flex min-h-10 items-center gap-2 border border-[color:var(--shop-line)] bg-[color:var(--shop-white)] px-3 text-sm font-semibold"
              >
                {chip.label}
                <X aria-hidden="true" className="size-3.5" />
              </button>
            ))}
            <Link href={pathname as Route} className="text-sm font-semibold underline">
              Tüm filtreleri temizle
            </Link>
          </div>
        ) : null}
      </div>

      <aside className="store-filter-desktop" aria-label="Filtreler">
        <h2 className="mb-4 font-heading text-xl font-bold tracking-[-0.03em]">
          Filtrele
        </h2>
        {filters("desktop")}
      </aside>

      {open ? (
        <div
          id="store-filter-sheet"
          className="store-filter-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Filtreleri kapat"
            onClick={() => setOpen(false)}
          />
          <div className="store-filter-panel relative z-10">
            <div className="mb-4 flex items-center justify-between">
              <p id={titleId} className="font-heading text-2xl font-bold">
                Filtrele
              </p>
              <button
                ref={closeRef}
                type="button"
                aria-label="Kapat"
                onClick={() => setOpen(false)}
                className="grid size-11 place-items-center"
              >
                <X />
              </button>
            </div>
            {filters("sheet")}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="store-btn-primary mt-6 w-full"
            >
              {productCount} sonucu göster
            </button>
          </div>
        </div>
      ) : null}

      {sortOpen ? (
        <div
          id="store-sort-sheet"
          className="store-filter-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${titleId}-sort`}
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Sıralamayı kapat"
            onClick={() => setSortOpen(false)}
          />
          <div className="store-filter-panel relative z-10">
            <div className="mb-4 flex items-center justify-between">
              <p id={`${titleId}-sort`} className="font-heading text-2xl font-bold">
                Sırala
              </p>
              <button
                type="button"
                aria-label="Kapat"
                onClick={() => setSortOpen(false)}
                className="grid size-11 place-items-center"
              >
                <X />
              </button>
            </div>
            <div className="grid gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value || "featured"}
                  type="button"
                  className="store-tool w-full justify-between"
                  aria-pressed={current("siralama") === option.value}
                  onClick={() => {
                    setParam("siralama", option.value);
                    setSortOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

