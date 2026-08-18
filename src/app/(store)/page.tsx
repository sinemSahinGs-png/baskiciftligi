import type { Metadata } from "next";

import { Hero } from "@/components/home/hero";
import {
  B2bSection,
  CategoriesSection,
  FeaturedCollectionsSection,
  FeaturedProductsSection,
  FaqSection,
  GallerySection,
  MaterialsSection,
  PrintLibrarySection,
  ProcessSection,
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
import { faqItems } from "@/components/home/faq-data";
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
  const [products, categories, materials, content] = await Promise.all([
    listProducts(),
    listCategories(),
    listMaterials(),
    getSiteContent(),
  ]);

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
      <FeaturedCollectionsSection products={products} categories={categories} />
      <FeaturedProductsSection products={products} />
      <CategoriesSection
        categories={categories}
        products={products}
        categoriesIntro={{
          title: content.categoriesIntroTitle,
          description: content.categoriesIntroDescription,
        }}
      />
      <ThreePathsSection />
      <UploadPromoSection />
      <PrintLibrarySection />
      <ProcessSection />
      <MaterialsSection materials={materials} />
      <B2bSection />
      <SocialProofSection />
      <GallerySection />
      <FaqSection />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </main>
  );
}
