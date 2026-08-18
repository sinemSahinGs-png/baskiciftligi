import type { Metadata } from "next";
import { FlaskConical } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page";
import { CategoryManager } from "@/components/admin/category-manager";
import { getAdminCatalogOverview } from "@/domain/catalog/admin-repository";

export const metadata: Metadata = {
  title: "Kategori yönetimi",
};

export default async function CategoriesPage() {
  const catalog = await getAdminCatalogOverview();

  return (
    <>
      <AdminPageHeader
        eyebrow="Katalog / Kategoriler"
        title="Kategori yönetimi"
        description="Mağaza sınıflandırmasını, kapak fotoğrafını ve görselin vitrinde nasıl duracağını (ölçek, konum, kaplama) buradan düzenleyin. Ürün atanmış kategoriler veri bütünlüğünü korumak için silinemez."
      />
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
