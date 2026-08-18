import {
  ContentCard,
  ContentPage,
  SectionHeading,
  StatusNotice,
} from "@/components/content/content-layout";
import { createPageMetadata } from "@/components/content/metadata";
import { siteConfig } from "@/config/site";

export const metadata = createPageMetadata({
  title: "Hakkımızda",
  description: `${siteConfig.name} dijital tasarımı kontrollü fiziksel üretime dönüştürme yaklaşımı.`,
  path: "/hakkimizda",
});

const principles = [
  {
    title: "Net kapsam",
    description:
      "Demo, planlanan entegrasyon ve aktif özellikleri birbirinden ayırır; çalışmayan bir akışı tamamlanmış gibi sunmayız.",
  },
  {
    title: "İzlenebilir karar",
    description:
      "Malzeme, sürüm, adet ve onay gibi üretimi etkileyen kararların yazılı ve tekrar bulunabilir olmasını hedefleriz.",
  },
  {
    title: "Üretilebilir tasarım",
    description:
      "Form kadar duvar kalınlığı, tolerans, baskı yönü, destek ve kullanım ortamını da tasarım girdisi kabul ederiz.",
  },
  {
    title: "Sorumlu kaynak",
    description:
      "Harici modelleri yalnız resmî entegrasyon ve doğrulanmış izin çerçevesinde değerlendirir; içerik kazımaya dayanmayız.",
  },
] as const;

export default function AboutPage() {
  return (
    <ContentPage
      eyebrow="Hakkımızda"
      title="Dijital fikri, üretim kararı net bir objeye dönüştürmek."
      description={`${siteConfig.name}; fiziksel ürünler, kişiselleştirme ve 3D baskı üretimi için güvenilir bir dijital süreç kurmayı amaçlayan bir stüdyo yaklaşımıdır. Bu sayfa doğrulanmamış kuruluş yılı, ekip büyüklüğü veya üretim kapasitesi iddiası içermez.`}
      actions={[
        { href: "/hizmetler", label: "Yaklaşımı inceleyin" },
        { href: "/iletisim", label: "İletişim durumu", variant: "outline" },
      ]}
    >
      <StatusNotice title="Şeffaflık notu">
        <p>
          Uygulama kademeli geliştirilmektedir. Mağaza temeli Phase 1, ödeme
          Phase 2, özel model yükleme Phase 3 ve resmî harici model entegrasyonu
          Phase 5 kapsamındadır. Bir sayfanın mevcut olması, ilgili özelliğin
          aktif olduğu anlamına gelmez.
        </p>
      </StatusNotice>

      <section className="section-space" aria-labelledby="ilkeler-baslik">
        <div id="ilkeler-baslik">
          <SectionHeading
            eyebrow="İlkeler"
            title="Üretim kadar beklentiyi de tasarlarız"
            description="Aşağıdaki ilkeler ürün ve hizmet sayfalarında kullanılan karar çerçevesini tanımlar."
          />
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {principles.map((principle) => (
            <ContentCard
              key={principle.title}
              title={principle.title}
              description={principle.description}
            />
          ))}
        </div>
      </section>

      <section
        className="grid gap-8 rounded-3xl border border-white/10 bg-card/60 p-7 sm:p-10 lg:grid-cols-[0.85fr_1.15fr]"
        aria-labelledby="odak-baslik"
      >
        <div>
          <p className="eyebrow">Odak</p>
          <h2
            id="odak-baslik"
            className="mt-5 font-heading text-3xl font-medium"
          >
            Satılabilir üründen özel üretime uzanan tek, anlaşılır sistem
          </h2>
        </div>
        <div className="space-y-5 text-base leading-7 text-muted-foreground">
          <p>
            Öncelik, stüdyonun kendi fiziksel ürünlerini yönetebildiği güvenilir
            bir mağaza temelidir. Özel üretim ve model keşfi bu temelin üzerine,
            gerekli güvenlik ve operasyon kapıları tamamlandığında eklenir.
          </p>
          <p>
            Bu ayrım; ödeme, dosya güvenliği, lisans ve üretim risklerinin bir
            arayüz demosu nedeniyle görünmez hâle gelmesini engeller.
          </p>
        </div>
      </section>
    </ContentPage>
  );
}
