export interface CustomerFacingAnalysisError {
  title: string;
  message: string;
  code:
    | "worker_unavailable"
    | "analysis_failed"
    | "invalid_geometry"
    | "out_of_bounds"
    | "transform_mismatch"
    | "timeout"
    | "generic";
  canRetry: boolean;
  canManualReview: boolean;
}

const INTERNAL_TERMS =
  /docker\s*compose|prusa[\s-]?slicer|slicer[\s_-]?worker|127\.0\.0\.1|localhost|SLICER_|THINGIVERSE_ACCESS|stack trace|ENOENT|spawn/i;

export function sanitizeCustomerErrorMessage(raw: string | null | undefined): string {
  if (!raw) {
    return "Analiz tamamlanamadı.";
  }
  if (INTERNAL_TERMS.test(raw)) {
    return "Analiz tamamlanamadı.";
  }
  return raw.slice(0, 240);
}

export function mapAnalysisError(input: {
  errorCode?: string | null;
  errorMessage?: string | null;
  workerOnline?: boolean | null;
  state?: string | null;
}): CustomerFacingAnalysisError {
  const code = input.errorCode ?? "";
  const message = sanitizeCustomerErrorMessage(input.errorMessage);

  if (
    input.workerOnline === false ||
    code === "worker_unavailable" ||
    (input.state === "uploaded" && code === "worker_offline")
  ) {
    return {
      title: "Fiyat analizi şu anda tamamlanamıyor",
      message:
        "Dosyanı ve seçimlerini kaydedebiliriz. Ekibimiz modeli inceleyip net fiyatı seninle paylaşır.",
      code: "worker_unavailable",
      canRetry: true,
      canManualReview: true,
    };
  }

  if (code === "timeout") {
    return {
      title: "Analiz zaman aşımına uğradı",
      message: "Model büyük veya karmaşık olabilir. Tekrar deneyebilir veya manuel inceleme isteyebilirsin.",
      code: "timeout",
      canRetry: true,
      canManualReview: true,
    };
  }

  if (code === "out_of_bounds" || code === "does_not_fit") {
    return {
      title: "Model plakaya sığmıyor",
      message: "Ölçek veya yönü değiştir; gerekirse manuel inceleme iste.",
      code: "out_of_bounds",
      canRetry: false,
      canManualReview: true,
    };
  }

  if (code === "transform_mismatch") {
    return {
      title: "Önizleme ile analiz uyuşmadı",
      message: "Otomatik fiyat üretilemedi. Manuel incelemeye gönderebilirsin.",
      code: "transform_mismatch",
      canRetry: false,
      canManualReview: true,
    };
  }

  if (code === "invalid_geometry" || code === "mesh_invalid") {
    return {
      title: "Dosya geometrisi geçersiz",
      message,
      code: "invalid_geometry",
      canRetry: false,
      canManualReview: true,
    };
  }

  if (code === "slicer_failure" || input.state === "failed") {
    return {
      title: "Analiz tamamlanamadı",
      message,
      code: "analysis_failed",
      canRetry: true,
      canManualReview: true,
    };
  }

  return {
    title: "Analiz tamamlanamadı",
    message,
    code: "generic",
    canRetry: true,
    canManualReview: true,
  };
}

export function mapWorkerOfflinePollingError(): CustomerFacingAnalysisError {
  return mapAnalysisError({ workerOnline: false, errorCode: "worker_unavailable" });
}
