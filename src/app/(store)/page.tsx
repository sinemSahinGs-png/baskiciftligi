import type { Metadata } from "next";

import { Hero } from "@/components/home/hero";
import {
  B2bSection,
  CategoriesSection,
  FeaturedProductsSection,
  FaqSection,
  FinalCtaSection,
  IdeaSearchSection,
  MaterialsSection,
  ProcessSection,
  ReadyModelsSection,
  SocialProofSection,
  ThreePathsSection,
  UploadPromoSection,
} from "@/components/home/storefront-sections";
import { siteConfig } from "@/config/site";
import {
  listCategories,
  listMaterials,
  listProducts,
} from "@/domain/catalog/repository";
import { listPublishedCuratedModels } from "@/domain/curated-models/repository";
import { faqItems } from "@/components/home/faq-data";
import { homepagePrintLibrary } from "@/domain/home/homepage";
import { getSiteContent } from "@/domain/site/content-repository";

export const metadata: Metadata = {
  title: siteConfig.tagline,
  description: siteConfig.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: "/",
  },
};

export default async function HomePage() {
  const [products, categories, materials, content, curatedModels] = await Promise.all([
    listProducts(),
    listCategories(),
    listMaterials(),
    getSiteContent(),
    listPublishedCuratedModels(4, "curated_external"),
  ]);

  const readyFallback =
    curatedModels.length > 0
      ? curatedModels.map((model) => ({
          id: model.id,
          name: model.titleTr,
          category: model.categoryLabel ?? "Küratörlü",
          imageUrl: model.previewImageUrl,
          href: `/hazir-modeller/katalog/${model.slug}`,
          source: "curated" as const,
        }))
      : homepagePrintLibrary.map((model) => ({
          id: model.id,
          name: model.name,
          category: model.category,
          imageUrl: model.imageUrl,
          href: model.href,
          source: "fallback" as const,
        }));

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <main id="ana-icerik">
      <Hero />
      <div className="home-studio">
        <IdeaSearchSection />
        <ThreePathsSection />
        <ReadyModelsSection fallback={readyFallback} />
        <FeaturedProductsSection products={products} />
        <CategoriesSection
          categories={categories}
          products={products}
          categoriesIntro={{
            title: "Kategoriler",
            description:
              content.categoriesIntroDescription ?? "Koleksiyonu sahne sahne gez.",
          }}
        />
        <ProcessSection />
        <UploadPromoSection />
        <MaterialsSection materials={materials} />
        <B2bSection />
        <SocialProofSection />
        <FaqSection />
        <FinalCtaSection />
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </main>
  );
}
