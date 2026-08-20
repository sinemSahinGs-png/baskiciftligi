import { describe, expect, it } from "vitest";

import { resolveAdminAccess } from "@/lib/auth/admin-access";
import {
  mapCodeExchangeError,
  planAuthCallback,
  recoveryRedirectTo,
  resolveAllowedCallbackNext,
  urlContainsAuthSecrets,
} from "@/lib/auth/callback-destination";
import { evaluatePasswordPolicy } from "@/lib/auth/password-policy";

describe("password recovery request", () => {
  it("builds PKCE callback redirectTo with next=/sifre-yenile", () => {
    expect(recoveryRedirectTo("http://localhost:3000")).toBe(
      "http://localhost:3000/auth/callback?next=/sifre-yenile",
    );
    expect(recoveryRedirectTo("https://baskiciftligi.com")).toBe(
      "https://baskiciftligi.com/auth/callback?next=/sifre-yenile",
    );
  });

  it("does not honor unknown origins in redirectTo", () => {
    expect(recoveryRedirectTo("https://evil.example")).toBe(
      "https://baskiciftligi.com/auth/callback?next=/sifre-yenile",
    );
  });
});

describe("auth callback PKCE plan", () => {
  it("accepts a recovery code and forces /sifre-yenile", () => {
    const plan = planAuthCallback(
      new URL(
        "http://localhost:3000/auth/callback?code=pkce-code&next=/sifre-yenile",
      ),
    );
    expect(plan).toEqual({
      action: "exchange",
      code: "pkce-code",
      next: "/sifre-yenile",
      recovery: true,
    });
    expect(urlContainsAuthSecrets(`http://localhost:3000${plan.next}`)).toBe(
      false,
    );
  });

  it("rejects expired and reused exchange errors as recovery reasons", () => {
    expect(mapCodeExchangeError("otp_expired: Email link is invalid or has expired")).toBe(
      "expired",
    );
    expect(mapCodeExchangeError("Auth session already used")).toBe("reused");
  });

  it("maps a missing PKCE verifier to a dedicated recovery reason", () => {
    expect(
      mapCodeExchangeError(
        "invalid request: both auth code and code verifier should be non-empty",
      ),
    ).toBe("missing-verifier");
  });

  it("rejects implicit access_token and refresh_token query params", () => {
    const access = planAuthCallback(
      new URL(
        "http://localhost:3000/auth/callback#access_token=stolen&refresh_token=also",
      ),
    );
    expect(access.action).toBe("error");
    if (access.action === "error") {
      expect(access.reason).toBe("malformed");
      expect(access.recovery).toBe(true);
      expect(access.next).toBe("/sifre-yenile");
    }

    const queryToken = planAuthCallback(
      new URL(
        "http://localhost:3000/auth/callback?access_token=stolen&type=recovery",
      ),
    );
    expect(queryToken.action).toBe("error");
    expect(urlContainsAuthSecrets("http://localhost:3000/sifre-yenile?recovery_error=malformed")).toBe(
      false,
    );
  });

  it("rejects open redirects in next", () => {
    expect(
      resolveAllowedCallbackNext("https://evil.example/phish"),
    ).toBe("/hesabim");
    expect(resolveAllowedCallbackNext("//evil.example")).toBe("/hesabim");
    expect(resolveAllowedCallbackNext("/magaza")).toBe("/hesabim");
    expect(resolveAllowedCallbackNext("/sifre-yenile")).toBe("/sifre-yenile");

    const plan = planAuthCallback(
      new URL(
        "http://localhost:3000/auth/callback?code=abc&next=https://evil.example",
      ),
    );
    expect(plan.action).toBe("exchange");
    if (plan.action === "exchange") {
      expect(plan.next).toBe("/hesabim");
    }
  });

  it("keeps the post-update login URL free of tokens", () => {
    const success = "http://localhost:3000/giris?password_updated=1";
    expect(urlContainsAuthSecrets(success)).toBe(false);
    expect(success).not.toMatch(/access_token|refresh_token|token_hash/);
    expect(
      urlContainsAuthSecrets(
        "http://localhost:3000/giris#access_token=x&refresh_token=y",
      ),
    ).toBe(true);
  });
});

describe("recovered password policy", () => {
  it("accepts a strong password and rejects weak ones", () => {
    expect(evaluatePasswordPolicy("StrongPass12!").ok).toBe(true);
    expect(evaluatePasswordPolicy("short1!A").ok).toBe(false);
    expect(evaluatePasswordPolicy("alllowercase12!").ok).toBe(false);
    expect(
      evaluatePasswordPolicy("OwnerPass12!", { email: "owner@example.com" }).ok,
    ).toBe(false);
  });
});

describe("admin authorization after independent login", () => {
  it("blocks customers from /admin", () => {
    const decision = resolveAdminAccess({ role: "customer", isActive: true });
    expect(decision.allowed).toBe(false);
    expect(decision.redirectTo).toBe("/");
  });

  it("allows a confirmed active owner to access /admin", () => {
    const decision = resolveAdminAccess({ role: "owner", isActive: true });
    expect(decision.allowed).toBe(true);
    expect(decision.redirectTo).toBe(null);
  });

  it("does not treat inactive profiles as admin", () => {
    expect(
      resolveAdminAccess({ role: "owner", isActive: false }).allowed,
    ).toBe(false);
  });
});
