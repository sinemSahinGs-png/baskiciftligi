export const HOME_ANALYTICS_EVENT = "bc-home-analytics";

export type HomeAnalyticsName =
  | "idea_search_started"
  | "idea_search_succeeded"
  | "idea_search_empty"
  | "idea_result_opened"
  | "idea_result_quote_started"
  | "upload_cta_clicked"
  | "ready_model_cta_clicked"
  | "corporate_cta_clicked";

export interface HomeAnalyticsPayload {
  name: HomeAnalyticsName;
  category?: string | null;
  resultCount?: number;
  status?: string;
}

export function sanitizeHomeAnalytics(
  payload: HomeAnalyticsPayload,
): HomeAnalyticsPayload {
  const clean: HomeAnalyticsPayload = { name: payload.name };
  if (payload.category) {
    clean.category = payload.category.slice(0, 40);
  }
  if (typeof payload.resultCount === "number" && Number.isFinite(payload.resultCount)) {
    clean.resultCount = Math.max(0, Math.round(payload.resultCount));
  }
  if (payload.status) {
    clean.status = payload.status.slice(0, 32);
  }
  return clean;
}

export function trackHomeEvent(payload: HomeAnalyticsPayload) {
  if (typeof window === "undefined") {
    return;
  }
  const detail = sanitizeHomeAnalytics(payload);
  window.dispatchEvent(new CustomEvent(HOME_ANALYTICS_EVENT, { detail }));
  const dataLayer = (window as Window & { dataLayer?: Array<Record<string, unknown>> })
    .dataLayer;
  if (Array.isArray(dataLayer)) {
    dataLayer.push({ event: detail.name, ...detail });
  }
}

export function analyticsContainsRawQuery(payload: unknown, rawQuery: string) {
  if (!rawQuery.trim()) return false;
  return JSON.stringify(payload).includes(rawQuery);
}
