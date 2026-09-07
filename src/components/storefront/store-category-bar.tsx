"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  storefrontCategories,
  storefrontSlugFromSource,
} from "@/domain/catalog/storefront-taxonomy";

export function StoreCategoryBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryCategory = searchParams.get("category") ?? "";
  const pathCategory = pathname.startsWith("/kategori/")
    ? pathname.slice("/kategori/".length).split("/")[0]
    : pathname.startsWith("/magaza/")
      ? pathname.slice("/magaza/".length).split("/")[0]
      : "";
  const active =
    storefrontSlugFromSource(queryCategory || pathCategory) ??
    (queryCategory || pathCategory);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = wrapRef.current?.querySelector<HTMLElement>("[data-active='true']");
    current?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  return (
    <nav aria-label="Kategoriler" className="store-cats-wrap">
      <div ref={wrapRef} className="store-cats">
        <Link
          href={"/magaza" as Route}
          className="store-cat"
          data-active={!active ? "true" : undefined}
        >
          Tümü
        </Link>
        {storefrontCategories.map((category) => (
          <Link
            key={category.slug}
            href={category.href}
            className="store-cat"
            data-active={active === category.slug ? "true" : undefined}
          >
            {category.name}
            {category.comingSoon ? (
              <span className="store-cat-soon"> Yakında</span>
            ) : null}
          </Link>
        ))}
      </div>
    </nav>
  );
}
