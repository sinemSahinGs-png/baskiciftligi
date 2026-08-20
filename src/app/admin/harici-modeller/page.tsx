import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page";
import { listCuratedModelsForAdmin } from "@/domain/curated-models/repository";
import { platformLabel } from "@/domain/curated-models/types";
import { requireAdmin } from "@/lib/auth/session";
import { canManageCatalog } from "@/lib/catalog/authorization";

export const metadata: Metadata = {
  title: "Harici modeller",
};

export default async function CuratedModelsAdminPage() {
  const viewer = await requireAdmin();
  const canWrite = canManageCatalog(viewer.role);
  const models = await listCuratedModelsForAdmin();

  return (
    <>
      <AdminPageHeader
        eyebrow="Katalog"
        title="Küratörlü harici modeller"
        description="İzin verilen kaynaklardan beğendiğiniz modelleri manuel ekleyin. Scraping yok."
        actions={
          canWrite ? (
            <Link
              href="/admin/harici-modeller/yeni"
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-cyan px-4 text-sm font-semibold text-ink"
            >
              <Plus className="size-4" aria-hidden="true" />
              Yeni model
            </Link>
          ) : null
        }
      />

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Başlık</th>
              <th className="px-4 py-3">Kaynak</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Tür</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {models.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-muted-foreground">
                  Henüz küratörlü model yok.
                </td>
              </tr>
            ) : (
              models.map((model) => (
                <tr key={model.id} className="border-b border-white/5">
                  <td className="px-4 py-3 font-semibold">{model.titleTr}</td>
                  <td className="px-4 py-3">{platformLabel(model.platformType)}</td>
                  <td className="px-4 py-3">{model.status}</td>
                  <td className="px-4 py-3">{model.listingKind}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/harici-modeller/${model.id}`}
                      className="underline underline-offset-4"
                    >
                      Düzenle
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
