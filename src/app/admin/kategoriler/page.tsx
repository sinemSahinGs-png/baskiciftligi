import type { Metadata } from "next";
import { FlaskConical } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page";
import { CategoryManager } from "@/components/admin/category-manager";
import { CategorySyncRecovery } from "@/components/admin/category-sync-recovery";
import { getAdminCatalogOverview } from "@/domain/catalog/admin-repository";
import { getViewer } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Kategori yönetimi",
};

export default async function CategoriesPage() {
  const [catalog, viewer] = await Promise.all([
    getAdminCatalogOverview(),
    getViewer(),
  ]);
  const showCategorySyncRecovery = viewer?.role === "owner";

  return (
    <>
      <AdminPageHeader
        eyebrow="Katalog / Kategoriler"
        title="Kategori yönetimi"
        description="Mağaza sınıflandırmasını, kapak fotoğrafını ve görselin vitrinde nasıl duracağını (ölçek, konum, kaplama) buradan düzenleyin. Ürün atanmış kategoriler veri bütünlüğünü korumak için silinemez."
      />
      {showCategorySyncRecovery && catalog.mode === "supabase" ? (
        <CategorySyncRecovery />
      ) : null}
      {catalog.mode === "demo" ? (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-warm/25 bg-warm/8 p-4 text-sm text-warm">
          <FlaskConical className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>
            Demo modunda kategori kaydı yerel katalog dosyasına yazılır. Kapak
            görseli yalnızca PNG’dir: dosyayı{" "}
            <code>public/demo/categories/kategori-slug.png</code> olarak koyun
            veya formdan yükleyin.
          </p>
        </div>
      ) : null}
      <CategoryManager categories={catalog.categories} />
    </>
  );
}
