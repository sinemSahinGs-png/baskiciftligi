import type { LaunchChecklistStep, LaunchStatus } from "@/lib/launch/status";
import type { LaunchReadinessSnapshot } from "@/lib/launch/types";

function step(
  partial: Omit<LaunchChecklistStep, "status"> & { status: LaunchStatus },
): LaunchChecklistStep {
  return partial;
}

export function buildLaunchChecklist(
  snapshot: LaunchReadinessSnapshot,
): LaunchChecklistStep[] {
  return [
    step({
      id: "domain",
      title: "1. Alan adı",
      status: snapshot.domain.canonical.status,
      missing:
        snapshot.domain.canonical.status === "Hazır"
          ? "Eksik yok."
          : "Canonical üretim adresi henüz doğrulanmadı.",
      why: "Müşteriler ve arama motorları tek bir HTTPS kök adres kullanır.",
      where: "Vercel proje domain ayarı ve Cloudflare DNS.",
      howVerified: "NEXT_PUBLIC_SITE_URL ve /api/health üzerinden host kontrolü.",
      customerImpact: "Yanlış adres sepet, giriş ve ödeme dönüşlerini böler.",
    }),
    step({
      id: "supabase",
      title: "2. Supabase",
      status: snapshot.catalog.databaseReachable.status,
      missing: snapshot.catalog.databaseReachable.detail,
      why: "Kimlik, katalog ve depolama üretimde Supabase olmadan kalıcı olmaz.",
      where: "Vercel Production ortam değişkenleri ve Supabase proje ayarları.",
      howVerified: "URL, anon anahtar ve servis rolü varlık kontrolü; tablolar sayılır, değerler gösterilmez.",
      customerImpact: "Hesap, sipariş ve katalog kaydı tutulamaz.",
    }),
    step({
      id: "migrations",
      title: "3. Göçler",
      status: snapshot.catalog.migrationsPresent.status,
      missing: snapshot.catalog.migrationsPresent.detail,
      why: "Ürün, RLS ve üretim teklif tabloları göçler uygulanmadan oluşmaz.",
      where: "Supabase SQL veya `npx supabase db push` — bilinmeyen projeye otomatik uygulanmaz.",
      howVerified: "Beklenen göç sürümleri listelenir; eksik sürüm sayısı raporlanır.",
      customerImpact: "Mağaza ve hesap sayfaları şema hatası verebilir.",
    }),
    step({
      id: "owner",
      title: "4. Sahip hesabı",
      status: snapshot.catalog.ownerProfileExists.status,
      missing: snapshot.catalog.ownerProfileExists.detail,
      why: "Yönetim paneli ve RLS sahip/yönetici rolüne bağlıdır.",
      where: "Supabase Auth + SQL bootstrap. Rastgele kullanıcıya rol verilmez.",
      howVerified: "profiles tablosunda owner/admin varlığı; kimlikler gösterilmez.",
      customerImpact: "Yönetici yoksa katalog ve sipariş operasyonu yapılamaz.",
    }),
    step({
      id: "catalog-import",
      title: "5. Katalog içe aktarma",
      status: snapshot.catalog.productionImportAvailable.status,
      missing: snapshot.catalog.productionImportAvailable.detail,
      why: "Geliştirme kataloğu üretimde otomatik açılmaz; kontrollü paket gerekir.",
      where: "`npm run catalog:export` ardından dry-run ve `--commit`.",
      howVerified: "Paket şeması, SKU/slug ve dry-run planı. Commit yazmadan önce zorunludur.",
      customerImpact: "İçe aktarma yapılmazsa vitrin boş kalır.",
    }),
    step({
      id: "product-images",
      title: "6. Ürün görselleri",
      status: snapshot.catalog.storageBucketReachable.status,
      missing: snapshot.catalog.storageBucketReachable.detail,
      why: "Görseller veritabanında base64 tutulmaz; catalog-media kovası gerekir.",
      where: "Supabase Storage `catalog-media` ve `npm run catalog:import:media`.",
      howVerified: "Kova erişimi, imza doğrulama, eksik medya raporu.",
      customerImpact: "Görselsiz ürünler vitrinde eksik görünür.",
    }),
    step({
      id: "thingiverse",
      title: "7. Thingiverse",
      status: snapshot.thingiverse.productionStatus.status,
      missing: snapshot.thingiverse.tokenConfigured.detail,
      why: "Hazır modeller resmi API olmadan taranmaz ve sahte liste üretilmez.",
      where: "Vercel `THINGIVERSE_*` değişkenleri. Jeton ekranda gösterilmez.",
      howVerified: "Yapılandırma varlığı, fixture kapalı, isteğe bağlı ulaşılabilirlik.",
      customerImpact: "Thingiverse sekmesi yapılandırılmamış dürüst durumda kalır.",
    }),
    step({
      id: "worker",
      title: "8. Dilimleme işçisi",
      status: snapshot.quotation.automaticQuoteAvailable.status,
      missing: snapshot.quotation.workerReachable.detail,
      why: "Otomatik teklif native işçisiz ve depolamasız çalışmaz.",
      where: "Ayrı konteyner barındırma (Railway/Render/Fly/Cloud Run) — Vercel Function değil.",
      howVerified: "Worker URL, sır, HMAC ve canlı /health. Yalnızca env varlığı yeşil değildir.",
      customerImpact: "Model yükleme fiyat üretmez; dürüst 'hizmet yok' gösterilir.",
    }),
    step({
      id: "pricing",
      title: "9. Fiyatlandırma",
      status: snapshot.quotation.productionPricingActivated.status,
      missing: snapshot.quotation.productionPricingActivated.detail,
      why: "Geliştirme tohum fiyatları üretimde otomatik teklif vermez.",
      where: "Yönetim → Fiyatlandırma. Üretim aktivasyonu ayrıca onaylanır.",
      howVerified: "Aktif yazıcı/malzeme/fiyat profili ve activatedAt.",
      customerImpact: "Otomatik fiyat oluşmaz; inceleme kuyruğu gerekir.",
    }),
    step({
      id: "paytr",
      title: "10. PayTR",
      status: snapshot.payment.enabled.status,
      missing: snapshot.payment.variablesConfigured.detail,
      why: "Ödeme bu fazda etkinleştirilmez; eksik kimlik bilgisi sahte ödeme açmaz.",
      where: "Vercel `PAYTR_*` ve ileride PayTR paneli. Bu görevde entegrasyon yazılmaz.",
      howVerified: "Değişken varlığı ve planlanan callback URL. Canlı tahsilat yok.",
      customerImpact: "Ödeme sayfası dürüst biçimde kapalı kalır.",
    }),
    step({
      id: "email",
      title: "11. E-posta / iletişim",
      status: snapshot.communications.emailProviderConfigured.status,
      missing: snapshot.communications.emailProviderConfigured.detail,
      why: "Bülten ve formlar sağlayıcı yokken kalıcı kayıt iddiasında bulunmaz.",
      where: "Vercel `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_CONTACT_EMAIL`.",
      howVerified: "Yalnızca yapılandırma varlığı. Test e-postası gönderilmez.",
      customerImpact: "İletişim formu gönderildi görünümü vermez.",
    }),
    step({
      id: "smoke",
      title: "12. Son üretim duman testi",
      status: snapshot.smoke.lastRun.status,
      missing: snapshot.smoke.lastRun.detail,
      why: "Yayına almadan önce vitrin, sağlık ve yetki sınırları doğrulanır.",
      where: "`/admin/yayina-alma` → Canlı sistemi kontrol et.",
      howVerified: "Sınırlı GET kontrolleri. Sipariş, ödeme, dilimleme ve e-posta yok.",
      customerImpact: "Yok; salt okunur kontroldür.",
    }),
  ];
}
