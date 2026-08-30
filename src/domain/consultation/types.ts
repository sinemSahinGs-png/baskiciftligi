import type { LicenseEvaluationCode } from "@/domain/consultation/license-evaluation";
import type { PricingState } from "@/domain/external-models/pricing-state";

export const CONSULTATION_STATUSES = [
  "pending_license_review",
  "reviewing",
  "needs_info",
  "production_ok",
  "not_suitable",
  "quote_sent",
  "completed",
] as const;

export type ConsultationStatus = (typeof CONSULTATION_STATUSES)[number];

export const CONSULTATION_STATUS_LABELS: Record<ConsultationStatus, string> = {
  pending_license_review: "Yeni",
  reviewing: "İnceleniyor",
  needs_info: "Ek bilgi gerekli",
  production_ok: "Üretime uygun",
  not_suitable: "Uygun değil",
  quote_sent: "Teklif gönderildi",
  completed: "Tamamlandı",
};

export interface ModelConsultationRequest {
  id: string;
  source: string;
  externalId: string;
  modelTitle: string;
  creatorName: string | null;
  sourceUrl: string;
  licenseLabel: string | null;
  licenseCode: string | null;
  licenseEvaluation: LicenseEvaluationCode;
  thumbnailUrl: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  material: string;
  color: string;
  sizeLabel: string;
  quantity: number;
  customerNote: string | null;
  estimatedGrossMinor: number | null;
  pricingState: PricingState;
  productionOptions: Record<string, unknown>;
  status: ConsultationStatus;
  adminNote: string | null;
  finalQuoteGrossMinor: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsultationInput {
  source: string;
  externalId: string;
  modelTitle: string;
  creatorName?: string | null;
  sourceUrl: string;
  licenseLabel?: string | null;
  licenseCode?: string | null;
  licenseEvaluation?: LicenseEvaluationCode;
  thumbnailUrl?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  material: string;
  color: string;
  sizeLabel: string;
  quantity: number;
  customerNote?: string | null;
  estimatedGrossMinor?: number | null;
  pricingState?: PricingState;
  productionOptions?: Record<string, unknown>;
}

export interface UpdateConsultationInput {
  status?: ConsultationStatus;
  adminNote?: string | null;
  finalQuoteGrossMinor?: number | null;
}
