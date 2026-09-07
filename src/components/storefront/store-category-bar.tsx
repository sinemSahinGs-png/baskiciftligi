"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { SafeImage } from "@/components/media/safe-image";
import { storePremiumAssets } from "@/components/storefront/store-premium-assets";
import type { Category } from "@/domain/catalog/types";

export function StoreCategoryBar({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryCategory = searchParams.get("category") ?? "";
  const pathCategory = pathname.startsWith("/magaza/")
    ? pathname.slice("/magaza/".length).split("/")[0]
    : "";
  const active = queryCategory || pathCategory;
  const wrapRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const current = wrapRef.current?.querySelector<HTMLElement>("[data-active='true']");
    current?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  return (
    <nav aria-label="Kategoriler" className="store-cats-wrap">
      <div className="store-cats-strip" aria-hidden="true">
        <SafeImage
          src={storePremiumAssets.categoryStrip}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 82rem"
          fetchPriority="low"
          className="object-cover object-center"
        />
      </div>
      <div ref={wrapRef} className="store-cats">
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
