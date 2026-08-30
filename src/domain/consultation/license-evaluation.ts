import { normalizeLicense } from "@/domain/manufacturing/licenses";
import type { LicenseVerdict, LicenseVerdictCode } from "@/domain/manufacturing/types";

export const LICENSE_EVALUATION_CODES = [
  "auto_suitable",
  "suitable_unmodified",
  "permission_required",
  "manual_review",
] as const;

export type LicenseEvaluationCode = (typeof LICENSE_EVALUATION_CODES)[number];

export const LICENSE_EVALUATION_LABELS: Record<LicenseEvaluationCode, string> = {
  auto_suitable: "Otomatik uygun",
  suitable_unmodified: "Değiştirmeden uygun",
  permission_required: "İzin gerekli",
  manual_review: "Manuel kontrol",
};

const adminGuidance: Record<LicenseEvaluationCode, string> = {
  auto_suitable: "CC0 / Public Domain / CC BY — ticari üretim genellikle uygundur.",
  suitable_unmodified:
    "CC BY-ND — model değiştirilmeden üretim uygunluğunu değerlendirin.",
  permission_required: "NC lisans — hak sahibinden izin alınmadan üretime geçmeyin.",
  manual_review: "Bilinmeyen veya özel lisans — manuel kontrol gerekir.",
};

const shareAlikeGuidance =
  "CC BY-SA — ticari kullanım mümkün olabilir; atıf ve paylaşım koşullarını doğrulayın.";

export function resolveLicenseEvaluation(
  verdict: LicenseVerdict,
): { code: LicenseEvaluationCode; guidanceTr: string } {
  const { code } = verdict;

  if (code === "cc0" || code === "public_domain" || code === "cc_by") {
    return { code: "auto_suitable", guidanceTr: adminGuidance.auto_suitable };
  }

  if (code === "cc_by_nd") {
    return {
      code: "suitable_unmodified",
      guidanceTr: adminGuidance.suitable_unmodified,
    };
  }

  if (code === "cc_by_nc") {
    return {
      code: "permission_required",
      guidanceTr: adminGuidance.permission_required,
    };
  }

  if (code === "cc_by_sa") {
    return { code: "manual_review", guidanceTr: shareAlikeGuidance };
  }

  return { code: "manual_review", guidanceTr: adminGuidance.manual_review };
}

export function resolveLicenseEvaluationFromLabel(
  licenseLabel: string | null | undefined,
) {
  return resolveLicenseEvaluation(normalizeLicense(licenseLabel));
}

export function resolveLicenseEvaluationFromCode(
  licenseCode: string | null | undefined,
  licenseLabel?: string | null,
) {
  if (licenseCode) {
    const normalized = normalizeLicense(licenseCode);
    if (normalized.code !== "unknown" && normalized.code !== "missing") {
      return resolveLicenseEvaluation(normalized);
    }
  }
  return resolveLicenseEvaluationFromLabel(licenseLabel);
}

export function licenseEvaluationLabel(code: LicenseEvaluationCode | string | null | undefined) {
  if (!code || !(code in LICENSE_EVALUATION_LABELS)) {
    return LICENSE_EVALUATION_LABELS.manual_review;
  }
  return LICENSE_EVALUATION_LABELS[code as LicenseEvaluationCode];
}

export function licenseEvaluationGuidance(
  code: LicenseEvaluationCode | string | null | undefined,
  licenseCode?: LicenseVerdictCode | string | null,
) {
  if (licenseCode === "cc_by_sa") {
    return shareAlikeGuidance;
  }
  if (code && code in adminGuidance) {
    return adminGuidance[code as LicenseEvaluationCode];
  }
  return adminGuidance.manual_review;
}
