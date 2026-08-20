import { ManufacturingAdmin } from "@/components/admin/manufacturing-admin";
import { ThingiverseStatusPanel } from "@/components/admin/thingiverse-status-panel";
import { requireAdmin } from "@/lib/auth/session";
import { serverEnv } from "@/lib/env.server";
import { getThingiverseConfigStatus } from "@/providers/thingiverse/provider";

export default async function IntegrationsAdminPage() {
  await requireAdmin();
  const status = getThingiverseConfigStatus();

  return (
    <>
      <ManufacturingAdmin title="Entegrasyonlar" mode="integrations" />
      <ThingiverseStatusPanel
        initialStatus={status}
        envFlags={{
          clientId: Boolean(serverEnv.THINGIVERSE_CLIENT_ID),
          clientSecret: Boolean(serverEnv.THINGIVERSE_CLIENT_SECRET),
          accessToken: Boolean(serverEnv.THINGIVERSE_ACCESS_TOKEN),
          redirectUri: Boolean(serverEnv.THINGIVERSE_REDIRECT_URI),
        }}
      />
    </>
  );
}
