import { existsSync } from "node:fs";
import path from "node:path";

import { siteConfig } from "@/config/site";
import { isTransactionalEmailConfigured } from "@/lib/wholesale/email";
import { WHOLESALE_AGREEMENT_VERSIONS } from "@/lib/wholesale/agreements";
import type { WholesaleSettings } from "@/lib/wholesale/types";

export interface WholesaleChecklistItem {
  id: string;
  label: string;
  ready: boolean;
  detail: string;
}

export interface WholesaleReadiness {
  shippingConfigured: boolean;
  checkoutOpen: boolean;
  paytrMode: "test" | "live";
  paytrCredentials: boolean;
  emailConfigured: boolean;
  companyComplete: boolean;
  migrationPresent: boolean;
  legalVersionsPresent: boolean;
  testCallbackRecorded: boolean;
  customerCheckoutReady: boolean;
  liveChecklistComplete: boolean;
  liveReady: boolean;
  items: WholesaleChecklistItem[];
}

export function sellerInformationComplete() {
  return Boolean(
    siteConfig.legalName.trim() &&
      siteConfig.city.trim() &&
      siteConfig.contact.email.trim() &&
      siteConfig.contact.phone.trim() &&
      process.env.WHOLESALE_SELLER_TAX_ID?.trim() &&
      process.env.WHOLESALE_SELLER_ADDRESS?.trim(),
  );
}

export function wholesaleMigrationFilesExist() {
  const dir = path.join(process.cwd(), "supabase", "migrations");
  return (
    existsSync(path.join(dir, "20261007120000_wholesale_lighters.sql")) ||
    existsSync(path.join(dir, "20261007184500_wholesale_settings_activation.sql"))
  );
}

export function buildWholesaleReadiness(input: {
  settings: WholesaleSettings;
  paytrCredentials: boolean;
  paytrTestMode: boolean;
  schemaAvailable: boolean;
}): WholesaleReadiness {
  const shippingConfigured = input.settings.shippingGrossMinor != null;
  const companyComplete = sellerInformationComplete();
  const legalVersionsPresent = Boolean(
    WHOLESALE_AGREEMENT_VERSIONS.preliminary.id &&
      WHOLESALE_AGREEMENT_VERSIONS.distance.id &&
      WHOLESALE_AGREEMENT_VERSIONS.privacy.id,
  );
  const testCallbackRecorded = Boolean(input.settings.paytrTestCallbackAt);
  const migrationPresent = input.schemaAvailable || wholesaleMigrationFilesExist();

  const items: WholesaleChecklistItem[] = [
    {
      id: "shipping",
      label: "Kargo ücreti kaydedildi",
      ready: shippingConfigured,
      detail: shippingConfigured
        ? "Müşteri toplamına kargo ekleniyor."
        : "Türk lirası olarak kargo ücretini kaydedin.",
    },
    {
      id: "company",
      label: "Satıcı bilgileri tamam",
      ready: companyComplete,
      detail: companyComplete
        ? "Unvan, adres, vergi ve iletişim bilgileri dolu."
        : "Vergi numarası, açık adres, e-posta ve telefon henüz doğrulanmadı.",
    },
    {
      id: "paytr",
      label: "PayTR mağaza bilgileri",
      ready: input.paytrCredentials,
      detail: input.paytrCredentials
        ? "Kimlik bilgileri sunucuda tanımlı."
        : "Ödeme bilgileri henüz tanımlanmadı.",
    },
    {
      id: "schema",
      label: "Sipariş kaydı hazır",
      ready: migrationPresent,
      detail: input.schemaAvailable
        ? "Toptan sipariş kaydı kullanılabilir."
        : "Önizleme veritabanı henüz hazır değil.",
    },
    {
      id: "legal",
      label: "Sözleşme metinleri",
      ready: legalVersionsPresent,
      detail: "Ön bilgilendirme, mesafeli satış ve gizlilik sürümleri mevcut. Hukuk incelemesi ayrıca gerekir.",
    },
    {
      id: "test-callback",
      label: "Başarılı test ödemesi",
      ready: testCallbackRecorded,
      detail: testCallbackRecorded
        ? "En az bir test ödemesi onaylandı."
        : "Canlıya geçmeden önce bir test ödemesinin onaylanması gerekir.",
    },
    {
      id: "test-mode",
      label: "Ödeme ortamı anlaşıldı",
      ready: true,
      detail: input.paytrTestMode
        ? "Şu anda Test ödemesi açık. Test siparişleri gerçek kargoya çıkmaz."
        : "Canlı ödeme seçili. Yalnız kontrol listesi tamamsa kullanılabilir.",
    },
  ];

  const customerCheckoutReady =
    shippingConfigured &&
    companyComplete &&
    input.paytrCredentials &&
    legalVersionsPresent;

  const liveChecklistComplete =
    customerCheckoutReady &&
    migrationPresent &&
    testCallbackRecorded;

  const liveReady = liveChecklistComplete && !input.paytrTestMode;

  return {
    shippingConfigured,
    checkoutOpen:
      input.settings.checkoutOpen && customerCheckoutReady,
    paytrMode: input.paytrTestMode ? "test" : "live",
    paytrCredentials: input.paytrCredentials,
    emailConfigured: isTransactionalEmailConfigured(),
    companyComplete,
    migrationPresent,
    legalVersionsPresent,
    testCallbackRecorded,
    customerCheckoutReady,
    liveChecklistComplete,
    liveReady,
    items,
  };
}
