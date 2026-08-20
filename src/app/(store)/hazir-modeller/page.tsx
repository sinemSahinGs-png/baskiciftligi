import { Suspense } from "react";
import type { Metadata } from "next";

import { ModelLibrary } from "@/components/models/model-library";
import { createPageMetadata } from "@/components/content/metadata";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = createPageMetadata({
  title: "Hazır 3D Modeller",
  description: `${siteConfig.name} koleksiyonu, lisanslı tasarımcılar ve Thingiverse kaynaklarının açıkça ayrıldığı model keşif alanı.`,
  path: "/hazir-modeller",
  noIndex: true,
});

export default function ReadyModelsPage() {
  return (
    <main id="ana-icerik">
      <Suspense fallback={null}>
        <ModelLibrary />
      </Suspense>
    </main>
  );
}
