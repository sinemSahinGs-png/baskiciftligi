import { Suspense } from "react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PackageOpen } from "lucide-react";

import { CatalogGrid } from "@/components/catalog/catalog-grid";
import { EmptyState } from "@/components/feedback/empty-state";
import { StoreCategoryBar } from "@/components/storefront/store-category-bar";
import { siteConfig } from "@/config/site";
import {
  getStorefrontCategory,
  storefrontCategories,
} from "@/domain/catalog/storefront-taxonomy";
import { listProducts } from "@/domain/catalog/repository";

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

  return (
    <main id="ana-icerik" className="store-page">
      <header className="store-masthead">
        <div className="shell">
          <p className="store-crumb">
            <Link href="/" className="hover:underline">
              Ana sayfa
            </Link>
            <span aria-hidden="true"> / </span>
            <Link href={"/magaza" as Route} className="hover:underline">
              Mağaza
            </Link>
            <span aria-hidden="true"> / </span>
            {category.name}
          </p>
          <div className="store-intro" data-has-art="false">
            <div>
              <p className="store-intro-kicker">{category.eyebrow}</p>
              <h1 className="store-intro-title">
                {category.name.toLocaleUpperCase("tr-TR")}
              </h1>
              <p className="store-intro-lede">{category.description}</p>
              {category.comingSoon ? (
                <p className="store-intro-count">Seçki hazırlanıyor</p>
              ) : (
                <p className="store-intro-count">{products.length} ürün</p>
              )}
            </div>
          </div>
          <Suspense fallback={null}>
            <StoreCategoryBar />
          </Suspense>
        </div>
      </header>

      <section className="shell pt-6 pb-16" aria-labelledby="kategori-urunler">
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
          <CatalogGrid products={products} priorityCount={1} tone="store" />
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
