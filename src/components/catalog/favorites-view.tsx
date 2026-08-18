"use client";

import { useMemo } from "react";
import { Heart } from "lucide-react";

import { ProductCard } from "@/components/catalog/product-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { ProductGridSkeleton } from "@/components/feedback/loading-skeleton";
import { ModelCard } from "@/components/models/model-card";
import type { ModelCardData } from "@/components/models/model-card";
import { octoDemoModels } from "@/components/content/content-data";
import { siteConfig } from "@/config/site";
import type { Product } from "@/domain/catalog/types";
import { useFavoritesStore } from "@/stores/favorites-store";
import type { Route } from "next";

function demoModelCards(): ModelCardData[] {
  return octoDemoModels.map((model) => ({
    id: model.externalId,
    href: `/hazir-modeller/octo-demo/${model.externalId}` as Route,
    name: model.name,
    creator: siteConfig.studioLabel,
    category: model.category,
    source: "owned",
    license: "Demo · lisans yok",
    permission: "unverified",
  }));
}

export function FavoritesView({ products }: { products: Product[] }) {
  const productIds = useFavoritesStore((state) => state.productIds);
  const modelIds = useFavoritesStore((state) => state.modelIds);
  const hasHydrated = useFavoritesStore((state) => state.hasHydrated);
  const toggleModel = useFavoritesStore((state) => state.toggleModel);

  const favoriteProducts = useMemo(() => {
    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );

    return productIds
      .map((productId) => productsById.get(productId))
      .filter((product): product is Product => Boolean(product));
  }, [productIds, products]);

  const favoriteModels = useMemo(() => {
    const cards = demoModelCards();
    return cards.filter((card) => modelIds.includes(card.id));
  }, [modelIds]);

  if (!hasHydrated) {
    return <ProductGridSkeleton count={4} />;
  }

  if (favoriteProducts.length === 0 && favoriteModels.length === 0) {
    return (
      <EmptyState
        icon={<Heart aria-hidden="true" className="size-5" />}
        title="Henüz kaydedilmiş bir şey yok"
        description="Beğendiğin ürünleri ve incelenebilir modelleri burada gruplayarak saklayabilirsin."
        action={{ href: "/magaza", label: "Mağazayı keşfet" }}
      />
    );
  }

  return (
    <div aria-live="polite" className="space-y-14">
      <section>
        <h2 className="font-heading text-2xl font-bold">Ürünler</h2>
        {favoriteProducts.length > 0 ? (
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favoriteProducts.map((product) => (
              <li key={product.id} className="min-w-0">
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-secondary">
            Kaydedilmiş mağaza ürünü yok.
          </p>
        )}
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold">Yazdırılabilir modeller</h2>
        {favoriteModels.length > 0 ? (
          <ul className="mt-6 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {favoriteModels.map((model) => (
              <li key={model.id}>
                <ModelCard
                  model={model}
                  isFavorite
                  onFavorite={() => toggleModel(model.id)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-secondary">
            Kaydedilmiş model yok. Hazır modeller kütüphanesinden ekleyebilirsin.
          </p>
        )}
      </section>
    </div>
  );
}
