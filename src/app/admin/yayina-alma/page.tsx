import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/admin-page";
import { LaunchCenter } from "@/components/admin/launch-center";
import { requireLaunchOperator } from "@/lib/auth/session";
import { buildLaunchChecklist } from "@/lib/launch/checklist";
import { gatherLaunchReadiness } from "@/lib/launch/readiness";
import { recordLaunchAudit } from "@/lib/launch/audit";

export const metadata: Metadata = {
  title: "Yayına alma",
};

export default async function LaunchCenterPage() {
  await requireLaunchOperator();
  const snapshot = await gatherLaunchReadiness();
  await recordLaunchAudit("launch_readiness_check", {
    generatedAt: snapshot.generatedAt,
  });

  return (
    <>
      <AdminPageHeader
        eyebrow="Üretim"
        title="Yayına alma"
        description="Kalan üretim yapılandırmasını gizlemeden, sır sızdırmadan ve hazır olmayan hizmetleri yeşil göstermeden izleyin."
      />
      <LaunchCenter
        snapshot={snapshot}
        checklist={buildLaunchChecklist(snapshot)}
      />
    </>
  );
}
