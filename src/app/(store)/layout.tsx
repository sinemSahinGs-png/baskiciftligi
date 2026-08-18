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

export default async function StoreLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [catalog, categories, products] = await Promise.all([
    getCatalogSnapshot(),
    listCategories(),
    listProducts({ limit: 24 }),
  ]);

  return (
    <ShellAtmosphere>
      <AnnouncementBar announcements={catalog.announcements} />
      <SiteHeader categories={categories} products={products} />
      <div className="min-h-[50svh] flex-1">{children}</div>
      <SiteFooter />
    </ShellAtmosphere>
  );
}
