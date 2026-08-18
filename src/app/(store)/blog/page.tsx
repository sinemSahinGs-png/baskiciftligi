import type { Route } from "next";
import { BookOpenText } from "lucide-react";

import { editorialDrafts } from "@/components/content/content-data";
import {
  ContentCard,
  ContentPage,
  StatusNotice,
  TextLink,
} from "@/components/content/content-layout";
import { createPageMetadata } from "@/components/content/metadata";
import { siteConfig } from "@/config/site";

export const metadata = createPageMetadata({
  title: "Blog",
  description: `3D baskı teknolojisi, dosya hazırlığı ve küçük seri üretim üzerine açıkça etiketlenmiş ${siteConfig.name} demo editoryal taslakları.`,
  path: "/blog",
  noIndex: true,
});

export default function BlogPage() {
  return (
    <ContentPage
      eyebrow="Blog"
      title="Üretim kararlarını sadeleştiren notlar."
      description="Bu alandaki içerikler yayınlanmış kurumsal makale değil, ürün deneyimini göstermek için hazırlanmış demo editoryal taslaklardır. Yayın tarihi, yazar veya güncellik iddiası taşımaz."
      status={{ label: "Demo editoryal taslaklar", tone: "info" }}
    >
      <StatusNotice title="Editoryal durum">
        <p>
          İçerikler genel eğitim amaçlı hazırlık metinleridir. Teknik föy,
          mühendislik hesabı, hukuk görüşü veya proje özelinde üretim önerisi
          yerine geçmez. Yayına alınmadan önce konu uzmanı, kaynak ve tarih
          kontrolü gerektirir.
        </p>
      </StatusNotice>

      <section
        className="section-space grid gap-5 lg:grid-cols-3"
        aria-label="Demo blog taslakları"
      >
        {editorialDrafts.map((draft, index) => {
          const href = `/blog/${draft.slug}` as Route;

          return (
            <ContentCard
              key={draft.slug}
              eyebrow={`${String(index + 1).padStart(2, "0")} · ${draft.readingLabel}`}
              title={draft.title}
              description={draft.excerpt}
              className="min-h-full"
            >
              <div className="mb-5 flex items-center gap-2 text-xs text-muted-foreground">
                <BookOpenText aria-hidden="true" className="size-4" />
                Yayınlanmamış demo içerik
              </div>
              <TextLink href={href}>Taslağı okuyun</TextLink>
            </ContentCard>
          );
        })}
      </section>
    </ContentPage>
  );
}
