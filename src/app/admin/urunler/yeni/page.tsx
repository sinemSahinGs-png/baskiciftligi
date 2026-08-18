import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page";
import { ProductForm } from "@/components/admin/product-form";
import { createEmptyProductForm } from "@/domain/catalog/admin-form";
import { getAdminCatalogOverview } from "@/domain/catalog/admin-repository";

export const metadata: Metadata = {
  title: "Yeni ürün",
};

export default async function NewProductPage() {
  const catalog = await getAdminCatalogOverview();

  return (
    <>
      <AdminPageHeader
        eyebrow="Katalog / Ürünler"
        title="Yeni ürün"
        description="Taslak ürün oluşturun; yayınlamadan önce varyant, stok, sınıflandırma, medya URL’leri ve SEO alanlarını tamamlayın."
        actions={
          <Link
            href="/admin/urunler"
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Ürün listesi
          </Link>
        }
      />
      <ProductForm
        initialValues={createEmptyProductForm()}
        categories={catalog.categories}
        collections={catalog.collections}
      />
    </>
  );
}
