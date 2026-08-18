import Link from "next/link";
import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/admin-page";
import { CatalogCsvPanel } from "@/components/admin/catalog-csv-panel";
import { getAdminCatalogOverview } from "@/domain/catalog/admin-repository";
import { serializeCatalogCsv } from "@/lib/catalog/csv";

export const metadata: Metadata = {
  title: "CSV içe / dışa aktarma",
};

export default async function CatalogCsvPage() {
  const overview = await getAdminCatalogOverview();
  const csv = serializeCatalogCsv(
    overview.products.map((product) => ({
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      barcode: product.barcode ?? "",
      category: product.categorySlugs[0] ?? "",
      description: product.shortDescription,
      priceMinor: product.priceMinor,
      vatRateBps: product.vatRateBps ?? 2000,
      stock: product.inventoryQuantity,
      material: product.materialCode ?? "",
      color: product.variants[0]?.colorName ?? "",
      status: product.status,
    })),
  );

  return (
    <>
      <AdminPageHeader
        eyebrow="Katalog / Ürünler"
        title="CSV içe / dışa aktarma"
        description="Upsert yalnızca SKU ile yapılır. İsim eşleşmesi ürünün üzerine yazmaz. Trendyol senkronizasyonu bu fazda yoktur."
        actions={
          <Link
            href="/admin/urunler"
            className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-4 text-sm font-semibold"
          >
            Ürün listesi
          </Link>
        }
      />
      <CatalogCsvPanel initialCsv={csv} />
    </>
  );
}
