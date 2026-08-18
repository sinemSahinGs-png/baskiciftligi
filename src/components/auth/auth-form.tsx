"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle, LockKeyhole } from "lucide-react";

import {
  loginAction,
  registerAction,
} from "@/app/(auth)/actions";
import { initialAuthState } from "@/app/(auth)/auth-state";
import { siteConfig } from "@/config/site";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "login" | "register";

interface AuthFormProps {
  mode: AuthMode;
  configured: boolean;
  nextPath?: string;
}

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

export function AuthForm({ mode, configured, nextPath }: AuthFormProps) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState(action, initialAuthState);
  const isLogin = mode === "login";

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8">
        <p className="mb-5 text-sm font-semibold text-ink-secondary">
          {isLogin ? "Güvenli oturum" : "Yeni hesap"}
        </p>
        <h1 className="font-heading text-4xl leading-tight font-medium tracking-[-0.05em] sm:text-5xl">
          {isLogin ? "Tekrar hoş geldiniz." : `${siteConfig.name} hesabı oluşturun.`}
        </h1>
        <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground">
          {isLogin
            ? "Sipariş, teklif ve model süreçlerinizi tek bir güvenli alandan takip edin."
            : "Siparişleriniz ve gelecekteki 3D baskı talepleriniz için güvenli hesabınızı oluşturun."}
        </p>
      </div>

      {!configured ? (
        <Alert className="mb-6 border-coral/35 bg-coral/8">
          <LockKeyhole aria-hidden="true" />
          <AlertTitle>Hesap erişimi henüz yapılandırılmadı</AlertTitle>
          <AlertDescription>
            Bu ortamda Supabase Auth bağlantısı yok. Form gösterim amaçlıdır;
            giriş veya kayıt işlemi yapılamaz. Yerel yönetici paneli{" "}
            <span className="font-mono text-foreground">/admin/giris</span>{" "}
            adresinden şifre ile açılır.
          </AlertDescription>
        </Alert>
      ) : null}

      <form
        action={formAction}
        className="space-y-5 rounded-[1.25rem] border border-hairline bg-optical p-6 sm:p-8"
        noValidate
      >
        {isLogin && nextPath ? (
          <input type="hidden" name="next" value={nextPath} />
        ) : null}

        {!isLogin ? (
          <div className="space-y-2">
            <Label htmlFor="displayName">Ad soyad</Label>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              minLength={2}
              maxLength={80}
              required
              disabled={!configured || pending}
              aria-invalid={Boolean(state.fields?.displayName)}
              aria-describedby={
                state.fields?.displayName ? "displayName-error" : undefined
              }
              className="h-12 px-4"
            />
            <div id="displayName-error">
              <FieldMessage messages={state.fields?.displayName} />
            </div>
          </div>
        ) : null}

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
            aria-invalid={Boolean(state.fields?.email)}
            aria-describedby={state.fields?.email ? "email-error" : undefined}
            className="h-12 px-4"
          />
          <div id="email-error">
            <FieldMessage messages={state.fields?.email} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="password">Şifre</Label>
            <span className="text-xs text-muted-foreground">En az 8 karakter</span>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            minLength={8}
            maxLength={128}
            required
            disabled={!configured || pending}
            aria-invalid={Boolean(state.fields?.password)}
            aria-describedby={
              state.fields?.password ? "password-error" : undefined
            }
            className="h-12 px-4"
          />
          <div id="password-error">
            <FieldMessage messages={state.fields?.password} />
          </div>
        </div>

        {!isLogin ? (
          <div className="space-y-2">
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-muted-foreground">
              <input
                type="checkbox"
                name="consent"
                className="mt-1 size-4 accent-cyan"
                required
                disabled={!configured || pending}
                aria-invalid={Boolean(state.fields?.consent)}
              />
              <span>
                Hesap oluşturmak için bilgilerimin gizlilik bildirimi kapsamında
                işlenmesini kabul ediyorum.
              </span>
            </label>
            <FieldMessage messages={state.fields?.consent} />
          </div>
        ) : null}

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
          {pending
            ? "İşlem sürüyor…"
            : isLogin
              ? "Güvenli giriş yap"
              : "Hesabımı oluştur"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isLogin ? "Henüz hesabınız yok mu?" : "Zaten hesabınız var mı?"}{" "}
        <Link
          href={isLogin ? "/kayit" : "/giris"}
          className="font-semibold underline-offset-4 hover:underline"
        >
          {isLogin ? "Hesap oluşturun" : "Giriş yapın"}
        </Link>
      </p>
    </div>
  );
}
