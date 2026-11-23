import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/admin-page";
import { TrendyolSyncPanel } from "@/components/admin/trendyol-sync-panel";
import { requireCatalogWriter } from "@/lib/auth/session";
import {
  isTrendyolConfigured,
  trendyolConfigFlags,
} from "@/providers/trendyol/client";

export const metadata: Metadata = {
  title: "Trendyol",
};

export default async function AdminTrendyolPage() {
  await requireCatalogWriter();

  return (
    <>
      <AdminPageHeader
        eyebrow="Pazaryeri"
        title="Trendyol"
        description="Onaylı Trendyol ürünlerini buradan çek. Fiyat ve stok barkod veya SKU ile eşleşince güncellenir."
      />
      <TrendyolSyncPanel
        configured={isTrendyolConfigured()}
        flags={trendyolConfigFlags()}
      />
    </>
  );
}
