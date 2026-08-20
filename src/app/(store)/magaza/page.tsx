import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";

import { FoundryGrid } from "@/components/brand/foundry-grid";
import { EmptyCatalogState } from "@/components/catalog/empty-catalog-state";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { CatalogGrid } from "@/components/catalog/catalog-grid";
import { CatalogSearch } from "@/components/catalog/catalog-search";
import { CategoryWorlds } from "@/components/catalog/category-worlds";
import { RecentlyViewed } from "@/components/catalog/recently-viewed";
import { ProductStage } from "@/components/catalog/product-stage";
import { PriceDisplay } from "@/components/commerce/price-display";
import { PageMasthead } from "@/components/motion/page-masthead";
import { siteConfig } from "@/config/site";
import {
  listCategories,
  listCollections,
  listProducts,
  listProductsPage,
} from "@/domain/catalog/repository";
import { parseStoreQuery } from "@/domain/home/homepage";
import { stageForCategory } from "@/domain/visual/stages";

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
  const [categories, collections, page, recentPool] = await Promise.all([
    listCategories(),
    listCollections(),
    listProductsPage(query),
    listProducts({ limit: 24 }),
  ]);
  const activeCollection = collections.find(
    (collection) => collection.slug === query.collection,
  );
  const featuredProducts = recentPool
    .filter((product) => product.featured)
    .slice(0, 3);
  const hasActiveFilters = Boolean(
    query.query ||
      query.category ||
      query.collection ||
      query.kind ||
      query.inStock ||
      query.personalizable ||
      query.maxLeadDays ||
      query.minPriceMinor ||
      query.maxPriceMinor,
  );
  const isGenuinelyEmpty =
    !hasActiveFilters && page.total === 0 && recentPool.length === 0;

  return (
    <main id="ana-icerik" className="pb-20">
      <header className="relative overflow-hidden bg-cobalt text-light-text">
        <FoundryGrid variant="fade" className="opacity-80" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[linear-gradient(90deg,transparent,rgb(122_66_244/0.45))]"
        />
        <div className="shell relative py-10 sm:py-14">
          <p className="text-sm text-white/80">
            <Link href="/" className="hover:underline">
              Ana sayfa
            </Link>
            <span aria-hidden="true"> / </span>
            Mağaza
          </p>
          <PageMasthead
            title={activeCollection ? activeCollection.name : "Tüm ürünler"}
            description={
              activeCollection?.description ??
              "Hazır ürünler ve siparişe göre üretilen parçalar. Filtreler adres satırında kalır."
            }
            titleClassName="display-title stack-title max-w-4xl"
            descriptionClassName="stack-body max-w-xl text-base leading-7 text-white/85"
          />
          <Suspense fallback={null}>
            <CatalogSearch className="mt-8 max-w-2xl" />
          </Suspense>
        </div>
      </header>

      {!hasActiveFilters && !isGenuinelyEmpty ? (
        <section className="shell pt-5 sm:pt-8" aria-labelledby="magaza-dunyalar">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2
              id="magaza-dunyalar"
              className="font-heading text-2xl font-bold sm:text-3xl"
            >
              Kategori dünyaları
            </h2>
            <p className="text-sm text-ink-secondary">{recentPool.length} ürün vitrinde</p>
          </div>
          <CategoryWorlds categories={categories} products={recentPool} limit={8} />
        </section>
      ) : null}

      {!activeCollection && !hasActiveFilters && featuredProducts.length > 0 ? (
        <section
          className="shell hidden pt-8 lg:block"
          aria-labelledby="magaza-koleksiyon"
        >
          <h2
            id="magaza-koleksiyon"
            className="font-heading text-2xl font-bold sm:text-3xl"
          >
            Öne çıkan koleksiyon
          </h2>
          <div className="mt-6 grid gap-3 lg:grid-cols-12">
            {featuredProducts[0] ? (
              <article className="lg:col-span-7">
                <ProductStage
                  stage={stageForCategory(featuredProducts[0].categorySlugs[0])}
                  src={featuredProducts[0].media[0]?.url}
                  alt={
                    featuredProducts[0].media[0]?.alt ?? featuredProducts[0].name
                  }
                  isolated={featuredProducts[0].media[0]?.isolated ?? false}
                  ratio="featured"
                  sizes="58vw"
                  className="rounded-xl"
                >
                  <Link
                    href={`/urun/${featuredProducts[0].slug}`}
                    className="absolute inset-0 z-10"
                    aria-label={`${featuredProducts[0].name} ürününü görüntüle`}
                  />
                  <div className="absolute inset-x-0 bottom-0 z-20 p-5 text-light-text">
                    <p className="font-heading text-2xl font-bold">
                      {featuredProducts[0].name}
                    </p>
                    <PriceDisplay
                      priceMinor={featuredProducts[0].priceMinor}
                      className="mt-1 text-light-text"
                    />
                  </div>
                </ProductStage>
              </article>
            ) : null}
            <div className="grid gap-3 lg:col-span-5">
              {featuredProducts.slice(1).map((product) => (
                <article key={product.id}>
                  <ProductStage
                    stage={stageForCategory(product.categorySlugs[0])}
                    src={product.media[0]?.url}
                    alt={product.media[0]?.alt ?? product.name}
                    isolated={product.media[0]?.isolated ?? false}
                    ratio="featuredCompact"
                    sizes="40vw"
                    className="rounded-lg"
                  >
                    <Link
                      href={`/urun/${product.slug}`}
                      className="absolute inset-0 z-10"
                      aria-label={`${product.name} ürününü görüntüle`}
                    />
                    <div className="absolute inset-x-0 bottom-0 z-20 p-4 text-light-text">
                      <p className="font-heading text-lg font-bold">
                        {product.name}
                      </p>
                      <PriceDisplay
                        priceMinor={product.priceMinor}
                        className="mt-1 text-light-text"
                      />
                    </div>
                  </ProductStage>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {isGenuinelyEmpty ? (
        <section className="shell pt-8" data-visual-landmark data-catalog-results>
          <EmptyCatalogState />
        </section>
      ) : (
        <>
      <div
        className="shell grid min-w-0 gap-5 pt-4 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10 lg:pt-8"
        data-visual-landmark
      >
        <aside className="min-w-0 lg:sticky lg:top-24 lg:h-fit">
          <Suspense fallback={<p className="text-sm text-ink-muted">Filtreler yükleniyor</p>}>
            <CatalogFilters
              categories={categories}
              collections={collections}
              productCount={page.total}
            />
          </Suspense>
        </aside>
        <section className="min-w-0" data-visual-landmark data-catalog-results>
          <h2 className="sr-only">Ürünler</h2>
          {page.items.length > 0 ? (
            <>
              {page.items.some((product) => product.isDemo) ? (
                <p className="mb-4 text-sm text-ink-secondary">
                  Demo etiketli ürünler vitrin içindir.
                </p>
              ) : null}
              <CatalogGrid products={page.items} priorityCount={4} />
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
                            ? "inline-flex size-11 items-center justify-center rounded-md bg-cobalt text-light-text"
                            : "inline-flex size-11 items-center justify-center rounded-md border border-hairline"
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
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <SearchX aria-hidden="true" className="size-8 text-ink-muted" />
              <h3 className="mt-4 font-heading text-2xl font-bold">Eşleşen ürün yok</h3>
              <p className="mt-2 max-w-md text-sm text-ink-secondary">
                Filtreleri azaltmayı dene. Yeni ürünler eklendikçe burada görünür.
              </p>
              <Link
                href="/magaza"
                className="mt-6 inline-flex min-h-11 items-center rounded-md bg-cobalt px-5 text-sm font-semibold text-light-text"
              >
                Tüm ürünleri göster
              </Link>
            </div>
          )}
        </section>
      </div>
      <RecentlyViewed products={recentPool} />
        </>
      )}
    </main>
  );
}
