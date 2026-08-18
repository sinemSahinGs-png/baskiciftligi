import type { Route } from "next";

import {
  ContentCard,
  ContentPage,
  ScoreMeter,
  SectionHeading,
  StatusNotice,
  TextLink,
} from "@/components/content/content-layout";
import { createPageMetadata } from "@/components/content/metadata";
import { listMaterials } from "@/domain/catalog/repository";

export const metadata = createPageMetadata({
  title: "3D Baskı Malzemeleri",
  description:
    "FDM ve SLA malzemelerini dayanım, yüzey, ısı direnci, esneklik ve kullanım alanına göre karşılaştırın.",
  path: "/malzemeler",
});

export default async function MaterialsPage() {
  const materials = await listMaterials();
  const isDemoCatalog = materials.some((material) => material.isDemo);

  return (
    <ContentPage
      eyebrow="Malzemeler"
      title="Doğru malzeme, parçanın görevinden başlar."
      description="FDM ve SLA seçeneklerini yalnız renk veya görünüşe göre değil; kullanım ortamı, yük, ısı, UV, esneklik ve yüzey beklentisiyle birlikte değerlendirin."
      actions={[
        {
          href: "/hizmetler",
          label: "Hizmet yaklaşımını görün",
          variant: "outline",
        },
        {
          href: "/kurumsal-teklif",
          label: "Proje brief’i hazırlayın",
          variant: "commerce",
        },
      ]}
    >
      {isDemoCatalog ? (
        <StatusNotice title="Demo malzeme kataloğu görüntüleniyor">
          <p>
            Supabase üretim verisi yerine repository’nin açıkça işaretlenmiş
            demo kayıtları kullanılıyor. Puanlar göreceli ürün rehberidir;
            üretici teknik föyü, sertifika veya proje bazlı test sonucu
            değildir.
          </p>
        </StatusNotice>
      ) : (
        <StatusNotice
          title="Malzeme verisi canlı repository’den geliyor"
          tone="safe"
        >
          <p>
            Değerler yine de genel karşılaştırmadır. Kritik mühendislik,
            güvenlik veya mevzuat gerektiren kullanımlarda güncel üretici
            dokümanı ve numune testi ayrıca doğrulanmalıdır.
          </p>
        </StatusNotice>
      )}

      <section
        className="section-space"
        aria-labelledby="malzeme-listesi-baslik"
      >
        <div id="malzeme-listesi-baslik">
          <SectionHeading
            eyebrow="Karşılaştırma"
            title={`${materials.length} malzeme kaydı`}
            description="1–5 puanları aynı katalog içindeki göreceli karşılaştırmayı kolaylaştırır; farklı tedarikçi ve reçete varyasyonlarını temsil etmeyebilir."
          />
        </div>

        {materials.length ? (
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {materials.map((material) => {
              const href = `/malzemeler/${material.slug}` as Route;

              return (
                <ContentCard
                  key={material.id}
                  eyebrow={`${material.technology}${material.isDemo ? " · Demo" : ""}`}
                  title={material.name}
                  description={material.summary}
                  className="p-7 sm:p-8"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ScoreMeter label="Dayanım" value={material.durability} />
                    <ScoreMeter
                      label="Yüzey kalitesi"
                      value={material.surfaceQuality}
                    />
                    <ScoreMeter
                      label="Isı direnci"
                      value={material.heatResistance}
                    />
                    <ScoreMeter label="Esneklik" value={material.flexibility} />
                  </div>

                  <div
                    className="mt-6 flex flex-wrap gap-2"
                    aria-label="Örnek renkler"
                  >
                    {material.colors.map((color) => (
                      <span
                        key={`${material.id}-${color.name}`}
                        className="inline-flex items-center gap-2 rounded-md border border-hairline px-2 py-1.5 text-xs"
                      >
                        <span
                          aria-hidden="true"
                          className="size-8 rounded-md border border-black/10"
                          style={{ backgroundColor: color.hex }}
                        />
                        {color.name}
                      </span>
                    ))}
                  </div>

                  <TextLink href={href} className="mt-6">
                    Malzeme detayını görün
                  </TextLink>
                </ContentCard>
              );
            })}
          </div>
        ) : (
          <StatusNotice
            title="Yayınlanmış malzeme bulunamadı"
            tone="warning"
            className="mt-10"
          >
            <p>
              Repository boş bir liste döndürdü. Sahte fallback kartı
              oluşturulmadı; katalog verisi yayınlanana kadar malzeme detayı
              sunulamaz.
            </p>
          </StatusNotice>
        )}
      </section>

      <section
        className="rounded-3xl border border-white/10 bg-card/60 p-7 sm:p-10"
        aria-labelledby="malzeme-karar-baslik"
      >
        <p className="eyebrow">Karar notu</p>
        <h2
          id="malzeme-karar-baslik"
          className="mt-5 max-w-3xl font-heading text-3xl font-medium"
        >
          “En güçlü” değil, kullanım senaryosuna en uygun malzemeyi arayın.
        </h2>
        <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">
          Katman yönü, parça geometrisi, duvar kalınlığı, üretim ayarları ve
          sonlandırma işlemleri malzeme adı kadar sonucu etkileyebilir. Kritik
          parçalarda numune ve gerçek kullanım testi planlayın.
        </p>
      </section>
    </ContentPage>
  );
}
