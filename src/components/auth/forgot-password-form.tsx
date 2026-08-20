"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";

import { requestPasswordResetAction } from "@/app/(auth)/recovery-actions";
import { initialAuthState } from "@/app/(auth)/auth-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm({ configured }: { configured: boolean }) {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialAuthState,
  );

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8">
        <p className="mb-5 text-sm font-semibold text-ink-secondary">
          Şifre kurtarma
        </p>
        <h1 className="font-heading text-4xl leading-tight font-medium tracking-[-0.05em] sm:text-5xl">
          Şifrenizi sıfırlayın.
        </h1>
        <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground">
          Kayıtlı e-posta adresinize tek kullanımlık, kısa ömürlü bir bağlantı
          gönderilir. Bağlantı yalnızca bu tarayıcıdaki doğrulama ile çalışır.
        </p>
      </div>

      <form
        action={formAction}
        className="space-y-5 rounded-[1.25rem] border border-hairline bg-optical p-6 sm:p-8"
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="email">E-posta adresi</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            required
            disabled={!configured || pending}
            className="h-12 px-4"
          />
        </div>

        {state.message ? (
          <div
            aria-live="polite"
            className={
              state.status === "success"
                ? "flex gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/5 p-4 text-sm text-emerald-200"
                : "rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"
            }
          >
            {state.status === "success" ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            ) : null}
            <span>{state.message}</span>
          </div>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!configured || pending}
        >
          {pending ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <ArrowRight aria-hidden="true" />
          )}
          {pending ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Şifrenizi hatırladınız mı?{" "}
        <Link href="/giris" className="font-semibold underline-offset-4 hover:underline">
          Giriş yapın
        </Link>
      </p>
    </div>
  );
}
