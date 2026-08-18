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
  }>;
}) {
  const query = await searchParams;
  const callbackError = Array.isArray(query.error)
    ? query.error[0]
    : query.error;

  return (
    <div className="w-full max-w-lg">
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
