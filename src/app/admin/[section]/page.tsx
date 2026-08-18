import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StagedAdminPage } from "@/components/admin/admin-page";

const stagedSections = {
  siparisler: {
    title: "Sipariş operasyonu",
    description:
      "Ödeme sonrası sipariş, sevkiyat ve iade akışlarının yönetim alanı.",
    phase: "Aşama 2",
    requirements: [
      "PayTR mağaza kimlik bilgileri ve imzalı webhook doğrulaması",
      "Sunucu tarafı sepet fiyatlandırması ve sipariş oluşturma işlemi",
      "Taşıyıcı, takip ve iade durum geçişleri",
    ],
    foundations: [
      "Sipariş ve kalem tabloları RLS yönetici politikalarıyla hazır",
      "Ticari anlık görüntüler için değişmezlik tetikleyicileri mevcut",
    ],
  },
  teklifler: {
    title: "Teklif operasyonu",
    description:
      "Özel üretim taleplerini analiz, fiyatlandırma ve onay aşamalarında yönetin.",
    phase: "Aşama 3",
    requirements: [
      "Model analiz işçisi ve doğrulanmış analiz çıktısı",
      "Malzeme, makine süresi ve son işlem fiyat kuralları",
      "Teklif PDF/e-posta teslimi ve süre sonu iş akışı",
    ],
    foundations: [
      "Teklif ve teklif kalemi tabloları kullanıcı sahipliğiyle hazır",
      "Kesinleşen teklif anlık görüntüleri veritabanında korunuyor",
    ],
  },
  yuklemeler: {
    title: "Model yükleme kuyruğu",
    description:
      "Müşteri 3D dosyalarının güvenli alım, tarama ve analiz operasyonu.",
    phase: "Aşama 3",
    requirements: [
      "Private model-uploads bucket ve üretim depolama kotaları",
      "Dosya türü, boyut, zararlı içerik ve mesh doğrulaması",
      "Slicer/analiz işçisi webhook kimlik bilgileri",
    ],
    foundations: [
      "Yükleme meta verisi kullanıcı yoluna bağlı RLS ile korunuyor",
      "Model analiz durumları ve hata alanları şemada hazır",
    ],
  },
  malzemeler: {
    title: "Malzeme yönetimi",
    description:
      "Filament, reçine, renk ve üretim özelliklerinin operasyon kaynağı.",
    phase: "Aşama 2",
    requirements: [
      "Tedarikçi kodları ve güncel gram maliyetleri",
      "Malzeme–renk uygunluk matrisi",
      "Aktivasyon ve stokta bulunurluk iş kuralları",
    ],
    foundations: [
      "Malzeme, renk ve ilişki tabloları katalog şemasında mevcut",
      "Fiyatlar tam sayı kuruş olarak modellenmiş durumda",
    ],
  },
  fiyatlandirma: {
    title: "Fiyatlandırma kuralları",
    description:
      "Ürün, varyant, malzeme ve üretim parametrelerine göre fiyat politikaları.",
    phase: "Aşama 3",
    requirements: [
      "Tek yetkili sunucu tarafı fiyat hesaplama motoru",
      "Çakışan kural önceliği ve geçerlilik penceresi testleri",
      "Teklif/sipariş anlık görüntüsü ve sürümleme stratejisi",
    ],
    foundations: [
      "Sabit, yüzdesel ve birim başına kural şeması hazır",
      "Kural önceliği ve tarih aralığı alanları mevcut",
    ],
  },
  indirimler: {
    title: "İndirim ve kampanyalar",
    description:
      "Kupon, kategori kampanyası ve hacim indirimi operasyon alanı.",
    phase: "Aşama 2",
    requirements: [
      "Kupon uygunluk ve tek kullanımlık kod politikaları",
      "Sunucu tarafı indirim hesaplama sırası",
      "Kampanya zaman dilimi ve kullanım limiti testleri",
    ],
    foundations: [
      "Kupon ve kullanım tabloları veritabanında mevcut",
      "Hacim indirimi aralıkları katalog şemasında hazır",
    ],
  },
  musteriler: {
    title: "Müşteri yönetimi",
    description:
      "Hesap, erişim durumu ve müşteri iletişim geçmişi çalışma alanı.",
    phase: "Aşama 2",
    requirements: [
      "Kişisel veri görüntüleme ve dışa aktarma yetki matrisi",
      "Destek/iletişim kayıtlarının sahiplik ve saklama politikası",
      "Hesap pasifleştirme ve veri talebi operasyonu",
    ],
    foundations: [
      "Profil rolleri kullanıcı meta verisinden değil veritabanından okunuyor",
      "Müşteri kendi profilini yalnızca RLS sınırları içinde görebiliyor",
    ],
  },
  yorumlar: {
    title: "Yorum moderasyonu",
    description:
      "Müşteri yorumlarını doğrulama, moderasyon ve yayınlama alanı.",
    phase: "Aşama 2",
    requirements: [
      "Moderasyon yönergesi ve reddetme nedenleri",
      "Doğrulanmış satın alma eşleştirmesi",
      "Yorum medyası tarama ve yayın politikası",
    ],
    foundations: [
      "Bekleyen/onaylı/reddedilen yorum durumları şemada hazır",
      "Kamu yalnızca onaylı ve yayınlanmış yorumları okuyabiliyor",
    ],
  },
  entegrasyonlar: {
    title: "Entegrasyonlar",
    description:
      "Ödeme, e-posta, model kaynağı ve üretim işçisi bağlantı durumu.",
    phase: "Aşama 2–3",
    requirements: [
      "PayTR, Resend ve model sağlayıcı kimlik bilgilerinin sunucu kasasında tutulması",
      "Webhook imzası, tekrar oynatma koruması ve gözlemlenebilirlik",
      "Sağlık kontrolü, hata bütçesi ve devre kesici politikaları",
    ],
    foundations: [
      "İstemciye servis rolü veya sağlayıcı sırrı aktarılmıyor",
      "Harici model kaynakları için ayrı izin şeması mevcut",
    ],
  },
  ayarlar: {
    title: "Mağaza ayarları",
    description:
      "Operasyonel mağaza tercihleri, iletişim ve yayın ayarları.",
    phase: "Aşama 2",
    requirements: [
      "Ayar anahtarları için tipli şema ve değişiklik doğrulaması",
      "Hassas ve kamuya açık değerlerin kesin ayrımı",
      "Değişiklik günlüğü ve geri alma prosedürü",
    ],
    foundations: [
      "Kamu ayarları için RLS okuma politikası mevcut",
      "Yönetici yazmaları veritabanı RLS yetkisine bağlı",
    ],
  },
} as const;

type StagedSection = keyof typeof stagedSections;

function isStagedSection(value: string): value is StagedSection {
  return value in stagedSections;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section } = await params;
  return {
    title: isStagedSection(section)
      ? stagedSections[section].title
      : "Yönetim",
  };
}

export default async function AdminStagedSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (!isStagedSection(section)) {
    notFound();
  }

  return <StagedAdminPage {...stagedSections[section]} />;
}
