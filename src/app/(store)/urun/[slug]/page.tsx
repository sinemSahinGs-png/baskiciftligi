import type { Metadata, Route } from "next";
import { notFound } from "next/navigation";
import { Clock3, PackageCheck, Truck } from "lucide-react";

import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { CatalogGrid } from "@/components/catalog/catalog-grid";
import { ProductConfigurator } from "@/components/catalog/product-configurator";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { ProductInfo } from "@/components/catalog/product-info";
import { ClipReveal } from "@/components/motion/clip-reveal";
import { MotionScope } from "@/components/motion/motion-scope";
import { RevealCopy } from "@/components/motion/reveal-copy";
import { RevealHeading } from "@/components/motion/reveal-words";
import {
  RecentlyViewed,
  RecentlyViewedTracker,
} from "@/components/catalog/recently-viewed";
import {
  absoluteSiteUrl,
  createProductStructuredData,
  serializeJsonLd,
} from "@/components/catalog/structured-data";
import {
  getCategoryBySlug,
  getProductBySlug,
  listProducts,
} from "@/domain/catalog/repository";
import { stageClass, stageForProduct } from "@/domain/visual/stages";
import { cn } from "@/lib/utils";

const badgeLabels = {
  new: "Yeni",
  bestseller: "Öne çıkan",
  limited: "Sınırlı",
} as const;

export async function generateMetadata(
  props: PageProps<"/urun/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Ürün bulunamadı",
      robots: { index: false, follow: false },
    };
  }

  const images = product.media
    .filter((media) => media.type === "image")
    .map((media) => ({ url: media.url, alt: media.alt || product.name }));

  return {
    title: { absolute: product.seoTitle },
    description: product.seoDescription,
    alternates: { canonical: `/urun/${product.slug}` },
    openGraph: {
      title: product.seoTitle,
      description: product.seoDescription,
      url: `/urun/${product.slug}`,
      images: images.length > 0 ? images : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.seoTitle,
      description: product.seoDescription,
      images: images[0]?.url ? [images[0].url] : undefined,
    },
  };
}

export default async function ProductPage(props: PageProps<"/urun/[slug]">) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const primaryCategorySlug = product.categorySlugs[0];
  const [category, relatedCandidates, recentPool] = await Promise.all([
    primaryCategorySlug
      ? getCategoryBySlug(primaryCategorySlug)
      : Promise.resolve(undefined),
    listProducts({
      category: primaryCategorySlug,
      limit: 8,
    }),
    listProducts({ limit: 24 }),
  ]);
  const relatedProducts = relatedCandidates
    .filter((candidate) => candidate.id !== product.id)
    .slice(0, 4);
  const stage = stageForProduct(product);
  const productStructuredData = createProductStructuredData(product);
  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Ana sayfa",
        item: absoluteSiteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Mağaza",
        item: absoluteSiteUrl("/magaza"),
      },
      ...(category
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: category.name,
              item: absoluteSiteUrl(`/magaza/${category.slug}`),
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: category ? 4 : 3,
        name: product.name,
        item: absoluteSiteUrl(`/urun/${product.slug}`),
      },
    ],
  };

  return (
    <main id="ana-icerik" className="relative pb-32 lg:pb-24">
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-[32rem]",
          stageClass[stage],
        )}
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--stage) 28%, var(--porcelain)), transparent)",
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(productStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbStructuredData),
        }}
      />

      <article className="shell pt-8 sm:pt-12">
        <RecentlyViewedTracker slug={product.slug} />
        <Breadcrumbs
          items={[
            { label: "Mağaza", href: "/magaza" },
            ...(category
              ? [
                  {
                    label: category.name,
                    href: `/magaza/${category.slug}` as Route,
                  },
                ]
              : []),
            { label: product.name },
          ]}
        />

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)] lg:gap-14">
          <ClipReveal variant="up" className="min-w-0">
            <ProductGallery
              media={product.media}
              productName={product.name}
              stage={stage}
            />
          </ClipReveal>

          <MotionScope className="lg:sticky lg:top-24">
            <div className="flex flex-wrap gap-2">
              {product.isDemo ? (
                <span className="rounded-md bg-coral/15 px-3 py-1 text-xs font-semibold text-coral">
                  Demo ürün
                </span>
              ) : null}
              {product.badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-md border border-hairline bg-optical px-3 py-1 text-xs font-semibold text-ink-secondary"
                >
                  {badgeLabels[badge]}
                </span>
              ))}
            </div>

            <RevealHeading
              as="h1"
              text={product.name}
              className="mt-5 font-heading text-4xl font-bold tracking-[-0.04em] sm:text-5xl"
            />
            <RevealCopy
              text={product.shortDescription}
              className="mt-4 text-base leading-7 text-muted-foreground"
            />

            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-hairline bg-paper p-4">
                <dt className="text-sm text-muted-foreground">Üretim tipi</dt>
                <dd className="mt-1 font-semibold">
                  {product.kind === "made_to_order"
                    ? "Siparişe göre"
                    : "Hazır stok"}
                </dd>
              </div>
              <div className="rounded-lg border border-hairline bg-paper p-4">
                <dt className="text-sm text-muted-foreground">Ürün kodu</dt>
                <dd className="tabular mt-1 truncate font-semibold">
                  {product.sku}
                </dd>
              </div>
            </dl>

            {product.isDemo ? (
              <p className="mt-5 rounded-md bg-coral/10 px-4 py-3 text-sm leading-6 text-ink-secondary">
                Bu ürün ve stok bilgileri mağaza akışını göstermek için demo
                olarak sunulur; gerçek bir satış kaydı değildir.
              </p>
            ) : null}

            <div className="mt-7">
              <ProductConfigurator product={product} />
            </div>
          </MotionScope>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <ProductInfo product={product} />
          <ul className="space-y-3 lg:sticky lg:top-24 lg:self-start">
            <li className="flex gap-3 border-t border-hairline py-4">
              <PackageCheck
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-ink"
              />
              <div>
                <p className="text-sm font-semibold">Stok doğrulaması</p>
                <p className="mt-1 text-sm leading-6 text-ink-secondary">
                  Seçenek ve adet uygunluğu sepette sunucudan yeniden alınır.
                </p>
              </div>
            </li>
            <li className="flex gap-3 border-t border-hairline py-4">
              <Clock3
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-ink"
              />
              <div>
                <p className="text-sm font-semibold">Planlı hazırlık</p>
                <p className="mt-1 text-sm leading-6 text-ink-secondary">
                  Tahmini hazırlık süresi {product.productionLeadTimeDays.min}–
                  {product.productionLeadTimeDays.max} iş günüdür.
                </p>
              </div>
            </li>
            <li className="flex gap-3 border-t border-hairline py-4">
              <Truck
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-ink"
              />
              <div>
                <p className="text-sm font-semibold">Teslimat</p>
                <p className="mt-1 text-sm leading-6 text-ink-secondary">
                  Kargo tahmini sepet özetinde hesaplanır. Sahte kargo süresi
                  gösterilmez.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </article>

      {relatedProducts.length > 0 ? (
        <section
          aria-labelledby="related-products-heading"
          className="shell mt-20 sm:mt-28"
        >
          <RevealHeading
            as="h2"
            id="related-products-heading"
            text="Benzer tasarımlar"
            className="mt-2 mb-7 font-heading text-3xl font-bold"
          />
          <CatalogGrid products={relatedProducts} />
        </section>
      ) : null}

      <RecentlyViewed
        products={recentPool.filter((item) => item.id !== product.id)}
      />
    </main>
  );
}
