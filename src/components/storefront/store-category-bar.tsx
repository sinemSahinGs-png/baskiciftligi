"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import type { Category } from "@/domain/catalog/types";

export function StoreCategoryBar({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryCategory = searchParams.get("category") ?? "";
  const pathCategory = pathname.startsWith("/magaza/")
    ? pathname.slice("/magaza/".length).split("/")[0]
    : "";
  const active = queryCategory || pathCategory;

  function hrefFor(slug: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("sayfa");
    if (!slug) {
      next.delete("category");
      const query = next.toString();
      return (query ? `/magaza?${query}` : "/magaza") as Route;
    }
    next.set("category", slug);
    return `/magaza?${next.toString()}` as Route;
  }

  return (
    <nav aria-label="Kategoriler" className="store-cats-wrap">
      <div className="store-cats">
        <Link href={hrefFor("")} className="store-cat" data-active={!active ? "true" : undefined}>
          Tümü
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={hrefFor(category.slug)}
            className="store-cat"
            data-active={active === category.slug ? "true" : undefined}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
