import { CategoryCard } from "@/components/catalog/category-card";
import { StaggerGrid, StaggerItem } from "@/components/motion/stagger-grid";
import type { Category, Product } from "@/domain/catalog/types";

export function CategoryWorlds({
  categories,
  products,
  limit = 8,
}: {
  categories: Category[];
  products: Product[];
  limit?: number;
}) {
  const counts = new Map<string, number>();
  for (const product of products) {
    for (const slug of product.categorySlugs) {
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }

  const visible = categories.slice(0, limit);

  if (visible.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Kategori dünyaları">
      <StaggerGrid
        as="ul"
        className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 xl:grid-cols-4 max-md:[&>li:nth-child(n+5)]:hidden"
      >
        {visible.map((category, index) => {
          return (
            <StaggerItem as="li" key={category.id} className="min-w-0">
              <CategoryCard
                category={category}
                index={index}
                count={counts.get(category.slug)}
                imageUrl={category.imageUrl}
              />
            </StaggerItem>
          );
        })}
      </StaggerGrid>
    </nav>
  );
}
