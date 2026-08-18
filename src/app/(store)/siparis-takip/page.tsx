import { LockKeyhole, PackageSearch, ShieldCheck } from "lucide-react";

import {
  ContentCard,
  ContentPage,
  NumberedSteps,
  StatusNotice,
} from "@/components/content/content-layout";
import { createPageMetadata } from "@/components/content/metadata";
import { siteConfig } from "@/config/site";

export const metadata = createPageMetadata({
  title: "Sipariş Takip Durumu",
  description: `${siteConfig.name} sipariş ve üretim takibinin aktivasyon durumunu görüntüleyin.`,
  path: "/siparis-takip",
  noIndex: true,
});

export default function OrderTrackingPage() {
  return (
    <ContentPage
      eyebrow="Sipariş takip"
      title="Takip altyapısı henüz aktif değil."
      description="Phase 1 sipariş oluşturmaz, ödeme doğrulamaz veya kargo kaydı üretmez. Bu nedenle girilecek bir sipariş numarasını güvenilir şekilde sorgulayacak veri kaynağı bulunmuyor."
      status={{ label: "Phase 2 · Yapılandırma bekliyor", tone: "warning" }}
      actions={[
        {
          href: "/iletisim",
          label: "İletişim durumunu görün",
          variant: "outline",
        },
      ]}
    >
      <StatusNotice title="Bu sayfada takip formu bulunmuyor" tone="warning">
        <p>
          Çalışan order repository, güvenli doğrulama ve kargo provider’ı
          olmadan bir formun sonuç göstermesi yanıltıcı olurdu. Hiçbir sipariş
          numarası bu sayfa üzerinden alınmaz, saklanmaz veya sorgulanmaz.
        </p>
      </StatusNotice>

      <section className="section-space" aria-label="Planlanan takip güvenliği">
        <div className="grid gap-4 md:grid-cols-3">
          <ContentCard
            title="Tahmin edilmesi zor erişim"
            description="Takip ekranı, ardışık sipariş numarasıyla herkesin kayıt deneyebileceği biçimde açılmamalıdır."
          >
            <LockKeyhole aria-hidden="true" className="size-6 text-cyan" />
          </ContentCard>
          <ContentCard
            title="Doğrulanmış durum kaynağı"
            description="Ödeme, üretim ve kargo durumu yalnız server tarafından doğrulanmış kayıtlardan okunmalıdır."
          >
            <ShieldCheck aria-hidden="true" className="size-6 text-cyan" />
          </ContentCard>
          <ContentCard
            title="Sınırlı kişisel veri"
            description="Takip sonucu gereksiz adres, telefon veya ödeme verisini görünür hâle getirmemelidir."
          >
            <PackageSearch aria-hidden="true" className="size-6 text-cyan" />
          </ContentCard>
        </div>
      </section>

      <section aria-labelledby="planlanan-akis-baslik">
        <h2 id="planlanan-akis-baslik" className="sr-only">
          Planlanan takip akışı
        </h2>
        <NumberedSteps
          steps={[
            {
              title: "Kimlik doğrulama",
              description:
                "Hesap oturumu veya güvenli, kısa ömürlü takip erişimi doğrulanır.",
            },
            {
              title: "Sipariş durumu",
              description:
                "Ödeme callback’i ve izinli order state geçişleri üzerinden güncel kayıt okunur.",
            },
            {
              title: "Kargo bilgisi",
              description:
                "Yalnız aktif shipping provider’dan gelen doğrulanmış takip bilgisi gösterilir.",
            },
          ]}
        />
      </section>
    </ContentPage>
  );
}
