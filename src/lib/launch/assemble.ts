import { PRODUCTION_SITE_URL } from "@/config/site";
import { item, type LaunchReadinessSnapshot } from "@/lib/launch/types";
import type { FlagEnablement } from "@/lib/launch/production-flags";
import { productionFixtureWarning } from "@/lib/launch/production-flags";
import { statusFromConfiguredVerified, type LaunchStatus } from "@/lib/launch/status";

export interface LaunchProbes {
  generatedAt: string;
  siteUrl: string | undefined;
  deploymentId: string | null;
  vercelEnvironment: string;
  nodeEnv: string;
  buildVersion: string;
  healthOk: boolean | null;
  supabaseUrl: boolean;
  supabaseAnon: boolean;
  serviceRole: boolean;
  databaseReachable: boolean | null;
  migrationsPresent: boolean | null;
  missingMigrationCount: number | null;
  productTablesReachable: boolean | null;
  storageBucketReachable: boolean | null;
  ownerProfileExists: boolean | null;
  productCount: number | null;
  publishedCount: number | null;
  categoryCount: number | null;
  imageCount: number | null;
  developmentExportAvailable: boolean;
  importHasRun: boolean | null;
  thingiverseToken: boolean;
  thingiverseFixtureEnabled: FlagEnablement;
  thingiverseReachable: boolean | null;
  thingiverseLastSuccess: string | null;
  thingiverseLastError: string | null;
  quoteHmac: boolean;
  workerSecret: boolean;
  workerUrl: boolean;
  workerReachable: boolean | null;
  manufacturingStorage: boolean;
  activePrinter: boolean | null;
  activeMaterial: boolean | null;
  activePricing: boolean | null;
  pricingActivated: boolean | null;
  lastSuccessfulSlice: string | null;
  paytrConfigured: boolean;
  paytrCallbackUrl: string;
  emailProvider: boolean;
  emailFrom: boolean;
  contactEmail: boolean;
  safety: {
    thingiverseFixtureMode: FlagEnablement;
    allowProductionDemoImport: FlagEnablement;
    allowDemoAdminMutations: FlagEnablement;
  };
  lastSmokeAt: string | null;
  lastSmokeOk: boolean | null;
}

function configuredStatus(
  configured: boolean,
  verified: boolean | null,
  optional = true,
): LaunchStatus {
  return statusFromConfiguredVerified({ configured, verified, optional });
}

export function assembleLaunchReadiness(
  probes: LaunchProbes,
): LaunchReadinessSnapshot {
  const canonicalOk = probes.siteUrl === PRODUCTION_SITE_URL;
  const warning = productionFixtureWarning(probes.safety, probes.nodeEnv);
  const importAvailable = probes.supabaseUrl && probes.supabaseAnon && probes.serviceRole;
  const autoQuote =
    probes.quoteHmac &&
    probes.workerSecret &&
    probes.workerUrl &&
    probes.workerReachable === true &&
    probes.manufacturingStorage &&
    probes.pricingActivated === true &&
    Boolean(probes.lastSuccessfulSlice);

  return {
    generatedAt: probes.generatedAt,
    domain: {
      canonical: item(
        "canonical",
        "Canonical alan adı",
        canonicalOk ? "Hazır" : "İşlem gerekiyor",
        canonicalOk
          ? PRODUCTION_SITE_URL
          : "Beklenen adres https://baskiciftligi.com",
      ),
      deploymentId: item(
        "deploymentId",
        "Dağıtım kimliği",
        probes.deploymentId ? "Hazır" : "Doğrulanmadı",
        probes.deploymentId ? "Dağıtım kimliği mevcut" : "Yerel veya kimlik yok",
      ),
      vercelEnvironment: item(
        "vercelEnvironment",
        "Vercel ortamı",
        probes.vercelEnvironment ? "Hazır" : "Doğrulanmadı",
        probes.vercelEnvironment,
      ),
      siteUrl: item(
        "siteUrl",
        "Site URL",
        probes.siteUrl ? "Hazır" : "Eksik",
        probes.siteUrl ? "Yapılandırıldı" : "NEXT_PUBLIC_SITE_URL yok",
      ),
      httpsExpected: item(
        "https",
        "HTTPS beklentisi",
        probes.siteUrl?.startsWith("https://") ? "Hazır" : "İşlem gerekiyor",
        "Üretim trafiği HTTPS üzerinden beklenir.",
      ),
      healthEndpoint: item(
        "health",
        "Sağlık uç noktası",
        probes.healthOk === true
          ? "Hazır"
          : probes.healthOk === false
            ? "Bağlantı kurulamadı"
            : "Doğrulanmadı",
        "/api/health",
      ),
      buildVersion: item(
        "version",
        "Sürüm",
        probes.buildVersion ? "Hazır" : "Doğrulanmadı",
        probes.buildVersion,
      ),
    },
    catalog: {
      supabaseUrlConfigured: item(
        "supabaseUrl",
        "Supabase URL",
        probes.supabaseUrl ? "Hazır" : "Yapılandırılmadı",
        probes.supabaseUrl ? "Yapılandırıldı" : "NEXT_PUBLIC_SUPABASE_URL yok",
      ),
      publicKeyConfigured: item(
        "anonKey",
        "Genel anahtar",
        probes.supabaseAnon ? "Hazır" : "Yapılandırılmadı",
        probes.supabaseAnon ? "Yapılandırıldı" : "NEXT_PUBLIC_SUPABASE_ANON_KEY yok",
      ),
      serviceRoleConfigured: item(
        "serviceRole",
        "Servis rolü",
        probes.serviceRole ? "Hazır" : "Yapılandırılmadı",
        probes.serviceRole ? "Yapılandırıldı" : "SUPABASE_SERVICE_ROLE_KEY yok",
      ),
      databaseReachable: item(
        "db",
        "Veritabanı",
        configuredStatus(probes.supabaseUrl && probes.supabaseAnon, probes.databaseReachable),
        probes.databaseReachable === true
          ? "Bağlantı doğrulandı"
          : probes.databaseReachable === false
            ? "Bağlantı kurulamadı"
            : "Kimlik bilgisi olmadan doğrulanmaz",
      ),
      migrationsPresent: item(
        "migrations",
        "Göçler",
        probes.migrationsPresent === true
          ? "Hazır"
          : probes.migrationsPresent === false
            ? "Eksik"
            : "Doğrulanmadı",
        probes.missingMigrationCount
          ? `${probes.missingMigrationCount} göç eksik`
          : probes.migrationsPresent === true
            ? "Beklenen göçler mevcut"
            : "Göç tablosuna erişilemedi",
      ),
      productTablesReachable: item(
        "productTables",
        "Ürün tabloları",
        configuredStatus(Boolean(probes.supabaseUrl), probes.productTablesReachable),
        probes.productTablesReachable === true
          ? "Okuma başarılı"
          : "Ürün tabloları doğrulanmadı",
      ),
      storageBucketReachable: item(
        "storage",
        "Depolama kovası",
        configuredStatus(Boolean(probes.supabaseUrl), probes.storageBucketReachable),
        probes.storageBucketReachable === true
          ? "catalog-media erişilebilir"
          : "catalog-media doğrulanmadı",
      ),
      ownerProfileExists: item(
        "owner",
        "Sahip profili",
        probes.ownerProfileExists === true
          ? "Hazır"
          : probes.ownerProfileExists === false
            ? "Eksik"
            : "Doğrulanmadı",
        probes.ownerProfileExists === true
          ? "Sahip veya yönetici profili var"
          : "Sahip hesabı doğrulanmadı",
      ),
      developmentExportAvailable: item(
        "export",
        "Geliştirme dışa aktarımı",
        probes.developmentExportAvailable ? "Hazır" : "Yapılandırılmadı",
        probes.developmentExportAvailable
          ? "Yerel katalog paketi üretilebilir"
          : "Yalnızca geliştirme makinesinde çalışır",
      ),
      productionImportAvailable: item(
        "import",
        "Üretim içe aktarımı",
        importAvailable ? "Hazır" : "Yapılandırılmadı",
        importAvailable
          ? "Dry-run ve commit için kimlik bilgisi var"
          : "Supabase servis rolü olmadan commit yapılamaz",
      ),
      importHasRun: item(
        "importRun",
        "İçe aktarma geçmişi",
        probes.importHasRun === true
          ? "Hazır"
          : probes.importHasRun === false
            ? "İşlem gerekiyor"
            : "Doğrulanmadı",
        probes.importHasRun === true
          ? "Daha önce commit kaydı var"
          : "Commit kaydı yok",
      ),
      counts: {
        products: probes.productCount,
        publishedProducts: probes.publishedCount,
        categories: probes.categoryCount,
        productImages: probes.imageCount,
      },
    },
    thingiverse: {
      tokenConfigured: item(
        "tvToken",
        "Jeton",
        probes.thingiverseToken ? "Hazır" : "Yapılandırılmadı",
        probes.thingiverseToken ? "Yapılandırıldı" : "THINGIVERSE_ACCESS_TOKEN yok",
      ),
      fixtureModeDisabled: item(
        "tvFixture",
        "Fixture kapatıldı",
        probes.thingiverseFixtureEnabled === "disabled"
          ? "Üretimde kapalı"
          : "İşlem gerekiyor",
        probes.thingiverseFixtureEnabled === "disabled"
          ? "Fixture üretimde kapalı"
          : "THINGIVERSE_FIXTURE_MODE açık",
      ),
      apiReachable: item(
        "tvApi",
        "API",
        probes.thingiverseReachable === true
          ? "Hazır"
          : probes.thingiverseReachable === false
            ? "Bağlantı kurulamadı"
            : probes.thingiverseToken
              ? "Doğrulanmadı"
              : "Yapılandırılmadı",
        "Canlı istek yalnızca jeton varken ve fixture kapalıyken denenir",
      ),
      lastSuccessfulRequest: item(
        "tvSuccess",
        "Son başarılı istek",
        probes.thingiverseLastSuccess ? "Hazır" : "Doğrulanmadı",
        probes.thingiverseLastSuccess ?? "Kayıt yok",
      ),
      lastErrorCategory: item(
        "tvError",
        "Son hata kategorisi",
        probes.thingiverseLastError ? "Bağlantı kurulamadı" : "Hazır",
        probes.thingiverseLastError ?? "Hata kaydı yok",
      ),
      productionStatus: item(
        "tvProd",
        "Üretim durumu",
        probes.thingiverseToken && probes.thingiverseFixtureEnabled === "disabled"
          ? probes.thingiverseReachable === true
            ? "Hazır"
            : "Doğrulanmadı"
          : "Yapılandırılmadı",
        "Jeton + kapalı fixture olmadan üretim keşfi açılmaz",
      ),
      commercialLicenseGate: item(
        "tvLicense",
        "Ticari lisans kapısı",
        "Hazır",
        "Ticari lisans doğrulanmadan otomatik satış kapalıdır",
      ),
    },
    quotation: {
      quoteHmacConfigured: item(
        "hmac",
        "Teklif HMAC",
        probes.quoteHmac ? "Hazır" : "Yapılandırılmadı",
        probes.quoteHmac ? "Yapılandırıldı" : "MANUFACTURING_QUOTE_HMAC_SECRET yok",
      ),
      workerSecretConfigured: item(
        "workerSecret",
        "İşçi sırrı",
        probes.workerSecret ? "Hazır" : "Yapılandırılmadı",
        probes.workerSecret ? "Yapılandırıldı" : "SLICER_WORKER_SECRET yok",
      ),
      workerUrlConfigured: item(
        "workerUrl",
        "İşçi URL",
        probes.workerUrl ? "Hazır" : "Yapılandırılmadı",
        probes.workerUrl ? "Yapılandırıldı" : "SLICER_WORKER_URL yok",
      ),
      workerReachable: item(
        "workerHealth",
        "İşçi erişimi",
        probes.workerReachable === true
          ? "Hazır"
          : probes.workerReachable === false
            ? "Bağlantı kurulamadı"
            : "Yapılandırılmadı",
        "GET /health; dilimleme işi başlatılmaz",
      ),
      storageConfigured: item(
        "mfgStorage",
        "Üretim depolama",
        probes.manufacturingStorage ? "Hazır" : "Yapılandırılmadı",
        probes.manufacturingStorage ? "Yapılandırıldı" : "Kalıcı depolama yok",
      ),
      activePrinterProfile: item(
        "printer",
        "Yazıcı profili",
        probes.activePrinter === true ? "Hazır" : "Doğrulanmadı",
        probes.activePrinter === true ? "Aktif profil var" : "Doğrulanmadı",
      ),
      activeMaterialProfile: item(
        "material",
        "Malzeme profili",
        probes.activeMaterial === true ? "Hazır" : "Doğrulanmadı",
        probes.activeMaterial === true ? "Aktif profil var" : "Doğrulanmadı",
      ),
      activePricingProfile: item(
        "pricingProfile",
        "Fiyat profili",
        probes.activePricing === true ? "Hazır" : "Doğrulanmadı",
        probes.activePricing === true ? "Profil var" : "Doğrulanmadı",
      ),
      productionPricingActivated: item(
        "pricingOn",
        "Üretim fiyatı",
        probes.pricingActivated === true ? "Hazır" : "Üretimde kapalı",
        probes.pricingActivated === true
          ? "Aktivasyon kaydı var"
          : "Tohum fiyatı üretim teklifi vermez",
      ),
      lastSuccessfulSlice: item(
        "lastSlice",
        "Son gerçek dilimleme",
        probes.lastSuccessfulSlice ? "Hazır" : "Doğrulanmadı",
        probes.lastSuccessfulSlice ?? "Gerçek dilimleme kaydı yok",
      ),
      automaticQuoteAvailable: item(
        "autoQuote",
        "Otomatik teklif",
        autoQuote ? "Hazır" : "Yapılandırılmadı",
        autoQuote
          ? "İşçi, depolama ve üretim fiyatı doğrulandı"
          : "Env varlığı tek başına yeterli değil",
      ),
    },
    payment: {
      variablesConfigured: item(
        "paytrVars",
        "PayTR değişkenleri",
        probes.paytrConfigured ? "Hazır" : "Yapılandırılmadı",
        probes.paytrConfigured ? "Üç merchant değeri var" : "PayTR kapalı",
      ),
      callbackUrl: item(
        "paytrCallback",
        "Callback URL",
        "Hazır",
        probes.paytrCallbackUrl,
      ),
      enabled: item(
        "paytrEnabled",
        "Ödeme",
        "Üretimde kapalı",
        "Bu fazda PayTR tahsilatı açılmaz",
      ),
      lastVerifiedCallback: item(
        "paytrLast",
        "Son doğrulanmış callback",
        "Doğrulanmadı",
        "Kayıtlı doğrulanmış callback yok",
      ),
    },
    communications: {
      emailProviderConfigured: item(
        "emailProvider",
        "E-posta sağlayıcı",
        probes.emailProvider ? "Hazır" : "Yapılandırılmadı",
        probes.emailProvider ? "Yapılandırıldı" : "RESEND_API_KEY yok",
      ),
      senderConfigured: item(
        "sender",
        "Gönderen",
        probes.emailFrom ? "Hazır" : "Yapılandırılmadı",
        probes.emailFrom ? "Yapılandırıldı" : "EMAIL_FROM yok",
      ),
      newsletter: item(
        "newsletter",
        "Bülten",
        "Yapılandırılmadı",
        "Bülten kalıcı kayıt iddiasında bulunmaz",
      ),
      contactDestination: item(
        "contact",
        "İletişim hedefi",
        probes.contactEmail ? "Hazır" : "Yapılandırılmadı",
        probes.contactEmail ? "Yapılandırıldı" : "NEXT_PUBLIC_CONTACT_EMAIL yok",
      ),
    },
    safety: {
      ...probes.safety,
      warning: warning?.body ?? null,
    },
    smoke: {
      lastRun: item(
        "smoke",
        "Son duman testi",
        probes.lastSmokeOk === true
          ? "Hazır"
          : probes.lastSmokeOk === false
            ? "İşlem gerekiyor"
            : "Doğrulanmadı",
        probes.lastSmokeAt ?? "Henüz çalıştırılmadı",
      ),
    },
  };
}
