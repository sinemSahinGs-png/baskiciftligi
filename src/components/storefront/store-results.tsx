"use client";

import { useState, type ReactNode } from "react";

import { CatalogFilters } from "@/components/catalog/catalog-filters";
import type { Collection, Material } from "@/domain/catalog/types";

export function StoreResults({
  categories,
  collections,
  materials,
  productCount,
  children,
}: {
  categories: Array<{ id: string; slug: string; name: string }>;
  collections: Collection[];
  materials: Material[];
  productCount: number;
  children: ReactNode;
}) {
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <div className="store-results">
      <CatalogFilters
        categories={categories}
        collections={collections}
        materials={materials}
        productCount={productCount}
        view={view}
        onViewChange={setView}
      />
      <div className="store-results-main" data-store-view={view}>
        {children}
      </div>
    </div>
  );
}
