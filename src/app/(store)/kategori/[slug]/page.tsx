import type { Route } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { CatalogGrid } from "@/components/catalog/catalog-grid";
import { EmptyState } from "@/components/feedback/empty-state";
import { SafeImage } from "@/components/media/safe-image";
import { WordReveal } from "@/components/motion/premium";
import { siteConfig } from "@/config/site";
import {
  getStorefrontCategory,
  storefrontCategories,
} from "@/domain/catalog/storefront-taxonomy";
import { listProducts } from "@/domain/catalog/repository";
import { resolveStorefrontCategoryImage } from "@/lib/catalog/storefront-category-image";
import { PackageOpen } from "lucide-react";

export function generateStaticParams() {
  return storefrontCategories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata(props: PageProps<"/kategori/[slug]">) {
  const { slug } = await props.params;
  const category = getStorefrontCategory(slug);
  if (!category) {
    return { title: "Kategori bulunamadı", robots: { index: false, follow: false } };
  }
  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: category.href },
    openGraph: {
      title: `${category.name} | ${siteConfig.name}`,
      description: category.description,
      url: category.href,
    },
  };
}

export default async function StorefrontCategoryPage(
  props: PageProps<"/kategori/[slug]">,
) {
  const { slug } = await props.params;
  const category = getStorefrontCategory(slug);
  if (!category) notFound();

  const products = category.comingSoon
    ? []
    : await listProducts({ category: category.slug });
  const cover = resolveStorefrontCategoryImage(category.slug);

  return (
    <main id="ana-icerik" className="store-page">
      <header className="store-masthead">
        <div className="shell store-category-masthead">
          <Breadcrumbs
            items={[
              { label: "Mağaza", href: "/magaza" },
              { label: category.name },
            ]}
          />
          <p className="store-intro-kicker mt-5">{category.eyebrow}</p>
          <WordReveal
            as="h1"
            className="store-intro-title mt-3"
            text={category.name.toLocaleUpperCase("tr-TR")}
          />
          <p className="store-intro-lede mt-4">{category.description}</p>
          {category.comingSoon ? (
            <p className="store-intro-count mt-3">Seçki hazırlanıyor</p>
          ) : (
            <p className="store-intro-count mt-3">{products.length} ürün</p>
          )}
          {cover ? (
            <div className="store-category-cover" aria-hidden="true">
              <SafeImage
                src={cover}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 42vw"
                className="object-cover object-center"
              />
            </div>
          ) : (
            <div className="store-category-fallback" aria-hidden="true" />
          )}
        </div>
      </header>

      <section className="shell pt-8 pb-16" aria-labelledby="kategori-urunler">
        <h2 id="kategori-urunler" className="sr-only">
          {category.name} ürünleri
        </h2>
        {category.comingSoon ? (
          <EmptyState
            icon={<PackageOpen aria-hidden="true" className="size-5" />}
            title="Bu seçki hazırlanıyor"
            description="Kategori vitrinde yerini aldı. Ürünler eklendikçe burada listelenir; sahte ürün gösterilmez."
            action={{ href: "/magaza" as Route, label: "Tüm ürünleri gör" }}
          />
        ) : products.length > 0 ? (
          <CatalogGrid products={products} priorityCount={2} tone="store" />
        ) : (
          <EmptyState
            icon={<PackageOpen aria-hidden="true" className="size-5" />}
            title="Bu seçkide henüz yayınlanan ürün yok"
            description="Kayıtlar mevcut kategorilerinden okunur. Yeni ürün eklendiğinde burada görünür."
            action={{ href: "/magaza" as Route, label: "Tüm ürünleri gör" }}
          />
        )}
      </section>
    </main>
  );
}
