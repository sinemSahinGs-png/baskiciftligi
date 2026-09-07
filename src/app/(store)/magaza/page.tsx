import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { SafeImage } from "@/components/media/safe-image";
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
  listCollections,
  listMaterials,
  listProducts,
  listProductsPage,
  getCatalogSnapshot,
} from "@/domain/catalog/repository";
import { storefrontFilterCategories } from "@/domain/catalog/storefront-taxonomy";
import { parseStoreQuery } from "@/domain/home/homepage";
import { resolveStorefrontCategoryImage } from "@/lib/catalog/storefront-category-image";

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
  const [collections, materials, page, recentPool, snapshot] = await Promise.all([
    listCollections(),
    listMaterials(),
    listProductsPage(query),
    listProducts({ limit: 24 }),
    getCatalogSnapshot(),
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
  const catalogUnavailable = snapshot.unavailable === true;
  const isGenuinelyEmpty =
    !catalogUnavailable &&
    !hasActiveFilters &&
    page.total === 0 &&
    recentPool.length === 0;
  const filterCategories = storefrontFilterCategories().map((category) => ({
    id: category.slug,
    slug: category.slug,
    name: category.name,
  }));
  const mastheadCover = resolveStorefrontCategoryImage("dekorasyon-yasam");
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
          <div className="store-intro" data-has-art={mastheadCover ? "true" : "false"}>
            <div>
              <p className="store-intro-kicker">MAĞAZA</p>
              <StoreHeroTitle title={title} />
              <p className="store-intro-lede">{lead}</p>
              <p className="store-intro-count">
                {catalogUnavailable
                  ? "Katalog şu anda okunamadı"
                  : isGenuinelyEmpty
                    ? "Koleksiyon yayına hazırlanıyor"
                    : `${page.total} ürün`}
              </p>
            </div>
            {mastheadCover ? (
              <div className="store-masthead-art" aria-hidden="true">
                <SafeImage
                  src={mastheadCover}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 28vw, 14rem"
                  className="object-cover object-center"
                />
              </div>
            ) : null}
          </div>
          <Suspense fallback={null}>
            <CatalogSearch className="max-w-none" tone="store" />
          </Suspense>
          <Suspense fallback={null}>
            <StoreCategoryBar priorityStrip />
          </Suspense>
        </div>
      </header>

      {catalogUnavailable ? (
        <section className="shell pt-6" data-visual-landmark data-catalog-results data-catalog-error="">
          <EmptyCatalogState failed />
        </section>
      ) : isGenuinelyEmpty ? (
        <section className="shell pt-6" data-visual-landmark data-catalog-results>
          <EmptyCatalogState />
        </section>
      ) : (
        <div className="shell store-catalog" data-visual-landmark>
          <Suspense fallback={<p className="text-sm">Filtreler yükleniyor</p>}>
            <StoreResults
              categories={filterCategories}
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
