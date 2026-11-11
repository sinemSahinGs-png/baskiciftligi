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
    <main id="ana-icerik" data-store-studio="" className="bg-[#100b08] text-[#f3ead8]">
      <p className="px-4 pt-4 text-[0.68rem] font-extrabold tracking-[0.16em] uppercase text-[#d8b47c]">
        OCTO STUDIO · Model yükle
      </p>
      <Suspense fallback={<p className="p-8 text-sm">Yükleniyor…</p>}>
        <ModelConfigurator />
      </Suspense>
    </main>
  );
}
