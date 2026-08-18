import type { LicenseVerdict, LicenseVerdictCode } from "@/domain/manufacturing/types";

interface LicensePattern {
  pattern: RegExp;
  code: LicenseVerdictCode;
}

const patterns: LicensePattern[] = [
  { pattern: /\bcc0\b|public\s*domain\s*dedication|cc\s*zero/i, code: "cc0" },
  { pattern: /public\s*domain/i, code: "public_domain" },
  {
    pattern: /attribution[\s-]*non[\s-]*commercial|by-nc|cc-by-nc/i,
    code: "cc_by_nc",
  },
  {
    pattern: /no[\s-]*deriv|by-nd|cc-by-nd/i,
    code: "cc_by_nd",
  },
  {
    pattern: /share[\s-]*alike|by-sa|cc-by-sa/i,
    code: "cc_by_sa",
  },
  {
    pattern: /creative\s*commons[\s-]*attribution|\bcc-by\b|\bcc by\b/i,
    code: "cc_by",
  },
];

const summaries: Record<LicenseVerdictCode, string> = {
  cc0: "CC0 / kamu malı — ticari üretim otomatik kapıdan geçebilir.",
  public_domain: "Kamu malı — ticari üretim otomatik kapıdan geçebilir.",
  cc_by: "CC BY — ticari üretim için atıf zorunludur.",
  cc_by_sa: "CC BY-SA — paylaşıma benzer yükümlülük nedeniyle teknik inceleme gerekir.",
  cc_by_nc: "CC BY-NC — ticari üretim yasaktır.",
  cc_by_nd: "CC BY-ND — türetme kısıtı nedeniyle otomatik satış kapalıdır.",
  unknown: "Lisans eşlemesi güvenilir değil — otomatik satış kapalıdır.",
  missing: "Lisans bilgisi yok — otomatik satış kapalıdır.",
  requires_review: "Bu lisans ancak kayıtlı hukuki gerekçe ile incelenebilir.",
};

export function normalizeLicense(raw: string | null | undefined): LicenseVerdict {
  const mappedFrom = raw?.trim() || null;
  if (!mappedFrom) {
    return verdict("missing", mappedFrom);
  }

  for (const item of patterns) {
    if (item.pattern.test(mappedFrom)) {
      return verdict(item.code, mappedFrom);
    }
  }

  return verdict("unknown", mappedFrom);
}

export function verdict(
  code: LicenseVerdictCode,
  mappedFrom: string | null,
): LicenseVerdict {
  const publicDomain = code === "cc0" || code === "public_domain";
  const attributionRequired = code === "cc_by" || code === "cc_by_sa" || code === "cc_by_nc" || code === "cc_by_nd";
  const shareAlike = code === "cc_by_sa";
  const noDerivatives = code === "cc_by_nd";
  const commercialUse =
    code === "cc0" || code === "public_domain" || code === "cc_by"
      ? "permitted"
      : code === "cc_by_nc"
        ? "prohibited"
        : code === "missing"
          ? "missing"
          : "unknown";
  const automaticManufacturingAllowed =
    commercialUse === "permitted" && (code === "cc0" || code === "public_domain" || code === "cc_by");
  const requiresManualReview =
    !automaticManufacturingAllowed && code !== "cc_by_nc" && code !== "missing";

  return {
    code,
    commercialUse,
    attributionRequired,
    shareAlike,
    noDerivatives,
    publicDomain,
    automaticManufacturingAllowed,
    requiresManualReview,
    summaryTr: summaries[code],
    mappedFrom,
  };
}

export function buildAttributionText(input: {
  title: string;
  creator: string;
  licenseName: string | null;
  sourceUrl: string;
}): string {
  const license = input.licenseName ? ` · ${input.licenseName}` : "";
  return `${input.title} — ${input.creator} / Thingiverse${license} · ${input.sourceUrl}`;
}

export function canAutomaticallyQuoteLicense(verdictValue: LicenseVerdict): boolean {
  return verdictValue.automaticManufacturingAllowed && verdictValue.commercialUse === "permitted";
}
