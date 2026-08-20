export const AUTH_CALLBACK_NEXT_ALLOWLIST = [
  "/sifre-yenile",
  "/hesabim",
  "/giris",
] as const;

export const PASSWORD_RECOVERY_PATH = "/sifre-yenile";
export const PASSWORD_RECOVERY_COOKIE = "bc-pw-recovery";
export const PASSWORD_RECOVERY_COOKIE_MAX_AGE = 15 * 60;

export const AUTH_REDIRECT_ORIGINS = [
  "http://localhost:3000",
  "https://baskiciftligi.com",
  "https://www.baskiciftligi.com",
] as const;

export const AUTH_CALLBACK_PATHS = [
  "http://localhost:3000/auth/callback",
  "https://baskiciftligi.com/auth/callback",
  "https://www.baskiciftligi.com/auth/callback",
] as const;

const FORBIDDEN_PARAM_KEYS = [
  "access_token",
  "refresh_token",
  "provider_token",
  "provider_refresh_token",
  "id_token",
  "token",
  "token_hash",
  "otp",
] as const;

export type RecoveryErrorReason =
  | "expired"
  | "reused"
  | "malformed"
  | "missing-verifier";

export function callbackContainsSecretParams(url: URL): boolean {
  for (const key of FORBIDDEN_PARAM_KEYS) {
    if (url.searchParams.has(key) && url.searchParams.get(key)) {
      return true;
    }
  }

  const hash = url.hash.replace(/^#/, "");
  if (!hash) {
    return false;
  }

  const hashParams = new URLSearchParams(hash);
  return FORBIDDEN_PARAM_KEYS.some((key) => Boolean(hashParams.get(key)));
}

export function urlContainsAuthSecrets(href: string): boolean {
  try {
    return callbackContainsSecretParams(new URL(href, "http://localhost:3000"));
  } catch {
    return /access_token|refresh_token|token_hash/i.test(href);
  }
}

export function resolveAllowedCallbackNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/hesabim";
  }

  const pathname = next.split("?")[0]?.split("#")[0] ?? "";
  if (
    (AUTH_CALLBACK_NEXT_ALLOWLIST as readonly string[]).includes(pathname)
  ) {
    return pathname;
  }

  return "/hesabim";
}

export function isPasswordRecoveryIntent(url: URL): boolean {
  const next = url.searchParams.get("next");
  const type = url.searchParams.get("type");
  return (
    next === PASSWORD_RECOVERY_PATH ||
    type === "recovery" ||
    callbackContainsSecretParams(url)
  );
}

export function recoveryRedirectTo(origin: string): string {
  const normalized = origin.replace(/\/+$/, "");
  const allowed = (AUTH_REDIRECT_ORIGINS as readonly string[]).includes(
    normalized,
  )
    ? normalized
    : "https://baskiciftligi.com";
  return `${allowed}/auth/callback?next=${PASSWORD_RECOVERY_PATH}`;
}

export function mapCodeExchangeError(message: string): RecoveryErrorReason {
  const lower = message.toLocaleLowerCase("tr-TR");
  if (lower.includes("verifier") || lower.includes("code verifier")) {
    return "missing-verifier";
  }
  if (
    lower.includes("expired") ||
    lower.includes("otp_expired") ||
    (lower.includes("flow state") && lower.includes("not found"))
  ) {
    return "expired";
  }
  if (
    lower.includes("already") ||
    lower.includes("used") ||
    lower.includes("replay")
  ) {
    return "reused";
  }
  if (lower.includes("flow_state")) {
    return "expired";
  }
  return "malformed";
}

export type AuthCallbackPlan =
  | {
      action: "exchange";
      code: string;
      next: string;
      recovery: boolean;
    }
  | {
      action: "error";
      reason: RecoveryErrorReason | "missing-code";
      recovery: boolean;
      next: string;
    };

export function planAuthCallback(url: URL): AuthCallbackPlan {
  const recovery = isPasswordRecoveryIntent(url);

  if (callbackContainsSecretParams(url)) {
    return {
      action: "error",
      reason: "malformed",
      recovery: true,
      next: PASSWORD_RECOVERY_PATH,
    };
  }

  const code = url.searchParams.get("code")?.trim() ?? "";
  if (!code) {
    return {
      action: "error",
      reason: recovery ? "malformed" : "missing-code",
      recovery,
      next: recovery ? PASSWORD_RECOVERY_PATH : "/giris",
    };
  }

  const next = recovery
    ? PASSWORD_RECOVERY_PATH
    : resolveAllowedCallbackNext(url.searchParams.get("next"));

  return { action: "exchange", code, next, recovery };
}

export function recoveryErrorHref(reason: RecoveryErrorReason): string {
  return `${PASSWORD_RECOVERY_PATH}?recovery_error=${reason}`;
}
