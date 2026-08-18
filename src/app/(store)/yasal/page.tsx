import type { Route } from "next";
import { FileWarning } from "lucide-react";

import { legalTemplates } from "@/components/content/content-data";
import {
  ContentCard,
  ContentPage,
  StatusNotice,
  TextLink,
} from "@/components/content/content-layout";
import { createPageMetadata } from "@/components/content/metadata";
import { siteConfig } from "@/config/site";

export const metadata = createPageMetadata({
  title: "Yasal Metin Taslakları",
  description: `Production öncesinde Türk hukuk danışmanı ve doğrulanmış tacir bilgileriyle tamamlanması gereken ${siteConfig.name} yasal metin iskeletleri.`,
  path: "/yasal",
  noIndex: true,
});

export default function LegalIndexPage() {
  return (
    <ContentPage
      eyebrow="Yasal"
      title="Yayına hazır sözleşmeler değil, inceleme listeleri."
      description="Bu bölümdeki sayfalar nihai politika, sözleşme veya hukuki danışmanlık değildir. Gerçek veri akışı, satıcı bilgileri ve operasyon süreçleri doğrulandıktan sonra Türkiye’de yetkin hukuk danışmanı tarafından hazırlanıp onaylanmalıdır."
      status={{
        label: "Hukuki şablon · Production’da kullanmayın",
        tone: "warning",
      }}
    >
      <StatusNotice
        title="Canlı satış için hukuki aktivasyon kapısı"
        tone="warning"
      >
        <p>
          Tacir unvanı, MERSİS/vergi bilgileri, adres, iletişim kanalları, ödeme
          ve iade operasyonu doğrulanmadan bu metinler tamamlanmış sayılamaz.
          Şablonlar tüketicinin yasal haklarını tanımlamaz veya daraltmaz.
        </p>
      </StatusNotice>

      <section
        className="section-space grid gap-5 md:grid-cols-2"
        aria-label="Yasal metin şablonları"
      >
        {legalTemplates.map((template) => {
          const href = `/yasal/${template.slug}` as Route;

          return (
            <ContentCard
              key={template.slug}
              eyebrow="Şablon · Hukuk incelemesi gerekli"
              title={template.title}
              description={template.summary}
            >
              <div className="mb-5 flex items-center gap-2 text-xs font-semibold text-warm">
                <FileWarning aria-hidden="true" className="size-4" />
                Production için onaylı değil
              </div>
              <TextLink href={href}>Hazırlık listesini açın</TextLink>
            </ContentCard>
          );
        })}
      </section>

      <StatusNotice title="Metinler sipariş anındaki kayıtlarla eşleşmelidir">
        <p>
          Nihai belgeler yalnız statik sayfa olarak bulunmamalı; checkout
          sırasında gösterilen sürüm, onay zamanı ve siparişe özel bedel / ürün
          bilgileri değiştirilemez snapshot olarak saklanmalıdır.
        </p>
      </StatusNotice>
    </ContentPage>
  );
}
