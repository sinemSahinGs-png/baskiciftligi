import { normalizeLicense } from "@/domain/manufacturing/licenses";
import type { LicenseVerdict, LicenseVerdictCode } from "@/domain/manufacturing/types";

export type LicenseCommerceTier =
  | "auto_checkout"
  | "estimate_consult"
  | "consult_only";

export interface LicenseCommercePolicy {
  tier: LicenseCommerceTier;
  showEstimate: boolean;
  allowPayment: boolean;
  allowConsultation: boolean;
  statusLineTr: string;
  primaryCtaTr: string;
}

const statusLines: Record<LicenseVerdictCode, string> = {
  cc0: "Kamu malı — otomatik üretim ve sipariş açık",
  public_domain: "Kamu malı — otomatik üretim ve sipariş açık",
  cc_by: "Atıf korunarak otomatik üretim ve sipariş açık",
  cc_by_sa: "Paylaşım koşulları nedeniyle lisans incelemesi gerekir",
  cc_by_nc: "Ticari üretim yasak — yalnız danışma talebi",
  cc_by_nd: "Türetme kısıtı — üretim uygunluğu ayrı değerlendirilir",
  unknown: "Lisans belirsiz — yalnız danışma talebi",
  missing: "Lisans bilgisi yok — yalnız danışma talebi",
  requires_review: "Özel lisans — yalnız danışma talebi",
};

export function resolveLicenseCommercePolicy(
  verdict: LicenseVerdict,
): LicenseCommercePolicy {
  const code = verdict.code;

  if (
    code === "cc0" ||
    code === "public_domain" ||
    code === "cc_by"
  ) {
    return {
      tier: "auto_checkout",
      showEstimate: true,
      allowPayment: true,
      allowConsultation: false,
      statusLineTr: statusLines[code],
      primaryCtaTr: "Dosyayı yükle ve fiyatlandır",
    };
  }

  if (code === "cc_by_nc" || code === "cc_by_sa" || code === "cc_by_nd") {
    return {
      tier: "estimate_consult",
      showEstimate: true,
      allowPayment: false,
      allowConsultation: true,
      statusLineTr: statusLines[code],
      primaryCtaTr: "Üretim uygunluğunu danış",
    };
  }

  return {
    tier: "consult_only",
    showEstimate: false,
    allowPayment: false,
    allowConsultation: true,
    statusLineTr: statusLines[code],
    primaryCtaTr: "Üretim uygunluğunu danış",
  };
}

export function resolveLicenseCommercePolicyFromLabel(
  licenseLabel: string | null | undefined,
) {
  return resolveLicenseCommercePolicy(normalizeLicense(licenseLabel));
}
