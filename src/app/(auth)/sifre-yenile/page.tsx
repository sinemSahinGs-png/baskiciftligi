import type { Metadata } from "next";

import { RecoveryErrorState } from "@/components/auth/recovery-error-state";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { siteConfig } from "@/config/site";
import type { RecoveryErrorReason } from "@/lib/auth/callback-destination";
import { isPasswordRecoverySession } from "@/lib/auth/recovery-session";
import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Şifre yenile",
  description: `${siteConfig.name} hesabınız için yeni şifre belirleyin.`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const RECOVERY_REASONS: RecoveryErrorReason[] = [
  "expired",
  "reused",
  "malformed",
  "missing-verifier",
];

function parseReason(value: string | string[] | undefined): RecoveryErrorReason | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate) {
    return null;
  }
  return RECOVERY_REASONS.includes(candidate as RecoveryErrorReason)
    ? (candidate as RecoveryErrorReason)
    : "malformed";
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ recovery_error?: string | string[] }>;
}) {
  const query = await searchParams;
  const reason = parseReason(query.recovery_error);

  if (reason) {
    return <RecoveryErrorState reason={reason} />;
  }

  if (!isSupabaseConfigured) {
    return <RecoveryErrorState reason="malformed" />;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!user || !(await isPasswordRecoverySession(user))) {
    return <RecoveryErrorState reason="malformed" />;
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8">
        <p className="mb-5 text-sm font-semibold text-ink-secondary">
          Şifre kurtarma
        </p>
        <h1 className="font-heading text-4xl leading-tight font-medium tracking-[-0.05em] sm:text-5xl">
          Yeni şifrenizi belirleyin.
        </h1>
        <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground">
          Bu adım yalnızca geçerli bir sıfırlama oturumuyla açılır. Hesap rolünüz
          değişmez.
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
