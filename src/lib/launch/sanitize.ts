const SECRET_LIKE =
  /sk_live_[A-Za-z0-9]+|sk_test_[A-Za-z0-9]+|postgres:\/\/[^:]+:[^@]+@|mongodb(\+srv)?:\/\/[^:]+:[^@]+@|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.|Bearer\s+[A-Za-z0-9._-]{24,}/i;

const TECHNICAL_CUSTOMER_LEAK =
  /supabase|environment variable|ortam değişken|veritabanı yapılandırılmad|admin action required|\.octo-data/i;

export function containsSecretLikeValue(value: string): boolean {
  return SECRET_LIKE.test(value);
}

export function assertNoSecretLikePayload(payload: unknown): void {
  const serialized = JSON.stringify(payload);
  if (containsSecretLikeValue(serialized)) {
    throw new Error("Launch payload secret-like data içeriyor.");
  }
}

export function customerCopyLeaksConfiguration(text: string): boolean {
  return TECHNICAL_CUSTOMER_LEAK.test(text);
}
