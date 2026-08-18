import Link from "next/link";

import {
  ContentCard,
  ContentPage,
  NumberedSteps,
  SectionHeading,
  StatusNotice,
} from "@/components/content/content-layout";
import { createPageMetadata } from "@/components/content/metadata";
import {
  getServicePage,
  servicePages,
  type ServicePageContent,
} from "./service-pages";

export function createServiceMetadata(slug: ServicePageContent["slug"]) {
  const page = getServicePage(slug);

  return createPageMetadata({
    title: page.metadataTitle,
    description: page.metadataDescription,
    path: page.href,
  });
}

export function ServiceDetailPage({
  slug,
}: {
  slug: ServicePageContent["slug"];
}) {
  const page = getServicePage(slug);
  const related = servicePages.filter((item) => item.slug !== slug);

  return (
    <ContentPage
      eyebrow={page.eyebrow}
      title={page.heading}
      description={page.description}
      status={{ label: "Bilgilendirme · sipariş açık değil", tone: "info" }}
      backLink={{ href: "/hizmetler", label: "Tüm hizmetler" }}
      actions={[
        {
          href: "/kurumsal-teklif",
          label: "Brief hazırlayın",
          variant: "commerce",
        },
        {
          href: "/malzemeler",
          label: "Malzemeleri inceleyin",
          variant: "outline",
        },
      ]}
    >
      <section aria-labelledby="hizmet-kapsam">
        <div id="hizmet-kapsam">
          <SectionHeading
            eyebrow={page.title}
            title="Bu hizmetin sınırları"
            description="Aşağıdaki başlıklar çalışma biçimini anlatır. Kesin fiyat, stok veya teslim tarihi taahhüdü değildir."
          />
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {page.cards.map((card) => (
            <ContentCard
              key={card.title}
              title={card.title}
              description={card.description}
            >
              <p className="border-t border-white/10 pt-4 text-xs leading-5 text-steel">
                {card.detail}
              </p>
            </ContentCard>
          ))}
        </div>
      </section>

      <section aria-labelledby="hizmet-surec" className="section-space">
        <div id="hizmet-surec">
          <SectionHeading
            eyebrow="Süreç"
            title="Karar üç kapıdan geçer"
            description="Brief, doğrulama ve onay birbirine karıştırılmaz. Dosya yükleme ve otomatik fiyat bu fazda kapalıdır."
          />
        </div>
        <div className="mt-10">
          <NumberedSteps steps={page.steps} />
        </div>
      </section>

      <nav aria-label="Diğer hizmetler" className="section-space">
        <SectionHeading
          eyebrow="Devamı"
          title="İlgili üretim başlıkları"
          description="Her sayfa kendi kapsamını anlatır; hiçbiri teklif motoru değildir."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {related.map((item) => (
            <ContentCard
              key={item.slug}
              eyebrow={item.eyebrow}
              title={item.navLabel}
              description={item.description}
            >
              <Link
                href={item.href}
                className="text-sm font-semibold text-cyan hover:underline"
              >
                {item.navLabel} sayfasını aç
              </Link>
            </ContentCard>
          ))}
        </div>
      </nav>

      <StatusNotice title="Teklif ve dosya akışı henüz aktif değil" tone="warning">
        <p>
          Model yükleme, önizleme, slicer analizi ve fiyatlandırılmış teklif
          sonraki fazlardadır. Bu sayfa form kabul etmez, dosya almaz ve ödeme
          başlatmaz.
        </p>
      </StatusNotice>
    </ContentPage>
  );
}
