import { Suspense } from "react";
import type { Metadata } from "next";

import { ModelLibrary } from "@/components/models/model-library";
import { createPageMetadata } from "@/components/content/metadata";
import { siteConfig } from "@/config/site";
import { hydrateThingiverseOauthToken } from "@/providers/thingiverse/oauth-store";
import { getThingiverseConfigStatus } from "@/providers/thingiverse/provider";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = createPageMetadata({
  title: "Hazır 3D Modeller",
  description: `${siteConfig.name} koleksiyonu, lisanslı tasarımcılar ve topluluk modellerinin açıkça ayrıldığı model keşif alanı.`,
  path: "/hazir-modeller",
});

export default async function ReadyModelsPage() {
  const thingiverseStatus = await hydrateThingiverseOauthToken().then(() =>
    getThingiverseConfigStatus(),
  );
  return (
    <main id="ana-icerik">
      <Suspense fallback={null}>
        <ModelLibrary
          curatedModels={[]}
          thingiverseEnabled={thingiverseStatus === "connected"}
        />
      </Suspense>
    </main>
  );
}
