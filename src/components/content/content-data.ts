export type DemoModel = {
  externalId: string;
  name: string;
  summary: string;
  category: string;
  intendedProcess: string;
  notes: string[];
  permissionStatus: "unverified";
};

export const octoDemoModels: DemoModel[] = [
  {
    externalId: "lattice-vazo-konsepti",
    name: "Lattice Vazo Konsepti",
    summary:
      "Parametrik yüzey dilini anlatmak için hazırlanmış, dosya içermeyen stüdyo demo kaydı.",
    category: "Dekoratif konsept",
    intendedProcess: "FDM için tasarım araştırması",
    notes: [
      "İndirilebilir geometri bu kayda bağlı değildir.",
      "Üretilebilirlik, duvar kalınlığı ve devrilme dengesi doğrulanmamıştır.",
      "Ticari kullanım ve satış izni kayıt üzerinde doğrulanmamıştır.",
    ],
    permissionStatus: "unverified",
  },
  {
    externalId: "moduler-masaustu-konsepti",
    name: "Modüler Masaüstü Konsepti",
    summary:
      "Parçaların birlikte çalışma fikrini göstermek için kullanılan, satın alınamayan demo model kartı.",
    category: "Fonksiyonel konsept",
    intendedProcess: "FDM için modüler ürün araştırması",
    notes: [
      "Ölçü, tolerans ve geçme testleri tamamlanmış kabul edilmez.",
      "Bu sayfa gerçek stok, fiyat veya teslim süresi bildirmez.",
      "Ticari kullanım ve satış izni kayıt üzerinde doğrulanmamıştır.",
    ],
    permissionStatus: "unverified",
  },
  {
    externalId: "organik-aydinlatma-konsepti",
    name: "Organik Aydınlatma Konsepti",
    summary:
      "Işık geçirgen yüzey seçeneklerini tartışmak için hazırlanmış, elektrik bileşeni içermeyen demo kayıt.",
    category: "Aydınlatma konsepti",
    intendedProcess: "FDM için form araştırması",
    notes: [
      "Elektrik güvenliği, ısı yönetimi ve malzeme uygunluğu test edilmemiştir.",
      "Herhangi bir lamba donanımı veya üretim dosyası sunulmaz.",
      "Ticari kullanım ve satış izni kayıt üzerinde doğrulanmamıştır.",
    ],
    permissionStatus: "unverified",
  },
];

export function getOctoDemoModel(externalId: string) {
  return octoDemoModels.find((model) => model.externalId === externalId);
}

export type EditorialDraft = {
  slug: string;
  title: string;
  excerpt: string;
  readingLabel: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
    bullets?: string[];
  }>;
};

export const editorialDrafts: EditorialDraft[] = [
  {
    slug: "fdm-ve-sla-arasinda-secim",
    title: "FDM ve SLA arasında seçim yaparken",
    excerpt:
      "Yüzey, geometri, kullanım ortamı ve doğrulama ihtiyacını birlikte değerlendiren kısa bir karar çerçevesi.",
    readingLabel: "Demo editoryal taslak",
    sections: [
      {
        heading: "Önce parçanın görevini tanımlayın",
        paragraphs: [
          "Teknoloji seçimini yalnızca görünüşe göre yapmak yerine parçanın taşıyacağı yükü, temas edeceği ortamı ve beklenen ömrü yazılı hâle getirin. Bir sunum modeli ile tekrarlı yük gören işlevsel parça aynı doğrulama sürecine ihtiyaç duymaz.",
          "Ölçü toleransı, yüzey beklentisi ve üretim adedi net değilse teknoloji önerisi de kesin kabul edilmemelidir.",
        ],
      },
      {
        heading: "FDM ne zaman değerlendirilir?",
        paragraphs: [
          "FDM; hızlı iterasyon, geniş malzeme seçeneği ve daha büyük hacimler için değerlendirilebilir. Katman yönü mekanik davranışı etkileyebileceğinden, parçanın baskı yönü tasarım kararının parçasıdır.",
        ],
        bullets: [
          "Konsept ve form doğrulama",
          "Fonksiyonel aparatlar ve muhafazalar",
          "Katman izinin kabul edilebilir olduğu son kullanım senaryoları",
        ],
      },
      {
        heading: "SLA ne zaman değerlendirilir?",
        paragraphs: [
          "SLA; küçük detaylar ve daha pürüzsüz yüzey hedeflendiğinde gündeme gelebilir. Reçine türü, son kürleme ve kullanım ortamı sonuç üzerinde belirleyicidir; standart reçine tüm mekanik ihtiyaçlara uygun varsayılmamalıdır.",
        ],
      },
      {
        heading: "Kararı numune ile doğrulayın",
        paragraphs: [
          "Kritik ölçü veya kullanım riski bulunan işlerde küçük bir numune ya da ilk parça doğrulaması planlayın. Malzeme üreticisinin güncel teknik föyü ve gerçek kullanım testi, bu genel rehberden daha yüksek önceliğe sahiptir.",
        ],
      },
    ],
  },
  {
    slug: "3d-baski-dosyasi-hazirlama-kontrol-listesi",
    title: "3D baskı dosyası hazırlama kontrol listesi",
    excerpt:
      "Teklif öncesinde geometri, ölçü birimi ve kullanım bağlamını daha açık iletmek için pratik notlar.",
    readingLabel: "Demo editoryal taslak",
    sections: [
      {
        heading: "Geometriyi kontrol edin",
        paragraphs: [
          "Modelin kapalı bir hacim oluşturduğunu, istenmeyen kesişimler içermediğini ve çok ince bölgelerin farkında olduğunuzu kontrol edin. Otomatik onarım sonucu her zaman tasarım niyetini korumayabilir.",
        ],
        bullets: [
          "Doğru ölçü birimini dosya notunda belirtin.",
          "Kritik ölçüleri ayrı bir çizim veya açıklamayla işaretleyin.",
          "Birden fazla parçanın montaj ilişkisini tarif edin.",
        ],
      },
      {
        heading: "Kullanım bağlamını ekleyin",
        paragraphs: [
          "Parçanın dekoratif mi, prototip mi, yoksa işlevsel mi olduğunu belirtin. Sıcaklık, güneş, nem, kimyasal temas ve yük gibi koşullar malzeme değerlendirmesini değiştirebilir.",
        ],
      },
      {
        heading: "Hak sahipliğini doğrulayın",
        paragraphs: [
          "Yalnızca üretim izniniz bulunan dosyaları paylaşın. Açık bir lisans varsa sürümünü ve kaynak bağlantısını saklayın; lisansın ticari üretime izin verdiğini varsaymayın.",
        ],
      },
      {
        heading: "Aktivasyon notu",
        paragraphs: [
          "Model yükleme akışı henüz dosya kabulünü sunucuya yazmaz. Bu kontrol listesi yalnızca hazırlık içindir; yükleme veya otomatik fiyat sözü değildir.",
        ],
      },
    ],
  },
  {
    slug: "kucuk-seri-uretim-briefi",
    title: "Küçük seri üretim brief’i nasıl hazırlanır?",
    excerpt:
      "Adet, kalite eşiği ve revizyon sorumluluğunu erken netleştiren kurumsal brief yapısı.",
    readingLabel: "Demo editoryal taslak",
    sections: [
      {
        heading: "Tek bir hedef cümlesiyle başlayın",
        paragraphs: [
          "Ürünün kim tarafından, hangi ortamda ve ne amaçla kullanılacağını bir cümlede tanımlayın. Bu cümle; malzeme, dayanım ve yüzey kararlarının ortak referansı olur.",
        ],
      },
      {
        heading: "Değişkenleri tablo hâline getirin",
        paragraphs: [
          "Adet aralığı, hedef tarih, renk, kişiselleştirme alanı, paketleme ve kalite kabul kriterlerini ayrı başlıklarda toplayın. Kesin olmayan alanları tahmin gibi sunmak yerine açıkça “karar bekliyor” olarak işaretleyin.",
        ],
        bullets: [
          "Düşük, beklenen ve yüksek adet senaryosu",
          "Onay numunesi ve revizyon sayısı",
          "Kritik ölçüler ve kabul toleransları",
          "Teslimat noktaları ve paketleme beklentisi",
        ],
      },
      {
        heading: "Numune kapısını tanımlayın",
        paragraphs: [
          "Seri üretime geçişi yazılı numune onayına bağlayın. Ölçü, görünüş ve işlev kontrolünün kim tarafından yapılacağı ile değişikliklerin takvime etkisi teklif öncesinde belirlenmelidir.",
        ],
      },
      {
        heading: "Teklif durumunu doğru okuyun",
        paragraphs: [
          "Kurumsal talep formu ve otomatik teklif altyapısı şu anda aktif değildir. Hazırlanan brief, yalnızca yapılandırılmış bir görüşmeye temel oluşturur; bağlayıcı fiyat veya üretim kabulü değildir.",
        ],
      },
    ],
  },
];

export function getEditorialDraft(slug: string) {
  return editorialDrafts.find((draft) => draft.slug === slug);
}

export type LegalTemplate = {
  slug: "kvkk" | "gizlilik" | "mesafeli-satis" | "iade";
  title: string;
  summary: string;
  requiredInputs: string[];
  reviewTopics: string[];
};

export const legalTemplates: LegalTemplate[] = [
  {
    slug: "kvkk",
    title: "KVKK Aydınlatma Metni Taslağı",
    summary:
      "Veri sorumlusu, işleme amaçları, hukuki sebepler ve başvuru kanalının hukuk danışmanı tarafından tamamlanması için hazırlık iskeleti.",
    requiredInputs: [
      "Doğrulanmış veri sorumlusu unvanı, MERSİS/vergi bilgileri ve adresi",
      "İşlenen gerçek veri kategorileri ve her biri için hukuki sebep",
      "Aktarım yapılan gerçek alıcı grupları, altyapı sağlayıcıları ve ülkeler",
      "KVKK başvurularını kabul edecek doğrulanmış kanal",
      "Saklama ve imha politikasındaki onaylı süreler",
    ],
    reviewTopics: [
      "Aydınlatma ile açık rızanın birbirinden ayrılması",
      "Çerez, üyelik, sipariş ve iletişim süreçlerinin gerçek veri akışıyla eşleşmesi",
      "Yurt dışı aktarım mekanizmasının güncel mevzuata göre değerlendirilmesi",
      "İlgili kişi hakları ve başvuru usulünün eksiksiz olması",
    ],
  },
  {
    slug: "gizlilik",
    title: "Gizlilik Politikası Taslağı",
    summary:
      "Sitedeki gerçek veri akışı ve tedarikçiler doğrulanmadan yayımlanmaması gereken politika hazırlık sayfası.",
    requiredInputs: [
      "Canlı ortamda kullanılan analytics, hata izleme ve iletişim servisleri",
      "Supabase bölgesi, saklama tercihleri ve erişim rolleri",
      "Ödeme, kargo ve e-posta sağlayıcılarının onaylı listesi",
      "Hesap silme, veri düzeltme ve destek süreçleri",
      "Politika sahibi, sürüm tarihi ve değişiklik bildirim yöntemi",
    ],
    reviewTopics: [
      "Toplanan veri ile metinde beyan edilen verinin birebir eşleşmesi",
      "Güvenlik önlemlerinin abartılı veya garanti niteliğinde sunulmaması",
      "Üçüncü taraf bağlantıları ve çocuklara ilişkin yaklaşım",
      "KVKK metni ve çerez tercihlerine verilen bağlantıların tutarlılığı",
    ],
  },
  {
    slug: "mesafeli-satis",
    title: "Mesafeli Satış Sözleşmesi Taslağı",
    summary:
      "Satıcı bilgileri, ürün niteliği ve checkout kayıtları tamamlandıktan sonra siparişe özel üretilmesi gereken sözleşme iskeleti.",
    requiredInputs: [
      "Satıcının doğrulanmış ticari unvanı, açık adresi ve iletişim bilgileri",
      "Sipariş anındaki ürün/hizmet, vergi, kargo ve toplam bedel snapshot’ı",
      "Teslimat yöntemi, ifa süresi ve varsa kişiye özel üretim koşulları",
      "Cayma hakkı istisnalarının ürün bazında hukukçu tarafından değerlendirilmesi",
      "Tüketici uyuşmazlıklarında güncel başvuru bilgileri",
    ],
    reviewTopics: [
      "Ön bilgilendirme onayı ve sözleşme kurulum zamanının ispatı",
      "Dijital model dosyası ile fiziksel ürün sorumluluklarının ayrılması",
      "PayTR callback doğrulaması olmadan ödeme tamamlandı sayılmaması",
      "Siparişe özel içeriklerin otomatik ve değiştirilemez kayda alınması",
    ],
  },
  {
    slug: "iade",
    title: "İade ve Cayma Politikası Taslağı",
    summary:
      "Standart stok ürünü, kişiselleştirilmiş üretim ve ayıplı ürün senaryolarının ayrı incelenmesi gereken hazırlık sayfası.",
    requiredInputs: [
      "İade bildirim kanalı ve doğrulanmış gönderim adresi",
      "Ürün gruplarına göre cayma hakkı ve istisna değerlendirmesi",
      "İade kargo maliyeti ve taşıyıcı süreci",
      "İnceleme, geri ödeme ve değişim operasyon akışı",
      "Hasarlı teslimat ve ayıplı ürün için delil/iletişim prosedürü",
    ],
    reviewTopics: [
      "Kişiye özel üretim istisnasının otomatik olarak her ürüne uygulanmaması",
      "Yasal hakların politika metniyle daraltılmaması",
      "Geri ödeme zamanlamasının ödeme sağlayıcısı ve mevzuatla uyumu",
      "Müşteri iletişiminin erişilebilir, kayıtlı ve izlenebilir olması",
    ],
  },
];

export function getLegalTemplate(slug: string) {
  return legalTemplates.find((template) => template.slug === slug);
}
