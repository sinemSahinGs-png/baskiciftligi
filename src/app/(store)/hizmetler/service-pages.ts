import type { Route } from "next";

export type ServicePageContent = {
  slug: "3d-baski" | "3d-modelleme" | "3d-tarama" | "prototip";
  href: Route;
  navLabel: string;
  title: string;
  metadataTitle: string;
  metadataDescription: string;
  eyebrow: string;
  heading: string;
  description: string;
  cards: Array<{
    title: string;
    description: string;
    detail: string;
  }>;
  steps: Array<{
    title: string;
    description: string;
  }>;
};

export const servicePages: ServicePageContent[] = [
  {
    slug: "3d-baski",
    href: "/hizmetler/3d-baski",
    navLabel: "3D Baskı",
    title: "3D Baskı",
    metadataTitle: "3D Baskı Hizmeti",
    metadataDescription:
      "FDM ve SLA üretim yaklaşımı, malzeme seçimi ve küçük seri baskı hazırlığı. Otomatik fiyat veya teslim süresi taahhüdü içermez.",
    eyebrow: "Üretim",
    heading: "Parçanın görevi netleşmeden baskıya geçilmez.",
    description:
      "3D baskı, dosyayı makineye göndermek değildir. Kullanım, ölçü toleransı, yüzey ve adet birlikte okunmadan doğru teknoloji ve malzeme seçilemez. Bu sayfa yaklaşımı anlatır; sipariş, ödeme veya otomatik üretim başlatmaz.",
    cards: [
      {
        title: "FDM üretim",
        description:
          "İşlevsel parçalar, muhafazalar ve dayanıklılık gerektiren formlar için katmanlı termoplastik üretim.",
        detail: "Girdi: malzeme adayı, duvar kalınlığı, yönlendirme ve kullanım ortamı.",
      },
      {
        title: "SLA / reçine",
        description:
          "İnce yüzey, küçük detay ve görsel doğrulama gereken parçalarda kontrollü reçine baskı.",
        detail: "Girdi: görünür yüzeyler, boya/son işlem beklentisi ve kırılganlık sınırı.",
      },
      {
        title: "Küçük seri",
        description:
          "Onaylanan sürüm üzerinden tekrarlanabilir üretim; her parça için ayrı tahmin üretilmez.",
        detail: "Girdi: adet aralığı, kabul ölçütü ve paketleme ihtiyacı.",
      },
      {
        title: "Kalite kapısı",
        description:
          "Kritik ölçü, montaj ilişkisi ve yüzey beklentisi yazılı olmadan üretim onayı verilmez.",
        detail: "Girdi: kontrol edilecek ölçüler ve kabul / ret kriteri.",
      },
    ],
    steps: [
      {
        title: "Kullanım ve kısıt",
        description:
          "Parçanın nerede çalışacağı, hangi yüke dayanacağı ve hangi ölçünün kritik olduğu yazılır.",
      },
      {
        title: "Teknoloji seçimi",
        description:
          "FDM veya SLA, malzeme ve yönlendirme ihtiyaca göre önerilir; varsayılan bir reçete dayatılmaz.",
      },
      {
        title: "Numune veya üretim onayı",
        description:
          "Gerekliyse tek parça doğrulanır. Onaysız dosya üretim kuyruğuna alınmaz.",
      },
    ],
  },
  {
    slug: "3d-modelleme",
    href: "/hizmetler/3d-modelleme",
    navLabel: "3D Modelleme",
    title: "3D Modelleme",
    metadataTitle: "3D Modelleme Hizmeti",
    metadataDescription:
      "Üretime uygun modelleme, revizyon ve baskı hazırlığı. Bu sayfa dosya kabul etmez ve otomatik model üretmez.",
    eyebrow: "Tasarım",
    heading: "Üretilemeyen bir model, tamamlanmış bir model değildir.",
    description:
      "Modelleme işi görsel bir render teslim etmekle bitmez. Duvar kalınlığı, ayrılabilir parçalar, tolerans ve baskı yönü üretimden önce çözülür. Bu sayfa kapsamı anlatır; CAD dosyası yüklemez veya anında model üretmez.",
    cards: [
      {
        title: "Üretime uygun model",
        description:
          "Mevcut fikri veya referansı, seçilen baskı teknolojisinin sınırlarına göre modellenebilir forma çevirme.",
        detail: "Girdi: referans görsel/ölçü, kullanım amacı ve revizyon sınırı.",
      },
      {
        title: "Baskı hazırlığı",
        description:
          "Destek, oryantasyon ve ince duvar risklerinin üretim öncesi kontrolü.",
        detail: "Girdi: hedef teknoloji, malzeme ve kritik yüzeyler.",
      },
      {
        title: "Revizyon",
        description:
          "Onay döngüsü sınırlı tutulur; her yeni istek ayrı bir karar olarak kaydedilir.",
        detail: "Girdi: değişecek alanlar ve önceki onaylı sürüm.",
      },
      {
        title: "Teslim formatı",
        description:
          "Planlanan teslim STEP/STL/3MF gibi üretim dosyalarıdır; henüz otomatik indirme yok.",
        detail: "Girdi: ihtiyaç duyulan format ve sonraki üretim adımı.",
      },
    ],
    steps: [
      {
        title: "Brief",
        description:
          "Ölçü, fonksiyon ve görünüş önceliği yazılı hale getirilir; belirsiz alan açık bırakılmaz.",
      },
      {
        title: "Taslak form",
        description:
          "İlk hacim ve birleşim ilişkisi paylaşılır; ince detay bu aşamada kilitlemez.",
      },
      {
        title: "Üretim onayı",
        description:
          "Kalınlık, ayrılabilirlik ve tolerans kontrolünden sonra model baskıya hazır sayılır.",
      },
    ],
  },
  {
    slug: "3d-tarama",
    href: "/hizmetler/3d-tarama",
    navLabel: "3D Tarama",
    title: "3D Tarama",
    metadataTitle: "3D Tarama Hizmeti",
    metadataDescription:
      "Fiziksel parçadan referans mesh veya modelleme girdisi. Canlı tarama randevusu veya otomatik teslim bu fazda açık değildir.",
    eyebrow: "Sayısallaştırma",
    heading: "Taranmış bir mesh, üretime hazır bir model değildir.",
    description:
      "3D tarama, mevcut bir parçadan referans veri üretir. Gürültü, görünmeyen yüzeyler ve malzeme yansıması sonucu etkiler. Bu sayfa hizmetin sınırını anlatır; randevu, saha tarama veya otomatik CAD dönüşümü satmaz.",
    cards: [
      {
        title: "Referans tarama",
        description:
          "Yedek parça, kalıp referansı veya form doğrulama için fiziksel objeden mesh üretimi.",
        detail: "Girdi: parça boyutu, yüzey karakteri ve beklenecek doğruluk.",
      },
      {
        title: "Kör noktalar",
        description:
          "İç kanallar, derin boşluklar ve parlak yüzeyler eksik veya gürültülü veri üretebilir.",
        detail: "Girdi: görünür olmayan geometri ve kabul edilebilir boşluk.",
      },
      {
        title: "Mesh sonrası iş",
        description:
          "Temizleme, hizalama ve gerektiğinde parametrik yeniden modelleme ayrı bir adımdır.",
        detail: "Girdi: tarama çıktısının CAD’e çevrilip çevrilmeyeceği.",
      },
      {
        title: "Telif ve sahiplik",
        description:
          "Başkasının tasarımı veya markalı parça, tarama talebiyle otomatik çoğaltılamaz.",
        detail: "Girdi: parçanın kime ait olduğu ve kullanım hakkı.",
      },
    ],
    steps: [
      {
        title: "Parça ve amaç",
        description:
          "Neden tarandığı, hangi ölçünün kritik olduğu ve çıktının mesh mi model mi olacağı netleşir.",
      },
      {
        title: "Veri kalitesi",
        description:
          "Görünür yüzey, boyut ve yansıma riski tarama yöntemini belirler; her parça taranamaz.",
      },
      {
        title: "Sonraki adım",
        description:
          "Temiz mesh, yeniden modelleme veya baskı hazırlığı ayrı onay ister; tarama tek başına üretim değildir.",
      },
    ],
  },
  {
    slug: "prototip",
    href: "/hizmetler/prototip",
    navLabel: "Prototip",
    title: "Prototipleme",
    metadataTitle: "Prototip ve Doğrulama",
    metadataDescription:
      "Form, montaj ve kullanım doğrulaması için kontrollü prototip planı. Bu sayfa otomatik teklif veya üretim kuyruğu açmaz.",
    eyebrow: "Doğrulama",
    heading: "İlk parça, seri üretim kararı değildir.",
    description:
      "Prototip, bir fikrin elde tutulabilir hâle gelmesidir. Ölçü, montaj ve kullanım senaryosu erken görülür; maliyet ve teslim ancak brief netleşince konuşulur. Bu sayfa doğrulama kapısını anlatır, sipariş oluşturmaz.",
    cards: [
      {
        title: "Form prototipi",
        description:
          "Hacim, ergonomi ve görünüşü erken aşamada görmek için düşük riskli ilk parça.",
        detail: "Girdi: kritik dış ölçüler ve hangisinin henüz kilitlenmediği.",
      },
      {
        title: "Montaj doğrulaması",
        description:
          "Birden fazla parçanın oturması, vida/klips ilişkisi ve tolerans yığılması kontrolü.",
        detail: "Girdi: eşleşen parçalar, boşluk beklentisi ve birleşim yöntemi.",
      },
      {
        title: "Kullanım denemesi",
        description:
          "Gerçek elde tutma, yük veya ısı senaryosu; görsel maket ile karıştırılmaz.",
        detail: "Girdi: denenecek senaryo ve başarı kriteri.",
      },
      {
        title: "Seriye geçiş kapısı",
        description:
          "Onaylanan prototip sürümü sabitlenmeden küçük seri veya katalog üretimi başlamaz.",
        detail: "Girdi: revizyon numarası, kabul ölçütü ve sorumlu onaylayan.",
      },
    ],
    steps: [
      {
        title: "Doğrulama sorusu",
        description:
          "Bu prototipin hangi kararı kapatacağı yazılır: görünüş, ölçü, montaj veya kullanım.",
      },
      {
        title: "Tek parça",
        description:
          "İlk çıktı öğrenmek içindir. Renk, paket ve adet bu aşamada kilitlemez.",
      },
      {
        title: "Karar kaydı",
        description:
          "Kabul, revizyon veya vazgeçme yazılı olur. Sessiz onay üretim kararı sayılmaz.",
      },
    ],
  },
];

export function getServicePage(slug: ServicePageContent["slug"]) {
  const page = servicePages.find((item) => item.slug === slug);

  if (!page) {
    throw new Error(`Hizmet sayfası bulunamadı: ${slug}`);
  }

  return page;
}
