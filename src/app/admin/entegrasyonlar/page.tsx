import { ManufacturingAdmin } from "@/components/admin/manufacturing-admin";
import { ThingiverseStatusPanel } from "@/components/admin/thingiverse-status-panel";
import { requireAdmin } from "@/lib/auth/session";

export default async function IntegrationsAdminPage() {
  await requireAdmin();
  return (
    <>
      <ManufacturingAdmin title="Entegrasyonlar" mode="integrations" />
      <ThingiverseStatusPanel />
    </>
  );
}
