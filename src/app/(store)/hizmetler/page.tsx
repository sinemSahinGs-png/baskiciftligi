import Link from "next/link";

import {
  ContentCard,
  ContentPage,
  NumberedSteps,
  SectionHeading,
  StatusNotice,
} from "@/components/content/content-layout";
import { createPageMetadata } from "@/components/content/metadata";
import { siteConfig } from "@/config/site";
import { servicePages } from "./service-pages";

export const metadata = createPageMetadata({
  title: "3D Baskı Hizmetleri",
  description: `${siteConfig.name} prototipleme, küçük seri üretim ve tasarım doğrulama yaklaşımını inceleyin.`,
  path: "/hizmetler",
});

export default function ServicesPage() {
  return (
    <ContentPage
      eyebrow="Hizmetler"
      title="Dosyadan önce problemi, üretimden önce kriteri tanımlarız."
      description="İyi bir 3D baskı süreci yalnızca makine seçimi değildir. Parçanın görevi, kabul ölçütü ve karar noktaları netleştiğinde daha doğru teknoloji ve üretim planı kurulabilir."
      actions={[
        {
          href: "/kurumsal-teklif",
          label: "Brief hazırlayın",
          variant: "commerce",
        },
        {
          href: "/malzemeler",
          label: "Malzemeleri karşılaştırın",
          variant: "outline",
        },
      ]}
    >
      <section aria-labelledby="hizmet-baslik" className="pt-8">
        <div id="hizmet-baslik">
          <SectionHeading
            eyebrow="Kapsam"
            title="İhtiyaca göre şekillenen üretim desteği"
            description="Aşağıdaki başlıklar hizmet yaklaşımını anlatır; aktif sipariş, kesin fiyat veya teslim süresi taahhüdü değildir."
          />
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {servicePages.map((service) => (
            <ContentCard
              key={service.slug}
              eyebrow={service.eyebrow}
              title={service.navLabel}
              description={service.description}
            >
              <Link
                href={service.href}
                className="text-sm font-semibold text-cyan hover:underline"
              >
                {service.navLabel} kapsamını okuyun
              </Link>
            </ContentCard>
          ))}
        </div>
      </section>

      <section aria-labelledby="surec-baslik" className="section-space">
        <div id="surec-baslik">
          <SectionHeading
            eyebrow="Çalışma biçimi"
            title="Kararı görünür kılan üç kapı"
            description="Her proje aynı ayrıntıda ilerlemek zorunda değildir; ancak amaç, numune ve üretim onayı birbirine karıştırılmamalıdır."
          />
        </div>
        <div className="mt-10">
          <NumberedSteps
            steps={[
              {
                title: "Brief",
                description:
                  "Kullanım, adet, tarih ve kritik ölçüler yazılı hâle getirilir; belirsiz alanlar açıkça işaretlenir.",
              },
              {
                title: "Numune",
                description:
                  "Gerekli projelerde tek parça üzerinden ölçü, görünüş ve işlev kabulü yapılır.",
              },
              {
                title: "Üretim onayı",
                description:
                  "Onaylanan sürüm, adet ve kalite kriteri sabitlenmeden seri üretime geçilmez.",
              },
            ]}
          />
        </div>
      </section>

      <StatusNotice title="Özel model akışı henüz aktif değil" tone="warning">
        <p>
          Dosya yükleme, güvenli depolama, önizleme ve teklif kaydı Phase 3
          kapsamındadır. Bu sayfa dosya kabul etmez ve otomatik fiyat üretmez.
          Mevcut kapsam, doğru bir görüşme brief’i hazırlamanıza yardımcı
          olmaktır.
        </p>
      </StatusNotice>
    </ContentPage>
  );
}
