import type { Metadata } from "next";

import { FavoritesView } from "@/components/catalog/favorites-view";
import { PageMasthead } from "@/components/motion/page-masthead";
import { siteConfig } from "@/config/site";
import { listProducts } from "@/domain/catalog/repository";

export const metadata: Metadata = {
  title: "Favoriler",
  description: `${siteConfig.name} üzerinde kaydettiğiniz ürünler ve modeller.`,
  alternates: { canonical: "/favoriler" },
  robots: { index: false, follow: false },
};

export default async function FavoritesPage() {
  const products = await listProducts();

  return (
    <main id="ana-icerik" className="min-h-[70vh] bg-porcelain">
      <header className="border-b border-hairline bg-optical">
        <div className="shell py-10 sm:py-14">
          <PageMasthead
            eyebrow="Kaydettiklerin"
            title="Favoriler"
            description="Beğendiğin tasarımlar bu tarayıcıda saklanır. Güncel ürün bilgileri katalogdan eşleştirilerek gösterilir."
            titleClassName="mt-4 font-heading text-5xl font-bold tracking-[-0.04em] sm:text-6xl"
            descriptionClassName="body-large mt-4 max-w-2xl"
          />
        </div>
      </header>
      <div className="shell py-10 sm:py-16">
        <FavoritesView products={products} />
      </div>
    </main>
  );
}
