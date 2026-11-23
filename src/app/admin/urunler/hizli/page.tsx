import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { QuickProductForm } from "@/components/admin/quick-product-form";
import { AdminPageHeader } from "@/components/admin/admin-page";
import { getAdminCatalogOverview } from "@/domain/catalog/admin-repository";
import { requireAdmin } from "@/lib/auth/session";
import { canManageCatalog } from "@/lib/catalog/authorization";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Hızlı ürün",
};

export default async function QuickProductPage() {
  const viewer = await requireAdmin();
  if (!canManageCatalog(viewer.role)) {
    redirect("/admin");
  }
  const catalog = await getAdminCatalogOverview();

  return (
    <>
      <AdminPageHeader
        eyebrow="Katalog"
        title="Hızlı ürün ekle"
        description="Ad, fiyat ve kapak yeterli. Detaylı varyant için tam ürün formunu kullan."
        actions={
          <Link
            href="/admin/urunler/yeni"
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-sm"
          >
            <ArrowLeft className="size-4" />
            Tam form
          </Link>
        }
      />
      <QuickProductForm categories={catalog.categories} />
    </>
  );
}
