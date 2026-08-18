import { ContentPage } from "@/components/content/content-layout";
import { QuoteJobStatus } from "@/components/configurator/quote-job-status";
import { createPageMetadata } from "@/components/content/metadata";

export const metadata = createPageMetadata({
  title: "Özel Üretim Teklif Durumu",
  description: "Sunucudaki gerçek teklif veya iş durumu. Sahte fiyat gösterilmez.",
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

  return (
    <ContentPage
      eyebrow="Teklif durumu"
      title="Üretim işi"
      description="Bu sayfa yalnızca oturumunuzdaki gerçek iş veya teklif kaydını okur."
      width="reading"
    >
      <QuoteJobStatus quoteId={quoteId} />
    </ContentPage>
  );
}
