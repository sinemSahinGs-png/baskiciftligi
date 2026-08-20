import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page";
import { CuratedModelEditor } from "@/components/admin/curated-model-editor";
import { getAdminCatalogOverview } from "@/domain/catalog/admin-repository";
import { getCuratedModelForAdmin } from "@/domain/curated-models/repository";
import { requireAdmin } from "@/lib/auth/session";
import { canManageCatalog, canPublishCatalog } from "@/lib/catalog/authorization";

export const metadata: Metadata = {
  title: "Harici model düzenle",
};

export default async function EditCuratedModelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [viewer, catalog, model] = await Promise.all([
    requireAdmin(),
    getAdminCatalogOverview(),
    getCuratedModelForAdmin(id),
  ]);
  if (!canManageCatalog(viewer.role)) {
    redirect("/admin/harici-modeller");
  }
  if (!model) {
    notFound();
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Küratörlü katalog"
        title={model.titleTr || "Harici model"}
        description="Kaynak, bilgiler, görsel ve yayın durumunu güncelleyin."
        actions={
          <Link
            href="/admin/harici-modeller"
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-sm font-semibold"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Liste
          </Link>
        }
      />
      <CuratedModelEditor
        model={model}
        draftId={model.id}
        categories={catalog.categories.map((category) => ({
          id: category.id,
          name: category.name,
        }))}
        canPublish={canPublishCatalog(viewer.role)}
      />
    </>
  );
}
