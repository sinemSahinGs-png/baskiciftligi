export const PRODUCTION_SITE_URL = "https://baskiciftligi.com";

export const mandatoryProductionEnv = ["NEXT_PUBLIC_SITE_URL"] as const;

export const optionalIntegrationEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "THINGIVERSE_CLIENT_ID",
  "THINGIVERSE_CLIENT_SECRET",
  "THINGIVERSE_ACCESS_TOKEN",
  "THINGIVERSE_REDIRECT_URI",
  "MANUFACTURING_QUOTE_HMAC_SECRET",
  "SLICER_WORKER_SECRET",
  "SLICER_WORKER_URL",
  "SLICER_QUEUE_URL",
  "SLICER_WEBHOOK_SECRET",
  "MODEL_CONVERTER_URL",
  "PAYTR_MERCHANT_ID",
  "PAYTR_MERCHANT_KEY",
  "PAYTR_MERCHANT_SALT",
  "PAYTR_CALLBACK_URL",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY",
] as const;

export const publicEnvNames = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_CONTACT_EMAIL",
  "NEXT_PUBLIC_CONTACT_PHONE",
  "NEXT_PUBLIC_INSTAGRAM_URL",
  "NEXT_PUBLIC_YOUTUBE_URL",
] as const;

export function classifySiteUrl(value: string | undefined) {
  if (!value) {
    return "missing";
  }
  if (value === PRODUCTION_SITE_URL) {
    return "canonical";
  }
  if (value.includes("localhost") || value.includes("127.0.0.1")) {
    return "development";
  }
  return "non-canonical";
}

export function isEnvNamePublic(name: string) {
  return name.startsWith("NEXT_PUBLIC_");
}
