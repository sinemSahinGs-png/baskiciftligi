import { CreditCard, DatabaseZap, Webhook } from "lucide-react";

import {
  ContentCard,
  ContentPage,
  NumberedSteps,
  StatusNotice,
} from "@/components/content/content-layout";
import { createPageMetadata } from "@/components/content/metadata";
import { siteConfig } from "@/config/site";

export const metadata = createPageMetadata({
  title: "Ödeme Durumu",
  description: `${siteConfig.name} PayTR ödeme akışının yapılandırma ve aktivasyon durumunu görüntüleyin.`,
  path: "/odeme",
  noIndex: true,
});

export default function CheckoutPage() {
  return (
    <ContentPage
      eyebrow="Ödeme"
      title="PayTR checkout henüz kullanıma açık değil."
      description="Ödeme alma, sipariş oluşturma ve stok rezervasyonu Phase 2 kapsamındadır. Merchant onayı, server-side imza doğrulaması ve uçtan uca testler tamamlanmadan bu sayfa kart bilgisi istemez."
      status={{ label: "Phase 2 · PayTR yapılandırılmadı", tone: "warning" }}
      actions={[
        { href: "/sepet", label: "Sepete dönün", variant: "outline" },
        { href: "/sss", label: "Kapsamı okuyun", variant: "outline" },
      ]}
    >
      <StatusNotice title="Ödeme başlatılamıyor" tone="warning">
        <p>
          PayTR merchant credential’ları, callback route’u ve doğrulanmış order
          transaction’ı aktif değildir. Bu route kart numarası, CVV veya ödeme
          token’ı toplamaz; sepeti siparişe dönüştürmez ve “ödendi” durumu
          yazmaz.
        </p>
      </StatusNotice>

      <section className="section-space" aria-label="Aktivasyon gereksinimleri">
        <div className="grid gap-4 md:grid-cols-3">
          <ContentCard
            title="Merchant ve domain onayı"
            description="PayTR hesabı, KYC, satış domain’i ve test/live ortam ayrımı tamamlanmalıdır."
          >
            <CreditCard aria-hidden="true" className="size-6 text-cyan" />
          </ContentCard>
          <ContentCard
            title="Server-side doğrulama"
            description="Token ve imza yalnız server’da üretilmeli; callback sabit zamanlı doğrulama ve tutar kontrolünden geçmelidir."
          >
            <Webhook aria-hidden="true" className="size-6 text-cyan" />
          </ContentCard>
          <ContentCard
            title="Atomik sipariş kaydı"
            description="Ödeme olayı, sipariş durumu ve stok etkisi idempotent transaction sınırında işlenmelidir."
          >
            <DatabaseZap aria-hidden="true" className="size-6 text-cyan" />
          </ContentCard>
        </div>
      </section>

      <section aria-labelledby="planlanan-odeme-baslik">
        <h2 id="planlanan-odeme-baslik" className="sr-only">
          Planlanan ödeme akışı
        </h2>
        <NumberedSteps
          steps={[
            {
              title: "Server yeniden fiyatlar",
              description:
                "Ürün, stok, indirim ve kargo kuralları güncel kaynaktan doğrulanır; browser tutarı otorite kabul edilmez.",
            },
            {
              title: "PayTR akışı açılır",
              description:
                "Benzersiz payment attempt oluşturulur ve güvenli PayTR yüzeyi yalnız server token’ıyla başlatılır.",
            },
            {
              title: "Callback sonucu belirler",
              description:
                "Başarı sayfası değil, doğrulanmış server-to-server callback ödeme durumunun kaynağı olur.",
            },
          ]}
        />
      </section>
    </ContentPage>
  );
}
