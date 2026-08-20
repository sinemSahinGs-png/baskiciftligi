import Link from "next/link";
import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import { ArrowLeft } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page";
import { CuratedModelEditor } from "@/components/admin/curated-model-editor";
import { getAdminCatalogOverview } from "@/domain/catalog/admin-repository";
import { requireAdmin } from "@/lib/auth/session";
import { canManageCatalog, canPublishCatalog } from "@/lib/catalog/authorization";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Yeni harici model",
};

export default async function NewCuratedModelPage() {
  const [viewer, catalog] = await Promise.all([
    requireAdmin(),
    getAdminCatalogOverview(),
  ]);
  if (!canManageCatalog(viewer.role)) {
    redirect("/admin/harici-modeller");
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Küratörlü katalog"
        title="Yeni harici model"
        description="Dört adımda kaynak, bilgiler, görsel ve yayın durumu."
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
        draftId={randomUUID()}
        categories={catalog.categories.map((category) => ({
          id: category.id,
          name: category.name,
        }))}
        canPublish={canPublishCatalog(viewer.role)}
      />
    </>
  );
}
