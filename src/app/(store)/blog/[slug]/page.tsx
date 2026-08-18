import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  editorialDrafts,
  getEditorialDraft,
} from "@/components/content/content-data";
import { ContentPage, StatusNotice } from "@/components/content/content-layout";
import { createPageMetadata } from "@/components/content/metadata";

type BlogDraftPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return editorialDrafts.map((draft) => ({
    slug: draft.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogDraftPageProps): Promise<Metadata> {
  const { slug } = await params;
  const draft = getEditorialDraft(slug);

  return createPageMetadata({
    title: draft?.title ?? "Blog Taslağı Bulunamadı",
    description:
      draft?.excerpt ??
      "İstenen demo editoryal taslak bulunamadı veya yayından kaldırıldı.",
    path: `/blog/${slug}`,
    noIndex: true,
  });
}

export default async function BlogDraftPage({ params }: BlogDraftPageProps) {
  const { slug } = await params;
  const draft = getEditorialDraft(slug);

  if (!draft) {
    notFound();
  }

  return (
    <ContentPage
      eyebrow="Demo editoryal taslak"
      title={draft.title}
      description={draft.excerpt}
      status={{
        label: "Yayınlanmamış · Uzman kontrolü bekliyor",
        tone: "info",
      }}
      actions={[{ href: "/blog", label: "Tüm taslaklar", variant: "outline" }]}
      backLink={{ href: "/blog", label: "Blog" }}
      width="reading"
    >
      <StatusNotice title="Yayın ve uzmanlık beyanı değildir">
        <p>
          Bu metin ürün arayüzü için hazırlanmış demo içeriktir. Yayın tarihi,
          yazar uzmanlığı, kaynakça veya güncellik iddiası yoktur. Kritik teknik
          kararlar güncel üretici dokümanı ve proje doğrulamasıyla alınmalıdır.
        </p>
      </StatusNotice>

      <article className="mt-12 space-y-14">
        {draft.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-heading text-3xl font-medium text-foreground">
              {section.heading}
            </h2>
            <div className="mt-5 space-y-5 text-base leading-8 text-muted-foreground">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            {section.bullets?.length ? (
              <ul className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/[0.025] p-6 text-sm leading-6 text-muted-foreground">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-cyan"
                    />
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </article>
    </ContentPage>
  );
}
