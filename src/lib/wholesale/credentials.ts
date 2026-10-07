import "server-only";

import { parseStrictEnvBoolean } from "@/lib/env-boolean";
import { serverEnv } from "@/lib/env.server";
import type { PaytrCredentials } from "@/lib/wholesale/paytr";

export function getPaytrCredentials(): PaytrCredentials | null {
  const merchantId = serverEnv.PAYTR_MERCHANT_ID;
  const merchantKey = serverEnv.PAYTR_MERCHANT_KEY;
  const merchantSalt = serverEnv.PAYTR_MERCHANT_SALT;
  if (!merchantId || !merchantKey || !merchantSalt) {
    return null;
  }
  return { merchantId, merchantKey, merchantSalt };
}

export function isPaytrTestMode(): boolean {
  if (process.env.VERCEL_ENV === "preview") {
    return true;
  }
  return serverEnv.PAYTR_TEST_MODE !== "0";
}

export function isWholesalePaytrStubEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    parseStrictEnvBoolean(process.env.WHOLESALE_PAYTR_STUB)
  );
}

export function paytrCallbackUrl(): string {
  if (serverEnv.PAYTR_CALLBACK_URL) {
    return serverEnv.PAYTR_CALLBACK_URL;
  }
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  return `${site}/api/paytr/callback`;
}

export function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}
