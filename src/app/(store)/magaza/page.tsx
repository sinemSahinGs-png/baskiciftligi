import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyCatalogState } from "@/components/catalog/empty-catalog-state";
import { CatalogGrid } from "@/components/catalog/catalog-grid";
import { CatalogSearch } from "@/components/catalog/catalog-search";
import { RecentlyViewed } from "@/components/catalog/recently-viewed";
import { StoreCategoryBar } from "@/components/storefront/store-category-bar";
import {
  StoreEditorial,
  StoreEmptySearch,
  StoreUploadBanner,
} from "@/components/storefront/store-editorial";
import { StoreHeroTitle } from "@/components/storefront/store-hero-title";
import { StoreResults } from "@/components/storefront/store-results";
import { StoreTrustFaq } from "@/components/storefront/store-trust-faq";
import { siteConfig } from "@/config/site";
import {
  listCategories,
  listCollections,
  listMaterials,
  listProducts,
  listProductsPage,
} from "@/domain/catalog/repository";
import { parseStoreQuery } from "@/domain/home/homepage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mağaza",
  description: `${siteConfig.name} koleksiyonu: ev objeleri, masaüstü tasarımları ve kişiye özel üretim.`,
  alternates: { canonical: "/magaza" },
  openGraph: {
    title: `${siteConfig.name} Mağaza`,
    description: siteConfig.description,
    url: "/magaza",
  },
};

export default async function StorePage(props: PageProps<"/magaza">) {
  const searchParams = await props.searchParams;
  const query = parseStoreQuery(searchParams);
  const [categories, collections, materials, page, recentPool] = await Promise.all([
    listCategories(),
    listCollections(),
    listMaterials(),
    listProductsPage(query),
    listProducts({ limit: 24 }),
  ]);
  const activeCollection = collections.find(
    (collection) => collection.slug === query.collection,
  );
  const featuredProduct =
    recentPool.find((product) => product.featured) ?? recentPool[0] ?? null;
  const hasActiveFilters = Boolean(
    query.query ||
      query.category ||
      query.collection ||
      query.kind ||
      query.inStock ||
      query.personalizable ||
      query.maxLeadDays ||
      query.minPriceMinor ||
      query.maxPriceMinor ||
      query.material,
  );
  const isGenuinelyEmpty =
    !hasActiveFilters && page.total === 0 && recentPool.length === 0;
  const title = activeCollection ? activeCollection.name : "3D BASKI KOLEKSİYONU";
  const lead = activeCollection
    ? activeCollection.description
    : "Hayal et. Tasarla. Gerçekleştir.";
  const leadCount = Math.min(8, page.items.length);
  const followCount = Math.min(8, Math.max(0, page.items.length - leadCount));
  const firstGroup = page.items.slice(0, leadCount);
  const secondGroup = page.items.slice(leadCount, leadCount + followCount);
  const restGroup = page.items.slice(leadCount + followCount);

  return (
    <main id="ana-icerik" className="store-page">
      <header className="store-masthead">
        <div className="shell">
          <p className="store-crumb">
            <Link href="/" className="hover:underline">
              Ana sayfa
            </Link>
            <span aria-hidden="true"> / </span>
            Mağaza
          </p>
          <div className="store-intro">
            <div>
              <p className="store-intro-kicker">MAĞAZA</p>
              <StoreHeroTitle title={title} />
              <p className="store-intro-lede">{lead}</p>
              <p className="store-intro-count">{page.total} ürün</p>
            </div>
            <div className="store-masthead-art" aria-hidden="true">
              <svg viewBox="0 0 160 180" fill="none">
                <rect
                  x="18"
                  y="22"
                  width="124"
                  height="136"
                  stroke="currentColor"
                  strokeOpacity="0.22"
                />
                <path
                  d="M80 34c22 10 34 32 34 56s-12 46-34 62c-22-16-34-38-34-62s12-46 34-56z"
                  stroke="currentColor"
                  strokeOpacity="0.7"
                />
                <path d="M48 90h64M80 34v118" stroke="#ff5a0a" strokeOpacity="0.9" />
                <circle cx="80" cy="90" r="3.5" fill="#ff5a0a" />
                <path d="M22 48h8M130 48h8M22 132h8M130 132h8" stroke="#ff5a0a" />
              </svg>
            </div>
          </div>
          <Suspense fallback={null}>
            <CatalogSearch className="max-w-none" tone="store" />
          </Suspense>
          <Suspense fallback={null}>
            <StoreCategoryBar categories={categories} />
          </Suspense>
        </div>
      </header>

      {isGenuinelyEmpty ? (
        <section className="shell pt-6" data-visual-landmark data-catalog-results>
          <EmptyCatalogState />
        </section>
      ) : (
        <div className="shell store-catalog" data-visual-landmark>
          <Suspense fallback={<p className="text-sm">Filtreler yükleniyor</p>}>
            <StoreResults
              categories={categories}
              collections={collections}
              materials={materials}
              productCount={page.total}
            >
              <section className="min-w-0 pt-5" data-visual-landmark data-catalog-results>
                <h2 className="sr-only">Ürünler</h2>
                {page.items.length > 0 ? (
                  <>
                    {page.items.some((product) => product.isDemo) ? (
                      <p className="mb-4 text-sm text-[color:var(--store-muted-dark)]">
                        Demo etiketli ürünler vitrin içindir.
                      </p>
                    ) : null}
                    <CatalogGrid products={firstGroup} priorityCount={2} tone="store" />
                    {!hasActiveFilters && featuredProduct ? (
                      <StoreEditorial product={featuredProduct} />
                    ) : null}
                    {secondGroup.length > 0 ? (
                      <CatalogGrid products={secondGroup} tone="store" />
                    ) : null}
                    {!hasActiveFilters ? <StoreUploadBanner /> : null}
                    {restGroup.length > 0 ? (
                      <CatalogGrid products={restGroup} tone="store" />
                    ) : null}
                    {page.pageCount > 1 ? (
                      <nav className="mt-10 flex gap-2" aria-label="Sayfalar">
                        {Array.from({ length: page.pageCount }, (_, index) => {
                          const pageNumber = index + 1;
                          const params = new URLSearchParams(
                            Object.entries(searchParams).flatMap(([key, value]) => {
                              const first = Array.isArray(value) ? value[0] : value;
                              return first ? [[key, first]] : [];
                            }),
                          );
                          params.set("sayfa", String(pageNumber));
                          return (
                            <Link
                              key={pageNumber}
                              href={`/magaza?${params.toString()}`}
                              className={
                                pageNumber === page.page
                                  ? "inline-flex size-11 items-center justify-center bg-[color:var(--store-orange)] text-[color:var(--store-black)]"
                                  : "inline-flex size-11 items-center justify-center border border-[color:var(--store-line-dark)]"
                              }
                            >
                              {pageNumber}
                            </Link>
                          );
                        })}
                      </nav>
                    ) : null}
                  </>
                ) : (
                  <StoreEmptySearch />
                )}
              </section>
            </StoreResults>
          </Suspense>
          <RecentlyViewed products={recentPool} />
        </div>
      )}
      {!isGenuinelyEmpty ? <StoreTrustFaq /> : null}
    </main>
  );
}
