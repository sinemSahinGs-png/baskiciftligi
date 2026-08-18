import Image from "next/image";
import Link from "next/link";

import { FoundryGrid } from "@/components/brand/foundry-grid";
import { CorporateLeadForm } from "@/components/corporate/lead-form";
import {
  ContentCard,
  NumberedSteps,
  SectionHeading,
  StatusNotice,
} from "@/components/content/content-layout";
import { createPageMetadata } from "@/components/content/metadata";
import { siteConfig } from "@/config/site";

export const metadata = createPageMetadata({
  title: "Kurumsal 3D Baskı Üretimi",
  description:
    "Prototip, kişiselleştirme ve küçük seri 3D baskı ihtiyaçları için yapılandırılmış kurumsal üretim yaklaşımı.",
  path: "/kurumsal-uretim",
});

const capabilities = [
  {
    title: "Yetenekler",
    description:
      "FDM ve SLA ile prototip, kişiselleştirme ve küçük seri. Uygunluk geometri ve kullanıma göre proje bazında netleşir.",
  },
  {
    title: "Parti üretim",
    description:
      "Onaylı sürümün tekrarlanması. Parti büyüklüğü veya makine kapasitesi bu sayfada iddia edilmez.",
  },
  {
    title: "Prototipleme",
    description:
      "Form, ölçü ve montaj kararları için numune. Otomatik teslim tarihi üretilmez.",
  },
  {
    title: "Promosyon ürünleri",
    description:
      "İsim, logo veya renk değişen marka objeleri. Adet ve son işlem brief’te yazılır.",
  },
  {
    title: "Teknik parçalar",
    description:
      "Aparat, muhafaza ve yardımcı ekipman. Tolerans beklentisi yazılı olmadan üretime alınmaz.",
  },
  {
    title: "Kalite kontrol",
    description:
      "Görsel ve ölçü kontrolü, onaylı sürümle karşılaştırılır. Sertifika veya laboratuvar iddiası yoktur.",
  },
] as const;

const projectExamples = [
  {
    title: "Masaüstü marka objesi",
    description:
      "Renk ve isim değişen küçük seri yönü. Bu bir tamamlanmış referans iddiası değildir; demo yönlendirme görselidir.",
    image: "/demo/products/type-nameplate.svg",
  },
  {
    title: "Form prototipi",
    description:
      "Seri kalıbı öncesi yüzey ve oran kontrolü. Kapasite veya süre rakamı bağlanmaz.",
    image: "/demo/products/flux-vazo.svg",
  },
  {
    title: "İşlevsel aparat",
    description:
      "Atölye yardımcı parçası fikri. Ölçü doğrulaması brief ve numune ile yapılır.",
    image: "/demo/products/arc-stand.svg",
  },
] as const;

const scenarios = [
  {
    title: "Ürün ve ambalaj prototipi",
    description:
      "Ölçü, form, montaj ve sunum kararlarını seri yatırım öncesinde fiziksel örnekle değerlendirme.",
  },
  {
    title: "Etkinlik ve marka objeleri",
    description:
      "İsim, logo, renk veya etkinlik verisine göre değişen küçük seri parçalar için kontrollü kişiselleştirme.",
  },
  {
    title: "Aparat ve yardımcı ekipman",
    description:
      "İş akışına özel tutucu, konumlandırıcı veya muhafaza fikirlerinin prototip ve saha doğrulaması.",
  },
  {
    title: "Düşük adetli son ürün",
    description:
      "Kalıp yatırımından önce pazar veya kullanım doğrulaması gereken sınırlı üretim senaryoları.",
  },
] as const;

const faqs = [
  {
    q: "Kapasite rakamı paylaşılıyor mu?",
    a: "Hayır. Doğrulanmamış makine sayısı, aylık parça kapasitesi veya teslim garantisi bu sayfada yer almaz.",
  },
  {
    q: "Form gönderince teklif oluşur mu?",
    a: "Oluşmaz. Lead altyapısı bağlı olmadığı için brief tarayıcıda kalır ve kayıt yazılmaz.",
  },
  {
    q: "Dosya eki yüklenir mi?",
    a: "Şu an hayır. Ek yalnızca yerel olarak seçilir; depolama uç noktası açık değildir.",
  },
] as const;

export default function CorporateProductionPage() {
  return (
    <main id="ana-icerik">
      <header className="relative overflow-hidden bg-carbon text-light-text">
        <FoundryGrid variant="corner" className="opacity-80" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[linear-gradient(90deg,transparent,rgb(255_146_56/0.35))]"
        />
        <div className="shell relative grid items-end gap-8 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div>
            <p className="text-sm text-orange">Kurumsal üretim</p>
            <h1 className="display-title mt-4">
              Küçük seriyi, tek parça ciddiyetiyle planlayın.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-light">
              Onaylanan sürümün, malzemenin ve kalite kriterinin her partide
              izlenebilir kalması gerekir. {siteConfig.name} bu süreci otomatik
              teklif gibi sunmaz.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#brief"
                className="inline-flex min-h-12 items-center rounded-md bg-orange px-5 text-sm font-semibold text-dark-text"
              >
                Brief hazırla
              </a>
              <Link
                href="/malzemeler"
                className="inline-flex min-h-12 items-center rounded-md border border-white/20 px-5 text-sm font-semibold"
              >
                Malzemeleri incele
              </Link>
            </div>
          </div>
          <div className="media-frame relative min-h-64 border border-white/10">
            <Image
              src="/demo/categories/kurumsal-promosyon.png"
              alt=""
              fill
              className="object-cover"
            />
          </div>
        </div>
      </header>

      <div className="shell py-8 sm:py-12">
        <section className="max-w-3xl" aria-labelledby="kurumsal-durum">
          <h2 id="kurumsal-durum" className="sr-only">
            Teklif durumu
          </h2>
          <StatusNotice title="Teklif ve üretim kabulü manuel doğrulama gerektirir">
            <p>
              Aktif bir otomatik teklif, kapasite rezervasyonu veya bağlayıcı
              termin oluşturulmaz. Proje ancak doğrulanmış iletişim, kapsam ve
              yazılı onay sonrasında değerlendirmeye alınabilir.
            </p>
          </StatusNotice>
        </section>

        <section className="section-space-tight" aria-labelledby="yetenekler-baslik">
          <div id="yetenekler-baslik">
            <SectionHeading
              title="Kurumsal üretim yönleri"
              description="Her başlık bir çalışma alanı gösterir; doğrulanmamış kapasite veya teslim garantisi içermez."
            />
          </div>
          <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((item) => (
              <ContentCard
                key={item.title}
                title={item.title}
                description={item.description}
                className="rounded-none border-0"
              />
            ))}
          </div>
        </section>

        <section className="section-space" aria-labelledby="ornekler-baslik">
          <div id="ornekler-baslik">
            <SectionHeading
              title="Proje örnekleri"
              description="Görseller stüdyo demosudur. Tamamlanmış müşteri işi, adet veya süre iddiası değildir."
            />
          </div>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {projectExamples.map((example) => (
              <li
                key={example.title}
                className="overflow-hidden rounded-xl border border-hairline bg-optical"
              >
                <div className="relative aspect-[4/3] bg-carbon">
                  <Image
                    src={example.image}
                    alt=""
                    fill
                    className="object-contain p-6"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-heading text-xl font-bold">
                    {example.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-ink-secondary">
                    {example.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="section-space" aria-labelledby="senaryolar-baslik">
          <div id="senaryolar-baslik">
            <SectionHeading
              title="3D baskının değer üretebildiği işler"
              description="Uygunluk; geometri, adet, beklenti ve risk düzeyine göre proje bazında değerlendirilir."
            />
          </div>
          <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline md:grid-cols-2">
            {scenarios.map((scenario) => (
              <ContentCard
                key={scenario.title}
                title={scenario.title}
                description={scenario.description}
                className="rounded-none border-0"
              />
            ))}
          </div>
        </section>

        <section aria-labelledby="kurumsal-surec-baslik">
          <div id="kurumsal-surec-baslik">
            <SectionHeading
              title="Brief’ten parti onayına"
              description="Her kapı, bir sonraki aşamaya geçmeden önce hangi kararın kayıt altına alınacağını gösterir."
            />
          </div>
          <div className="mt-10">
            <NumberedSteps
              steps={[
                {
                  title: "Kapsam ve risk",
                  description:
                    "Kullanım ortamı, adet senaryosu, kritik ölçüler ve fikrî hak durumu değerlendirilir.",
                },
                {
                  title: "Numune ve revizyon",
                  description:
                    "Gerekli işlerde üretim numunesi üzerinden ölçü, görünüş ve işlev onayı alınır.",
                },
                {
                  title: "Parti ve teslim",
                  description:
                    "Onaylı sürüm, izlenebilir parti bilgisi ve kabul kriteriyle üretim planı oluşturulur.",
                },
              ]}
            />
          </div>
        </section>

        <section id="brief" className="section-space">
          <CorporateLeadForm />
        </section>

        <section className="max-w-3xl">
          <h2 className="section-title">Sık sorulanlar</h2>
          <dl className="mt-8 divide-y divide-hairline border-y border-hairline">
            {faqs.map((item) => (
              <div key={item.q} className="py-5">
                <dt className="font-semibold">{item.q}</dt>
                <dd className="mt-2 text-sm leading-6 text-ink-secondary">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  );
}
