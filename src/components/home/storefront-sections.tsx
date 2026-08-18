import type { Route } from "next";
import Link from "next/link";

import { FoundryGrid } from "@/components/brand/foundry-grid";
import { CatalogGrid } from "@/components/catalog/catalog-grid";
import { CategoryCard } from "@/components/catalog/category-card";
import { ProductStage } from "@/components/catalog/product-stage";
import { PriceDisplay } from "@/components/commerce/price-display";
import { FaqSection } from "@/components/home/faq";
import { SectionIntro } from "@/components/home/section-intro";
import { ClipReveal } from "@/components/motion/clip-reveal";
import { RevealBlock } from "@/components/motion/reveal-copy";
import { ScrollSection, SectionAtmosphere } from "@/components/motion/scroll-section";
import { StaggerGrid } from "@/components/motion/stagger-grid";
import { siteConfig } from "@/config/site";
import type { Category, Product } from "@/domain/catalog/types";
import {
  homepageCorporateOffers,
  homepageDemoReviews,
  homepageFeaturedCollections,
  homepageGallery,
  homepagePrintLibrary,
  homepageShopCategorySlugs,
} from "@/domain/home/homepage";
import { stageForCategory, type StagePreset } from "@/domain/visual/stages";
import { cn } from "@/lib/utils";

export { ThreePathsSection } from "@/components/home/three-paths-section";
export { UploadPromoSection } from "@/components/home/upload-promo-section";
export { ProcessSection } from "@/components/home/process-section";
export { MaterialsSection } from "@/components/home/materials-section";

export function FeaturedCollectionsSection({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const cards = homepageFeaturedCollections
    .map((item) => {
      const category = categories.find((entry) => entry.slug === item.slug);
      const product =
        products.find(
          (entry) =>
            entry.featured && entry.categorySlugs.includes(item.slug),
        ) ??
        products.find((entry) => entry.categorySlugs.includes(item.slug));
      return category && product ? { ...item, category, product } : null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (cards.length === 0) {
    return null;
  }

  const [primary, ...rest] = cards;

  return (
    <ScrollSection className="atmosphere-porcelain section-space-start relative overflow-hidden">
      <SectionAtmosphere tone="cobalt" />
      <div className="shell relative">
        <SectionIntro
          title="Renk sahnesinde koleksiyon"
          description="Büyük nesne önde. Fiyat ikinci planda."
        />
        <div className="grid gap-4 lg:grid-cols-12">
          {primary ? (
            <article className="group/card lg:col-span-7">
              <ClipReveal variant="left" className="rounded-xl">
                <ProductStage
                  stage={stageForCategory(primary.slug)}
                  src={primary.product.media[0]?.url}
                  alt={primary.product.media[0]?.alt ?? primary.product.name}
                  isolated={primary.product.media[0]?.isolated ?? false}
                  grid
                  ratio="featured"
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="rounded-xl"
                >
                  <Link
                    href={`/urun/${primary.product.slug}` as Route}
                    className="absolute inset-0 z-10"
                    aria-label={`${primary.product.name} ürününü görüntüle`}
                  />
                  <div className="absolute inset-x-0 bottom-0 z-20 flex flex-wrap items-end justify-between gap-4 p-6 text-light-text sm:p-8">
                    <div>
                      <p className="text-sm text-white/70">{primary.title}</p>
                      <h3 className="mt-2 font-heading text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
                        {primary.product.name}
                      </h3>
                      <PriceDisplay
                        priceMinor={primary.product.priceMinor}
                        className="mt-3 text-light-text"
                      />
                    </div>
                    <Link
                      href={`/urun/${primary.product.slug}` as Route}
                      className="inline-flex min-h-11 items-center rounded-md bg-coral px-5 text-sm font-semibold"
                    >
                      İncele
                    </Link>
                  </div>
                </ProductStage>
              </ClipReveal>
            </article>
          ) : null}
          <div className="grid gap-4 lg:col-span-5">
            {rest.map((item, index) => (
              <article key={item.slug} className="group/card">
                <ClipReveal variant={index === 0 ? "up" : "scale"} className="rounded-lg">
                  <ProductStage
                    stage={stageForCategory(item.slug)}
                    src={item.product.media[0]?.url}
                    alt={item.product.media[0]?.alt ?? item.product.name}
                    isolated={item.product.media[0]?.isolated ?? false}
                    ratio="featuredCompact"
                    sizes="40vw"
                    className="rounded-lg"
                  >
                    <Link
                      href={`/urun/${item.product.slug}` as Route}
                      className="absolute inset-0 z-10"
                      aria-label={`${item.product.name} ürününü görüntüle`}
                    />
                    <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-3 p-5 text-light-text">
                      <div>
                        <h3 className="font-heading text-xl font-bold sm:text-2xl">
                          {item.product.name}
                        </h3>
                        <PriceDisplay
                          priceMinor={item.product.priceMinor}
                          className="mt-1 text-light-text"
                        />
                      </div>
                      <Link
                        href={`/urun/${item.product.slug}` as Route}
                        className="text-sm font-semibold underline-offset-4 hover:underline"
                      >
                        İncele
                      </Link>
                    </div>
                  </ProductStage>
                </ClipReveal>
              </article>
            ))}
          </div>
        </div>
      </div>
    </ScrollSection>
  );
}

export function FeaturedProductsSection({ products }: { products: Product[] }) {
  const featured = products.filter((product) => product.featured).slice(0, 8);
  const visible = featured.length > 0 ? featured : products.slice(0, 8);

  return (
    <section id="one-cikan-urunler" className="atmosphere-porcelain section-space-end scroll-mt-24">
      <div className="shell">
        <SectionIntro
          title="Öne çıkan ürünler"
          description="Her nesne kendi sahnesinde."
          action={{ href: "/magaza" as Route, label: "Tüm ürünleri gör" }}
        />
        {visible.some((product) => product.isDemo) ? (
          <p className="mb-6 text-sm text-ink-secondary">
            Demo etiketli kayıtlar vitrin içindir; gerçek sipariş oluşturmaz.
          </p>
        ) : null}
        <CatalogGrid products={visible} priorityCount={2} featuredFirst />
      </div>
    </section>
  );
}

export function CategoriesSection({
  categories,
  products,
}: {
  categories: Category[];
  products: Product[];
}) {
  const counts = new Map<string, number>();
  for (const product of products) {
    for (const slug of product.categorySlugs) {
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }
  const visible = homepageShopCategorySlugs
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter((category): category is Category => Boolean(category));

  return (
    <section className="atmosphere-porcelain section-space-tight">
      <div className="shell">
        <SectionIntro
          title="Kategori dünyaları"
          description="Her seçki kendi sahnesinde durur."
        />
        <StaggerGrid className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {visible.map((category, index) => {
            const product = products.find((entry) =>
              entry.categorySlugs.includes(category.slug),
            );
            return (
              <div key={category.id} data-motion-item="idle" className="motion-item min-w-0">
                <CategoryCard
                  category={category}
                  index={index}
                  count={counts.get(category.slug)}
                  imageUrl={
                    product?.media[0]?.url ??
                    category.heroMediaUrl ??
                    category.imageUrl
                  }
                />
              </div>
            );
          })}
        </StaggerGrid>
      </div>
    </section>
  );
}

export function PrintLibrarySection() {
  return (
    <ScrollSection className="atmosphere-violet relative overflow-hidden section-space">
      <SectionAtmosphere tone="violet" />
      <FoundryGrid variant="fade" />
      <div className="shell relative">
        <SectionIntro
          light
          title="Modelini seç, biz üretelim."
          description={`${siteConfig.collectionLabel} kobalt; lisanslı iş mercan; Thingiverse ayrı ve nötr.`}
          action={{ href: "/hazir-modeller" as Route, label: "Hazır modeller" }}
        />
        <StaggerGrid className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {homepagePrintLibrary.map((model) => (
            <article key={model.id} data-motion-item="idle" className="motion-item flex flex-col">
              <ClipReveal variant="up" className="rounded-lg">
                <ProductStage
                  stage="violet"
                  src={model.imageUrl}
                  alt=""
                  isolated
                  ratio="square"
                  className="rounded-lg"
                />
              </ClipReveal>
              <p className="mt-3 text-xs text-muted-light">
                {model.creator} · {model.licenseLabel}
              </p>
              <h3 className="mt-1 text-lg font-semibold">{model.name}</h3>
              <PriceDisplay
                priceMinor={model.startingPriceMinor}
                className="mt-1"
              />
              <Link
                href={model.href}
                className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold underline-offset-4 hover:underline"
              >
                Üretim seçeneklerini belirle
              </Link>
            </article>
          ))}
        </StaggerGrid>
        <aside className="mt-10 border-t border-white/15 pt-6 text-sm text-muted-light">
          Thingiverse yalnız resmî API ile ayrı sekmede keşfedilir. Dış modeller
          kazınmaz ve izin doğrulanmadan satılmaz.
        </aside>
      </div>
    </ScrollSection>
  );
}

export function B2bSection() {
  return (
    <ScrollSection className="atmosphere-foundry relative overflow-hidden">
      <SectionAtmosphere tone="carbon" />
      <FoundryGrid variant="corner" />
      <div className="shell relative grid gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div>
          <p className="eyebrow">Kurumsal dökümhane</p>
          <SectionIntro
            light
            title="Tekrarlı üretim"
            description="Promosyon, prototip ve parti işleri teklif bazlı yürür. Kapasite iddiası yok."
          />
          <Link
            href={"/kurumsal-uretim" as Route}
            className="inline-flex min-h-12 items-center rounded-md bg-orange px-6 text-sm font-semibold text-midnight"
          >
            Kurumsal brief
          </Link>
        </div>
        <StaggerGrid as="ul" className="grid gap-px bg-white/10 sm:grid-cols-2">
          {homepageCorporateOffers.map((item) => (
            <li key={item.title} data-motion-item="idle" className="motion-item bg-carbon p-5">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-light">{item.description}</p>
            </li>
          ))}
        </StaggerGrid>
      </div>
    </ScrollSection>
  );
}

export function SocialProofSection() {
  return (
    <section className="atmosphere-lavender section-space-tight">
      <div className="shell">
        <SectionIntro
          title="İşaretli demo yorumlar"
          description="Puan veya müşteri sayısı uydurulmaz. Aşağıdaki metinler vitrin demosudur."
        />
        <StaggerGrid className="grid gap-8 md:grid-cols-3">
          {homepageDemoReviews.map((review) => (
            <RevealBlock key={review.id} className="motion-item">
              <figure>
                <blockquote className="font-heading text-xl leading-8 font-semibold tracking-[-0.03em] sm:text-2xl">
                  “{review.quote}”
                </blockquote>
                <figcaption className="mt-4 text-sm text-ink-secondary">
                  {review.name}, {review.city}
                  <span className="mt-1 block text-xs text-ink-muted">
                    Demo · {review.product}
                  </span>
                </figcaption>
              </figure>
            </RevealBlock>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}

export function GallerySection() {
  const stages: StagePreset[] = ["cobalt", "coral", "cyan", "violet"];
  return (
    <section className="atmosphere-porcelain section-space-tight">
      <div className="shell">
        <SectionIntro
          title="Dijitalden fiziksel ürüne"
          description="Müşteri fotoğrafları izin alınana kadar demo görsellerle tutulur."
        />
        <StaggerGrid className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {homepageGallery.map((item, index) => (
            <figure
              key={item.id}
              data-motion-item="idle"
              className={cn("motion-item", index === 0 ? "col-span-2" : undefined)}
            >
              <ClipReveal variant={index === 0 ? "left" : "up"} className="rounded-lg">
                <ProductStage
                  stage={stages[index % stages.length]}
                  src={item.imageUrl}
                  alt=""
                  isolated={"isolated" in item ? item.isolated : false}
                  ratio={index === 0 ? "featured" : "featuredCompact"}
                  className="rounded-lg"
                >
                  <figcaption className="absolute inset-x-0 bottom-0 z-10 p-4 text-light-text">
                    <p className="text-sm font-semibold">{item.title}</p>
                  </figcaption>
                </ProductStage>
              </ClipReveal>
            </figure>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}

export { FaqSection };
