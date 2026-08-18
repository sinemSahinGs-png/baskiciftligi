import { CategoryCard } from "@/components/catalog/category-card";
import { StaggerGrid } from "@/components/motion/stagger-grid";
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
      <StaggerGrid as="ul" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {visible.map((category, index) => {
          const product = products.find((item) =>
            item.categorySlugs.includes(category.slug),
          );
          return (
            <li key={category.id} data-motion-item="idle" className="motion-item min-w-0">
              <CategoryCard
                category={category}
                index={index}
                count={counts.get(category.slug)}
                imageUrl={product?.media[0]?.url ?? category.imageUrl}
              />
            </li>
          );
        })}
      </StaggerGrid>
    </nav>
  );
}
