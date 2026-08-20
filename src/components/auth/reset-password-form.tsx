"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";

import { updateRecoveredPasswordAction } from "@/app/(auth)/recovery-actions";
import { initialAuthState } from "@/app/(auth)/auth-state";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/password-policy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function FieldMessage({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }
  return (
    <p className="text-sm text-destructive" role="alert">
      {messages[0]}
    </p>
  );
}

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    updateRecoveredPasswordAction,
    initialAuthState,
  );

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-[1.25rem] border border-hairline bg-optical p-6 sm:p-8"
      noValidate
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="password">Yeni şifre</Label>
          <span className="text-xs text-muted-foreground">
            En az {PASSWORD_MIN_LENGTH} karakter
          </span>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={128}
          required
          disabled={pending}
          aria-invalid={Boolean(state.fields?.password)}
          className="h-12 px-4"
        />
        <FieldMessage messages={state.fields?.password} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Yeni şifreyi doğrula</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={128}
          required
          disabled={pending}
          aria-invalid={Boolean(state.fields?.confirm)}
          className="h-12 px-4"
        />
        <FieldMessage messages={state.fields?.confirm} />
      </div>

      {state.message ? (
        <div
          aria-live="polite"
          className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {state.message}
        </div>
      ) : null}

      <p className="text-sm leading-6 text-muted-foreground">
        Büyük/küçük harf, rakam ve özel karakter kullanın. Bu işlem diğer
        oturumları sonlandırır; roller değişmez.
      </p>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <ArrowRight aria-hidden="true" />
        )}
        {pending ? "Güncelleniyor…" : "Şifreyi güncelle"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/sifre-unuttum" className="font-semibold underline-offset-4 hover:underline">
          Yeni bağlantı iste
        </Link>
      </p>
    </form>
  );
}
