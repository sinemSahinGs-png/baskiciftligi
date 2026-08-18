import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page";
import { ProductActions } from "@/components/admin/product-actions";
import { ProductForm } from "@/components/admin/product-form";
import { productToAdminForm } from "@/domain/catalog/admin-form";
import {
  getAdminCatalogOverview,
  getAdminProductById,
} from "@/domain/catalog/admin-repository";
import { requireAdmin } from "@/lib/auth/session";
import { canManageCatalog, canViewInternalCost } from "@/lib/catalog/authorization";

export const metadata: Metadata = {
  title: "Ürün düzenle",
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, catalog, viewer] = await Promise.all([
    getAdminProductById(id),
    getAdminCatalogOverview(),
    requireAdmin(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Katalog / Ürün düzenle"
        title={product.name}
        description="Değişiklikler ürün, varyant, stok, görsel URL ve sınıflandırma kayıtlarına açık hata kontrolüyle uygulanır."
        actions={
          <>
            <Link
              href="/admin/urunler"
              className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/15 px-4 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Liste
            </Link>
            <ProductActions
              id={product.id}
              name={product.name}
              status={product.status}
              afterDelete="list"
              showEdit={false}
            />
          </>
        }
      />
      <ProductForm
        initialValues={productToAdminForm(product)}
        categories={catalog.categories}
        collections={catalog.collections}
        canWrite={canManageCatalog(viewer.role)}
        canViewCost={canViewInternalCost(viewer.role)}
      />
    </>
  );
}
