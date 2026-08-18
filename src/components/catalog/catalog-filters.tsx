"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import type { Category, Collection } from "@/domain/catalog/types";
import { foundryEase } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface CatalogFiltersProps {
  categories: Category[];
  collections?: Collection[];
  productCount: number;
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
  productCount,
}: CatalogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

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

  const filters = (
    <div className="space-y-6 text-sm">
      <fieldset>
        <legend className="mb-2 font-semibold">Kategori</legend>
        <select
          value={current("category")}
          onChange={(event) => setParam("category", event.target.value)}
          className="h-11 w-full rounded-md border border-hairline bg-elevated px-3"
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
            className="h-11 w-full rounded-md border border-hairline bg-elevated px-3"
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
                name="stok"
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
          className="h-11 w-full rounded-md border border-hairline bg-elevated px-3"
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
            className="h-11 rounded-md border border-hairline bg-elevated px-3"
          />
          <input
            type="number"
            min={0}
            placeholder="Maks"
            defaultValue={current("max")}
            onBlur={(event) => setParam("max", event.target.value)}
            className="h-11 rounded-md border border-hairline bg-elevated px-3"
          />
        </div>
      </fieldset>
    </div>
  );

  return (
    <div>
      <div className="sticky top-16 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-porcelain/95 px-4 py-3 backdrop-blur-sm lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:py-4 lg:backdrop-blur-none">
        <p className="text-sm font-semibold text-ink-secondary">
          {productCount} ürün
        </p>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="catalog-sort">
            Sırala
          </label>
          <select
            id="catalog-sort"
            value={current("siralama")}
            onChange={(event) => setParam("siralama", event.target.value)}
            className="h-11 rounded-md border border-hairline bg-elevated px-3 text-sm"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-hairline px-3 text-sm font-semibold lg:hidden"
            onClick={() => setOpen(true)}
          >
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            Filtre
          </button>
        </div>
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 py-4">
          <p className="w-full text-xs font-semibold tracking-[0.12em] text-ink-muted uppercase">
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
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-muted px-3 text-sm font-semibold"
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

      <div className="hidden lg:block">{filters}</div>

      <AnimatePresence>
        {open ? (
          <m.div
            initial={reduceMotion ? false : { opacity: 0.92, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.28, ease: foundryEase }}
            className="fixed inset-0 z-50 flex flex-col bg-porcelain lg:hidden"
          >
          <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
            <p className="font-heading text-2xl font-bold">Filtreler</p>
            <button
              type="button"
              aria-label="Kapat"
              onClick={() => setOpen(false)}
              className="grid size-11 place-items-center"
            >
              <X />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5">{filters}</div>
          <div className="border-t border-hairline p-5">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-cobalt text-sm font-semibold text-light-text"
            >
              {productCount} sonucu göster
            </button>
          </div>
          </m.div>
        ) : null}
      </AnimatePresence>

      <nav aria-label="Kategoriler" className="mt-4 -mx-1 overflow-x-auto pb-2 lg:hidden">
        <ul className="flex min-w-max gap-2 px-1">
          <li>
            <Link
              href="/magaza"
              className={cn(
                "inline-flex min-h-11 items-center rounded-md border px-3 text-sm",
                !current("category") && pathname === "/magaza"
                  ? "border-cobalt bg-cobalt text-light-text"
                  : "border-hairline",
              )}
            >
              Tümü
            </Link>
          </li>
          {categories.slice(0, 8).map((category) => (
            <li key={category.id}>
              <Link
                href={`/magaza/${category.slug}`}
                className="inline-flex min-h-11 items-center rounded-md border border-hairline px-3 text-sm"
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
