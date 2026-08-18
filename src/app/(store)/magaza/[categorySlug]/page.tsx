import type { Metadata } from "next";
import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { CatalogGrid } from "@/components/catalog/catalog-grid";
import { EmptyState } from "@/components/feedback/empty-state";
import { ProductStage } from "@/components/catalog/product-stage";
import { ClipReveal } from "@/components/motion/clip-reveal";
import { PageMasthead } from "@/components/motion/page-masthead";
import { ParallaxMedia } from "@/components/motion/parallax-media";
import { RevealHeading } from "@/components/motion/reveal-words";
import { StaggerGrid } from "@/components/motion/stagger-grid";
import {
  absoluteSiteUrl,
  serializeJsonLd,
} from "@/components/catalog/structured-data";
import { siteConfig } from "@/config/site";
import { demoCategories } from "@/domain/catalog/demo-data";
import {
  categoryAfterword,
  relatedCategorySlugs,
} from "@/domain/catalog/presentation";
import {
  getCategoryBySlug,
  listCategories,
  listProducts,
} from "@/domain/catalog/repository";
import { stageClass, stageForCategory } from "@/domain/visual/stages";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return demoCategories.map((category) => ({
    categorySlug: category.slug,
  }));
}

export async function generateMetadata(
  props: PageProps<"/magaza/[categorySlug]">,
): Promise<Metadata> {
  const { categorySlug } = await props.params;
  const category = await getCategoryBySlug(categorySlug);

  if (!category) {
    return {
      title: "Kategori bulunamadı",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: `/magaza/${category.slug}` },
    openGraph: {
      title: `${category.name} | ${siteConfig.name}`,
      description: category.description,
      url: `/magaza/${category.slug}`,
      images: category.imageUrl
        ? [{ url: category.imageUrl, alt: category.name }]
        : undefined,
    },
  };
}

export default async function CategoryPage(
  props: PageProps<"/magaza/[categorySlug]">,
) {
  const { categorySlug } = await props.params;
  const [category, products, categories] = await Promise.all([
    getCategoryBySlug(categorySlug),
    listProducts({ category: categorySlug }),
    listCategories(),
  ]);

  if (!category) {
    notFound();
  }

  const subcategorySlugs = relatedCategorySlugs(category.slug);
  const subcategories = subcategorySlugs
    .map((slug) => categories.find((item) => item.slug === slug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const related = categories
    .filter(
      (item) =>
        item.slug !== category.slug &&
        !subcategorySlugs.includes(item.slug),
    )
    .slice(0, 4);
  const afterword = categoryAfterword(category);
  const stage = stageForCategory(category.slug);
  const categoryUrl = absoluteSiteUrl(`/magaza/${category.slug}`);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
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
          {
            "@type": "ListItem",
            position: 3,
            name: category.name,
            item: categoryUrl,
          },
        ],
      },
      {
        "@type": "ItemList",
        name: `${category.name} ürünleri`,
        url: categoryUrl,
        numberOfItems: products.length,
        itemListElement: products.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: product.name,
          item: absoluteSiteUrl(`/urun/${product.slug}`),
        })),
      },
    ],
  };

  return (
    <main id="ana-icerik" className="pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />

      <header
        className={cn(
          "relative overflow-hidden text-light-text",
          stageClass[stage],
        )}
        style={{
          background:
            "linear-gradient(160deg, color-mix(in srgb, var(--stage) 88%, black), var(--stage-2))",
        }}
      >
        <div aria-hidden="true" className="grid-fade absolute inset-0 opacity-80" />
        <div className="shell relative grid items-end gap-8 py-12 lg:grid-cols-[1.2fr_0.8fr] sm:py-16">
          <div>
            <Breadcrumbs
              className="text-white/75 [&_svg]:text-white/40"
              items={[
                { label: "Mağaza", href: "/magaza" },
                { label: category.name },
              ]}
            />
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <p className="text-sm text-white/75">{category.eyebrow}</p>
              {category.isDemo ? (
                <span className="rounded-md bg-midnight/50 px-2.5 py-1 text-xs font-semibold">
                  Demo kategori
                </span>
              ) : null}
            </div>
            <PageMasthead
              title={category.name}
              description={category.description}
              titleClassName="display-title mt-4"
              descriptionClassName="mt-5 max-w-2xl text-base leading-7 text-white/80"
            />
            {subcategories.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-2">
                {subcategories.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/magaza/${item.slug}`}
                      className="inline-flex min-h-11 items-center rounded-md border border-white/25 px-4 text-sm font-semibold"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {category.imageUrl ? (
            <ParallaxMedia className="min-h-56 rounded-xl">
              <ProductStage
                stage={stage}
                src={category.imageUrl}
                alt=""
                isolated={category.imageUrl.endsWith("heykel.svg")}
                sizes="(min-width: 1024px) 36vw, 100vw"
                className="min-h-56 rounded-xl"
              />
            </ParallaxMedia>
          ) : null}
        </div>
      </header>

      <section
        aria-labelledby="category-products-heading"
        className="shell pt-10 sm:pt-14"
      >
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <RevealHeading
            as="h2"
            id="category-products-heading"
            text="Kategorideki ürünler"
            className="font-heading text-3xl font-bold"
          />
          <p className="text-sm text-ink-secondary">{products.length} ürün</p>
        </div>

        {products.length > 0 ? (
          <CatalogGrid products={products} priorityCount={3} featuredFirst />
        ) : (
          <EmptyState
            icon={<PackageOpen aria-hidden="true" className="size-5" />}
            title="Bu seçki hazırlanıyor"
            description="Kategori yayında; ürünler eklendikçe burada listelenecek."
            action={{ href: "/magaza", label: "Tüm ürünleri gör" }}
          />
        )}
      </section>

      {related.length > 0 ? (
        <section className="shell mt-20" aria-labelledby="ilgili-kategoriler">
          <RevealHeading
            as="h2"
            id="ilgili-kategoriler"
            text="İlgili kategoriler"
            className="font-heading text-3xl font-bold"
          />
          <StaggerGrid as="ul" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => {
              const relatedStage = stageForCategory(item.slug);
              return (
                <li key={item.id} data-motion-item="idle" className="motion-item">
                  <ClipReveal variant="left">
                  <Link
                    href={`/magaza/${item.slug}`}
                    className={cn(
                      "block overflow-hidden rounded-[1.2rem] p-5",
                      stageClass[relatedStage],
                      relatedStage === "porcelain"
                        ? "text-dark-text"
                        : "text-light-text",
                    )}
                    style={{
                      background:
                        "linear-gradient(145deg, var(--stage), color-mix(in srgb, black 22%, var(--stage-2)))",
                    }}
                  >
                    <p className="text-xs opacity-70">{item.eyebrow}</p>
                    <p className="mt-2 font-heading text-xl font-bold">{item.name}</p>
                  </Link>
                  </ClipReveal>
                </li>
              );
            })}
          </StaggerGrid>
        </section>
      ) : null}

      <section className="shell mt-20 max-w-3xl pb-8" aria-labelledby="kategori-seo">
        <RevealHeading
          as="h2"
          id="kategori-seo"
          text={afterword.title}
          className="font-heading text-3xl font-bold"
        />
        {afterword.paragraphs.map((paragraph) => (
          <p key={paragraph} className="mt-4 text-sm leading-7 text-ink-secondary">
            {paragraph}
          </p>
        ))}
      </section>
    </main>
  );
}
