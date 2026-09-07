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
    <main id="ana-icerik" className="store-page">
      <header className="store-masthead">
        <div className="shell py-10 sm:py-14">
          <PageMasthead
            eyebrow="Kaydettiklerin"
            title="Favoriler"
            description="Beğendiğin tasarımlar bu tarayıcıda saklanır. Güncel ürün bilgileri katalogdan eşleştirilerek gösterilir."
            titleClassName="store-intro-title mt-4"
            descriptionClassName="store-intro-lede mt-4"
          />
        </div>
      </header>
      <section className="shell py-10 sm:py-12" data-visual-landmark>
        <FavoritesView products={products} />
      </section>
    </main>
  );
}
