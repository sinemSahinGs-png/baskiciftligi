import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckSquare2, CircleDashed } from "lucide-react";

import {
  getLegalTemplate,
  legalTemplates,
} from "@/components/content/content-data";
import {
  ContentCard,
  ContentPage,
  StatusNotice,
} from "@/components/content/content-layout";
import { createPageMetadata } from "@/components/content/metadata";

type LegalTemplatePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return legalTemplates.map((template) => ({
    slug: template.slug,
  }));
}

export async function generateMetadata({
  params,
}: LegalTemplatePageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = getLegalTemplate(slug);

  return createPageMetadata({
    title: template?.title ?? "Yasal Şablon Bulunamadı",
    description:
      template?.summary ??
      "İstenen yasal hazırlık şablonu bulunamadı veya kullanım dışıdır.",
    path: `/yasal/${slug}`,
    noIndex: true,
  });
}

export default async function LegalTemplatePage({
  params,
}: LegalTemplatePageProps) {
  const { slug } = await params;
  const template = getLegalTemplate(slug);

  if (!template) {
    notFound();
  }

  return (
    <ContentPage
      eyebrow="Hukuki hazırlık şablonu"
      title={template.title}
      description={template.summary}
      status={{
        label: "Nihai metin değil · Production’da kullanmayın",
        tone: "warning",
      }}
      actions={[
        { href: "/yasal", label: "Tüm yasal şablonlar", variant: "outline" },
      ]}
      backLink={{ href: "/yasal", label: "Yasal metinler" }}
    >
      <StatusNotice title="Hukuki danışmanlık değildir" tone="warning">
        <p>
          Bu sayfa uygulanabilir hüküm, kesin süre, taraf bilgisi veya mevzuata
          uygunluk beyanı içermez. Türkiye’de yetkin hukuk danışmanı; güncel
          mevzuatı, gerçek ticari modeli ve veri akışını inceleyerek nihai metni
          hazırlamalıdır.
        </p>
      </StatusNotice>

      <section className="mt-12 grid gap-5 lg:grid-cols-2">
        <ContentCard
          eyebrow="01 · Eksik girdiler"
          title="Yazımdan önce doğrulanacak bilgiler"
          className="p-7 sm:p-9"
        >
          <ul className="space-y-4 text-sm leading-6 text-muted-foreground">
            {template.requiredInputs.map((item) => (
              <li key={item} className="flex gap-3">
                <CircleDashed
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-warm"
                />
                {item}
              </li>
            ))}
          </ul>
        </ContentCard>

        <ContentCard
          eyebrow="02 · Hukuk incelemesi"
          title="Danışmanla değerlendirilecek konular"
          className="p-7 sm:p-9"
        >
          <ul className="space-y-4 text-sm leading-6 text-muted-foreground">
            {template.reviewTopics.map((item) => (
              <li key={item} className="flex gap-3">
                <CheckSquare2
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-cyan"
                />
                {item}
              </li>
            ))}
          </ul>
        </ContentCard>
      </section>

      <section
        className="mt-12 rounded-3xl border border-white/10 bg-card/60 p-7 sm:p-10"
        aria-labelledby="yayin-kapisi-baslik"
      >
        <p className="eyebrow">Yayın kapısı</p>
        <h2
          id="yayin-kapisi-baslik"
          className="mt-5 font-heading text-3xl font-medium"
        >
          Şablondan production metnine geçiş
        </h2>
        <ol className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3">
          {[
            "Gerçek tacir, provider ve veri akışı envanteri tamamlanır.",
            "Hukuk danışmanı metni güncel mevzuata göre yazar ve onaylar.",
            "Sürüm, yürürlük tarihi, checkout onayı ve değişiklik kaydı test edilir.",
          ].map((item, index) => (
            <li
              key={item}
              className="bg-graphite p-6 text-sm leading-6 text-muted-foreground"
            >
              <span className="tabular text-xs font-bold text-cyan">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-3">{item}</p>
            </li>
          ))}
        </ol>
      </section>
    </ContentPage>
  );
}
