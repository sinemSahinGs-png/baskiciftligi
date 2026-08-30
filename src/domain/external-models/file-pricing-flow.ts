export const FILE_PRICING_FLOW_STATES = [
  "file_required",
  "uploading",
  "validating",
  "queued",
  "analysing",
  "analysed",
  "analysis_unavailable",
  "invalid_file",
] as const;

export type FilePricingFlowState = (typeof FILE_PRICING_FLOW_STATES)[number];

export interface FilePricingFlowDisplay {
  state: FilePricingFlowState;
  labelTr: string;
  mainTextTr: string;
  supportingTextTr?: string;
  exactGrossMinor?: number;
}

export const FILE_PRICING_FLOW_LABELS: Record<FilePricingFlowState, string> = {
  file_required: "Fiyat için dosya gerekli",
  uploading: "Dosya yükleniyor…",
  validating: "Dosya kontrol ediliyor…",
  queued: "Analiz sırasına alındı",
  analysing: "Baskı süresi ve malzeme hesaplanıyor…",
  analysed: "Hesaplanan üretim fiyatı",
  analysis_unavailable: "Otomatik analiz tamamlanamadı",
  invalid_file: "Dosya doğrulanamadı",
};

export function resolveFilePricingFlowDisplay(input: {
  state: FilePricingFlowState;
  exactGrossMinor?: number | null;
  validationMessage?: string | null;
}): FilePricingFlowDisplay {
  const labelTr = FILE_PRICING_FLOW_LABELS[input.state];
  switch (input.state) {
    case "analysed":
      if (
        input.exactGrossMinor != null &&
        Number.isFinite(input.exactGrossMinor) &&
        input.exactGrossMinor > 0
      ) {
        return {
          state: "analysed",
          labelTr,
          mainTextTr: formatMoney(input.exactGrossMinor),
          supportingTextTr: "Doğrulanmış baskı analizine göre hesaplandı.",
          exactGrossMinor: input.exactGrossMinor,
        };
      }
      return {
        state: "analysis_unavailable",
        labelTr: FILE_PRICING_FLOW_LABELS.analysis_unavailable,
        mainTextTr: "Otomatik analiz tamamlanamadı.",
        supportingTextTr: "Manuel incelemeye gönderebilirsiniz.",
      };
    case "invalid_file":
      return {
        state: "invalid_file",
        labelTr,
        mainTextTr: input.validationMessage ?? "Desteklenen bir model dosyası seçin.",
      };
    case "analysis_unavailable":
      return {
        state: "analysis_unavailable",
        labelTr,
        mainTextTr: "Otomatik analiz tamamlanamadı.",
        supportingTextTr: "Manuel incelemeye gönderebilirsiniz.",
      };
    case "file_required":
      return {
        state: "file_required",
        labelTr,
        mainTextTr:
          "Dosya analizinden sonra malzeme kullanımı, baskı süresi ve üretim detaylarına göre net fiyat hesaplanır.",
      };
    default:
      return {
        state: input.state,
        labelTr,
        mainTextTr: labelTr,
      };
  }
}

import { formatMoney } from "@/lib/money";

export function mapQuoteJobStateToFilePricingFlow(
  jobState: string | null | undefined,
  options?: { exactGrossMinor?: number | null; workerOnline?: boolean },
): FilePricingFlowState {
  switch (jobState) {
    case "uploading":
      return "uploading";
    case "validating":
    case "analyzing":
      return "validating";
    case "uploaded":
      return options?.workerOnline === false ? "analysis_unavailable" : "queued";
    case "slicing":
    case "pricing":
      return "analysing";
    case "priced":
      return options?.exactGrossMinor ? "analysed" : "analysis_unavailable";
    case "needs_review":
    case "failed":
      return "analysis_unavailable";
    default:
      return "file_required";
  }
}
