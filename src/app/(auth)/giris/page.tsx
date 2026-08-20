import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { AuthForm } from "@/components/auth/auth-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Giriş",
  description: `${siteConfig.name} hesabınıza güvenli giriş yapın.`,
};

function safeNextPath(value: string | string[] | undefined): string | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate?.startsWith("/") || candidate.startsWith("//")) {
    return undefined;
  }

  return candidate;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string | string[];
    error?: string | string[];
    password_updated?: string | string[];
  }>;
}) {
  const query = await searchParams;
  const callbackError = Array.isArray(query.error)
    ? query.error[0]
    : query.error;
  const passwordUpdated = Array.isArray(query.password_updated)
    ? query.password_updated[0]
    : query.password_updated;

  return (
    <div className="w-full max-w-lg">
      {passwordUpdated === "1" ? (
        <Alert className="mb-5 border-emerald-400/25 bg-emerald-400/5">
          <AlertTitle>Şifreniz güncellendi</AlertTitle>
          <AlertDescription>
            Yeni şifrenizle normal giriş yapabilirsiniz. Önceki sıfırlama
            bağlantıları artık geçerli değildir.
          </AlertDescription>
        </Alert>
      ) : null}
      {callbackError ? (
        <Alert variant="destructive" className="mb-5">
          <AlertTitle>Oturum doğrulanamadı</AlertTitle>
          <AlertDescription>
            Bağlantı geçersiz veya süresi dolmuş olabilir. Lütfen yeniden giriş
            yapın.
          </AlertDescription>
        </Alert>
      ) : null}
      <AuthForm
        mode="login"
        configured={isSupabaseConfigured}
        nextPath={safeNextPath(query.next)}
      />
    </div>
  );
}
