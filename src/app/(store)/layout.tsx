import type { ReactNode } from "react";

import { AnnouncementBar } from "@/components/site/announcement-bar";
import { ShellAtmosphere } from "@/components/site/shell-atmosphere";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { StoreBottomNav } from "@/components/storefront/store-bottom-nav";
import { ScrollProgress } from "@/components/motion/premium";
import "@/components/storefront/storefront.css";
import {
  getCatalogSnapshot,
  listProducts,
} from "@/domain/catalog/repository";
import { storefrontCategories } from "@/domain/catalog/storefront-taxonomy";
import { getSiteContent } from "@/domain/site/content-repository";
import { resolveAllStorefrontCategoryImages } from "@/lib/catalog/storefront-category-image";

const presentedCategories = storefrontCategories.map((category, index) => ({
  id: category.slug,
  slug: category.slug,
  name: category.name,
  description: category.description,
  imageUrl: "",
  eyebrow: category.eyebrow,
  isFeatured: false,
  position: index,
  isDemo: false,
}));

export default async function StoreLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [catalog, products, content] = await Promise.all([
    getCatalogSnapshot(),
    listProducts({ limit: 24 }),
    getSiteContent(),
  ]);

  return (
    <ShellAtmosphere>
      <AnnouncementBar announcements={catalog.announcements} />
      <SiteHeader
        categories={presentedCategories}
        products={products}
        categoryArtwork={resolveAllStorefrontCategoryImages()}
      />
      <ScrollProgress />
      <div className="min-h-0 grow-0">{children}</div>
      <SiteFooter
        heading={content.footerHeading}
        description={content.footerDescription}
      />
      <StoreBottomNav />
    </ShellAtmosphere>
  );
}
