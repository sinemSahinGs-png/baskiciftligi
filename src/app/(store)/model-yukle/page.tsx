import type { Metadata } from "next";
import { Suspense } from "react";

import { ModelConfigurator } from "@/components/configurator/model-configurator";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Model yükle",
  description: `${siteConfig.name} özel üretim yapılandırıcısı. Gerçek mesh önizlenir; fiyat yalnız dilimleme ve sunucu formülünden sonra gösterilir.`,
  alternates: { canonical: "/model-yukle" },
  robots: { index: false, follow: false },
};

export default function ModelUploadPage() {
  return (
    <main id="ana-icerik">
      <Suspense fallback={<p className="p-8 text-sm">Yapılandırıcı yükleniyor.</p>}>
        <ModelConfigurator />
      </Suspense>
    </main>
  );
}
