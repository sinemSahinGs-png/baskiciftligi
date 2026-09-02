export type StudioPhase =
  | "empty"
  | "parsing"
  | "ready"
  | "invalid"
  | "uploading"
  | "queued"
  | "slicing"
  | "quoting"
  | "quoted"
  | "stale_quote"
  | "adding_to_cart"
  | "completed"
  | "failed";

export type StudioProgressStage =
  | "prepare"
  | "upload"
  | "queued"
  | "slice"
  | "metrics"
  | "sign"
  | "ready";

const JOB_STAGE: Record<string, StudioProgressStage> = {
  created: "queued",
  uploading: "upload",
  uploaded: "queued",
  validating: "queued",
  analyzing: "slice",
  slicing: "slice",
  pricing: "sign",
  priced: "ready",
};

export const STUDIO_STAGE_COPY: Record<StudioProgressStage, string> = {
  prepare: "Dosya hazırlanıyor",
  upload: "Güvenli şekilde yükleniyor",
  queued: "Dilimleme sırasına alındı",
  slice: "PrusaSlicer modeli analiz ediyor",
  metrics: "Malzeme ve süre hesaplanıyor",
  sign: "İmzalı teklif hazırlanıyor",
  ready: "Teklif hazır",
};

export function stageFromJobState(state: string | null | undefined): StudioProgressStage | null {
  if (!state) return null;
  return JOB_STAGE[state] ?? null;
}

const INVALID_PARSE = new Set([
  "corrupt",
  "unsupported",
  "too_complex",
  "empty",
  "multi_plate",
  "security",
]);

export function deriveStudioPhase(input: {
  hasFile: boolean;
  parseStatus: string;
  submitting: boolean;
  addingToCart: boolean;
  cartCompleted: boolean;
  jobState: string | null;
  hasQuote: boolean;
  quoteStale: boolean;
  failed: boolean;
}): StudioPhase {
  if (input.failed) return "failed";
  if (input.cartCompleted) return "completed";
  if (input.addingToCart) return "adding_to_cart";
  if (!input.hasFile) return "empty";
  if (input.parseStatus === "parsing" || input.parseStatus === "idle") return "parsing";
  if (INVALID_PARSE.has(input.parseStatus)) {
    return "invalid";
  }
  if (input.hasQuote && input.quoteStale) return "stale_quote";
  if (input.hasQuote) return "quoted";
  if (input.submitting && !input.jobState) return "uploading";
  const stage = stageFromJobState(input.jobState);
  if (stage === "upload") return "uploading";
  if (stage === "queued") return "queued";
  if (stage === "slice" || stage === "metrics") return "slicing";
  if (stage === "sign") return "quoting";
  return "ready";
}

export function isQuoteStale(input: {
  hasQuote: boolean;
  quoteFingerprint: string | null;
  currentFingerprint: string;
}): boolean {
  if (!input.hasQuote) return false;
  if (!input.quoteFingerprint) return true;
  return input.quoteFingerprint !== input.currentFingerprint;
}
