import type { Metadata } from "next";

import { ModelConfigurator } from "@/components/configurator/model-configurator";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Model yükle",
  description: `${siteConfig.name} özel üretim yapılandırıcısı. Dosya bu aşamada sunucuya yüklenmez; kesin fiyat değerlendirme sonrası bildirilir.`,
  alternates: { canonical: "/model-yukle" },
  robots: { index: false, follow: false },
};

export default function ModelUploadPage() {
  return (
    <main id="ana-icerik">
      <ModelConfigurator />
    </main>
  );
}
