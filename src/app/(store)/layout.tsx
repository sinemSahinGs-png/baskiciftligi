import type { ReactNode } from "react";

import { AnnouncementBar } from "@/components/site/announcement-bar";
import { ShellAtmosphere } from "@/components/site/shell-atmosphere";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import {
  getCatalogSnapshot,
  listCategories,
  listProducts,
} from "@/domain/catalog/repository";
import { getSiteContent } from "@/domain/site/content-repository";

export default async function StoreLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [catalog, categories, products, content] = await Promise.all([
    getCatalogSnapshot(),
    listCategories(),
    listProducts({ limit: 24 }),
    getSiteContent(),
  ]);

  return (
    <ShellAtmosphere>
      <AnnouncementBar announcements={catalog.announcements} />
      <SiteHeader categories={categories} products={products} />
      <div className="min-h-0 grow-0">{children}</div>
      <SiteFooter
        heading={content.footerHeading}
        description={content.footerDescription}
      />
    </ShellAtmosphere>
  );
}
