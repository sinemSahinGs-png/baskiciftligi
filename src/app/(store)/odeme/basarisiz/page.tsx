import { ContentPage, StatusNotice } from "@/components/content/content-layout";
import { createPageMetadata } from "@/components/content/metadata";

export const metadata = createPageMetadata({
  title: "Ödeme Dönüş Durumu",
  description:
    "PayTR başarısız dönüş route’unun aktivasyon durumu. Phase 2 ödeme altyapısı henüz aktif değildir.",
  path: "/odeme/basarisiz",
  noIndex: true,
});

export default function PaymentFailureReturnPage() {
  return (
    <ContentPage
      eyebrow="Ödeme dönüşü"
      title="Aktif bir ödeme denemesi bulunmuyor."
      description="Bu planlanan başarısız dönüş adresidir. Phase 2 PayTR entegrasyonu çalışmadığı için hata kodu, sipariş veya ödeme denemesi sorgulanmıyor."
      status={{ label: "PayTR aktif değil", tone: "warning" }}
      actions={[
        { href: "/odeme", label: "Ödeme durumuna dönün", variant: "outline" },
        { href: "/sepet", label: "Sepeti görüntüleyin", variant: "outline" },
      ]}
      width="reading"
    >
      <StatusNotice title="Yeniden ödeme başlatmayın" tone="warning">
        <p>
          Bu sayfada çalışan payment attempt bulunmadığından yeniden deneme
          butonu sunulmaz. Canlı sistemde hata mesajı yalnız doğrulanmış
          provider durumu üzerinden, hassas ayrıntıları açığa çıkarmadan
          gösterilmelidir.
        </p>
      </StatusNotice>
    </ContentPage>
  );
}
