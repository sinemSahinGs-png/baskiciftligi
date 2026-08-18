import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ContentPage,
  ScoreMeter,
  SectionHeading,
  StatusNotice,
} from "@/components/content/content-layout";
import { createPageMetadata } from "@/components/content/metadata";
import { getMaterialBySlug, listMaterials } from "@/domain/catalog/repository";

type MaterialDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const materials = await listMaterials();

  return materials.map((material) => ({
    slug: material.slug,
  }));
}

export async function generateMetadata({
  params,
}: MaterialDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const material = await getMaterialBySlug(slug);

  return createPageMetadata({
    title: material
      ? `${material.name} 3D Baskı Malzemesi`
      : "Malzeme Bulunamadı",
    description:
      material?.summary ??
      "İstenen malzeme kaydı bulunamadı veya yayınlanmış katalogda yer almıyor.",
    path: `/malzemeler/${slug}`,
    noIndex: !material,
  });
}

export default async function MaterialDetailPage({
  params,
}: MaterialDetailPageProps) {
  const { slug } = await params;
  const material = await getMaterialBySlug(slug);

  if (!material) {
    notFound();
  }

  return (
    <ContentPage
      eyebrow={`${material.technology} malzeme`}
      title={material.name}
      description={material.summary}
      status={
        material.isDemo
          ? { label: "Repository demo kaydı", tone: "info" }
          : { label: "Yayınlanmış katalog kaydı", tone: "safe" }
      }
      actions={[
        { href: "/malzemeler", label: "Tüm malzemeler", variant: "outline" },
        {
          href: "/kurumsal-teklif",
          label: "Proje brief’i hazırlayın",
          variant: "commerce",
        },
      ]}
      backLink={{ href: "/malzemeler", label: "Malzemeler" }}
    >
      {material.isDemo ? (
        <StatusNotice title="Bu malzeme kaydı demo veridir">
          <p>
            Renkler, puanlar ve kullanım örnekleri arayüz sunumu içindir. Gerçek
            tedarikçi, ürün kodu, teknik föy ve parti bilgisi bağlanmadan satın
            alma veya mühendislik kararı için kullanılmamalıdır.
          </p>
        </StatusNotice>
      ) : (
        <StatusNotice title="Teknik doğrulama yine gereklidir">
          <p>
            Katalog kaydı yayınlanmış olsa da marka, formül ve üretim ayarları
            sonucu değiştirebilir. Kritik kullanımda güncel üretici föyü, numune
            ve gerçek ortam testi önceliklidir.
          </p>
        </StatusNotice>
      )}

      <section className="mt-12 grid gap-5 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-3xl border border-white/10 bg-card/70 p-7 sm:p-9">
          <SectionHeading
            eyebrow="Göreceli profil"
            title="Katalog içi karşılaştırma"
            description="Puanlar 1–5 ölçeğindedir ve sertifikalı ölçüm birimi değildir."
          />
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <ScoreMeter label="Dayanım" value={material.durability} />
            <ScoreMeter
              label="Yüzey kalitesi"
              value={material.surfaceQuality}
            />
            <ScoreMeter label="Isı direnci" value={material.heatResistance} />
            <ScoreMeter label="Esneklik" value={material.flexibility} />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-7 sm:p-9">
          <p className="text-xs font-bold tracking-[0.16em] text-cyan uppercase">
            Kayıt özeti
          </p>
          <dl className="mt-6 space-y-5">
            <div className="border-b border-white/10 pb-5">
              <dt className="text-xs text-muted-foreground">Teknoloji</dt>
              <dd className="mt-1 font-heading text-xl font-semibold">
                {material.technology}
              </dd>
            </div>
            <div className="border-b border-white/10 pb-5">
              <dt className="text-xs text-muted-foreground">
                Uygunluk etiketi
              </dt>
              <dd className="mt-1 font-heading text-xl font-semibold">
                {material.suitability}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Veri kaynağı</dt>
              <dd className="mt-1 font-heading text-xl font-semibold">
                {material.isDemo
                  ? "Demo katalog fallback’i"
                  : "Canlı repository"}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section-space grid gap-10 lg:grid-cols-2">
        <div aria-labelledby="kullanim-baslik">
          <p className="eyebrow">Kullanım örnekleri</p>
          <h2
            id="kullanim-baslik"
            className="mt-5 font-heading text-3xl font-medium"
          >
            Katalogda ilişkilendirilen senaryolar
          </h2>
          <ul className="mt-7 space-y-3">
            {material.useCases.map((useCase) => (
              <li
                key={useCase}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm"
              >
                <span
                  aria-hidden="true"
                  className="size-1.5 shrink-0 rounded-full bg-cyan"
                />
                {useCase}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs leading-5 text-muted-foreground">
            Bu örnekler otomatik uygunluk onayı değildir. Geometri ve gerçek
            kullanım koşulları ayrıca incelenmelidir.
          </p>
        </div>

        <div aria-labelledby="renkler-baslik">
          <p className="eyebrow">Renk paleti</p>
          <h2
            id="renkler-baslik"
            className="mt-5 font-heading text-3xl font-medium"
          >
            Repository’de bulunan renkler
          </h2>
          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
            {material.colors.map((color) => (
              <li
                key={`${material.id}-${color.name}`}
                className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.025] p-4"
              >
                <span
                  aria-hidden="true"
                  className="size-9 rounded-full border border-white/15 shadow-inner"
                  style={{ backgroundColor: color.hex }}
                />
                <div>
                  <p className="text-sm font-semibold">{color.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {color.hex}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs leading-5 text-muted-foreground">
            Ekran rengi fiziksel filament veya reçineyi birebir temsil etmez.
            Parti, yüzey ve ışık koşulu görünümü değiştirebilir.
          </p>
        </div>
      </section>

      <StatusNotice title="Güvenlik açısından kritik kullanım">
        <p>
          Gıda teması, medikal kullanım, elektrik güvenliği, yangın davranışı,
          basınç, taşıyıcı parça veya mevzuata tabi uygulamalar için bu genel
          katalog bilgisi yeterli değildir. Uygun sertifika ve mühendislik
          doğrulaması ayrıca sağlanmalıdır.
        </p>
      </StatusNotice>
    </ContentPage>
  );
}
