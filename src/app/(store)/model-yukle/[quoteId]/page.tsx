import { ContentPage, StatusNotice } from "@/components/content/content-layout";
import { createPageMetadata } from "@/components/content/metadata";

export const metadata = createPageMetadata({
  title: "Özel Üretim Teklif Durumu",
  description:
    "Phase 3 özel model teklif route’unun aktivasyon durumu. Herhangi bir teklif verisi okunmaz.",
  path: "/model-yukle",
  noIndex: true,
});

type QuoteStatusPageProps = {
  params: Promise<{ quoteId: string }>;
};

export default async function QuoteStatusPage({
  params,
}: QuoteStatusPageProps) {
  const { quoteId } = await params;
  const referenceLabel =
    quoteId.length >= 8
      ? `${quoteId.slice(0, 4)}…${quoteId.slice(-4)}`
      : "geçersiz / eksik";

  return (
    <ContentPage
      eyebrow="Teklif durumu"
      title="Bu teklif route’u henüz veri okumuyor."
      description="Phase 3 storage, model analizi ve quote repository aktif olmadığı için URL’deki değer bir teklif kaydının varlığını kanıtlamaz. Dosya, fiyat, müşteri veya üretim bilgisi gösterilmez."
      status={{ label: "Phase 3 · Aktif değil", tone: "warning" }}
      actions={[
        {
          href: "/model-yukle",
          label: "Model yükleme durumuna dönün",
          variant: "outline",
        },
        {
          href: "/iletisim",
          label: "İletişim durumunu görün",
          variant: "outline",
        },
      ]}
      width="reading"
    >
      <StatusNotice title="Doğrulanmamış URL referansı" tone="warning">
        <p>
          Adres çubuğundaki referans:{" "}
          <code className="rounded bg-black/30 px-2 py-1 font-mono text-foreground">
            {referenceLabel}
          </code>
          . Bu değer server tarafında aranmadı ve geçerli teklif olarak kabul
          edilmedi.
        </p>
      </StatusNotice>
    </ContentPage>
  );
}
