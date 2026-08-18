"use client";

import { ProductCard } from "@/components/catalog/product-card";
import { StaggerGrid } from "@/components/motion/stagger-grid";
import type { Product } from "@/domain/catalog/types";
import { cn } from "@/lib/utils";

interface CatalogGridProps {
  products: Product[];
  priorityCount?: number;
  featuredFirst?: boolean;
}

export function CatalogGrid({
  products,
  priorityCount = 0,
  featuredFirst = false,
}: CatalogGridProps) {
  const resultKey = products.map((product) => product.id).join();

  return (
    <StaggerGrid
      key={resultKey}
      as="ul"
      className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 md:grid-cols-3 xl:grid-cols-4"
    >
      {products.map((product, index) => (
        <li
          key={product.id}
          data-motion-item="idle"
          className={cn(
            "motion-item min-w-0",
            featuredFirst && index === 0 && "md:col-span-1",
          )}
        >
          <ProductCard
            product={product}
            priority={index < priorityCount}
            featured={featuredFirst && index === 0}
          />
        </li>
      ))}
    </StaggerGrid>
  );
}
