import { ContentPage, StatusNotice } from "@/components/content/content-layout";
import { createPageMetadata } from "@/components/content/metadata";

export const metadata = createPageMetadata({
  title: "Ödeme Dönüş Durumu",
  description:
    "PayTR başarı dönüş route’unun aktivasyon durumu. Bu sayfa tek başına ödeme kanıtı değildir.",
  path: "/odeme/basarili",
  noIndex: true,
});

export default function PaymentSuccessReturnPage() {
  return (
    <ContentPage
      eyebrow="Ödeme dönüşü"
      title="Ödeme doğrulanmış sayılmıyor."
      description="Bu planlanan başarı dönüş adresidir; Phase 2 PayTR entegrasyonu aktif olmadığı için sipariş veya ödeme kaydı okunmuyor. Tarayıcının bu URL’ye ulaşması hiçbir zaman tek başına ödeme kanıtı olmamalıdır."
      status={{ label: "Doğrulama altyapısı aktif değil", tone: "warning" }}
      actions={[
        { href: "/odeme", label: "Ödeme durumuna dönün", variant: "outline" },
        {
          href: "/iletisim",
          label: "İletişim durumunu görün",
          variant: "outline",
        },
      ]}
      width="reading"
    >
      <StatusNotice
        title="Server callback beklenmeden başarı gösterilmez"
        tone="warning"
      >
        <p>
          Canlı akışta bu ekran önce payment attempt kaydını ve imzası
          doğrulanmış PayTR callback sonucunu server’dan okumalıdır. Bu
          kontroller bulunmadığından “ödeme alındı”, sipariş numarası veya
          tahmini teslimat mesajı gösterilmez.
        </p>
      </StatusNotice>
    </ContentPage>
  );
}
