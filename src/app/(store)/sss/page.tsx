import { ContentPage, StatusNotice } from "@/components/content/content-layout";
import { FaqAccordion } from "@/components/content/faq-accordion";
import { createPageMetadata } from "@/components/content/metadata";
import { siteConfig } from "@/config/site";

export const metadata = createPageMetadata({
  title: "Sıkça Sorulan Sorular",
  description: `${siteConfig.name} mağaza, malzeme, özel model, ödeme ve kurumsal üretim süreçleri hakkında doğrulanmış kapsam bilgileri.`,
  path: "/sss",
});

export default function FaqPage() {
  return (
    <ContentPage
      eyebrow="Sıkça sorulan sorular"
      title="Aktif olanı, planlanandan ayıran net cevaplar."
      description="Cevaplar mevcut uygulama kapsamını esas alır. Kesin fiyat, stok, üretim süresi veya hukuki haklar hakkında doğrulanmamış söz verilmez."
      actions={[
        {
          href: "/iletisim",
          label: "İletişim durumunu görün",
          variant: "outline",
        },
      ]}
      width="reading"
    >
      <FaqAccordion />

      <StatusNotice title="Yanıt bulamadınız mı?" className="mt-8">
        <p>
          İletişim sayfası yalnız gerçekten yapılandırılmış kanalları gösterir.
          Site içi mesaj formu aktif olmadığı sürece bir soru otomatik olarak
          kaydedilmez veya yanıt sırasına alınmaz.
        </p>
      </StatusNotice>
    </ContentPage>
  );
}
