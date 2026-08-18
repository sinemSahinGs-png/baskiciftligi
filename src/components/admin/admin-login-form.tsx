"use client";

import { useActionState } from "react";
import { LoaderCircle, LockKeyhole } from "lucide-react";

import { adminLoginAction } from "@/app/admin/giris/actions";
import { initialAdminActionState } from "@/app/admin/admin-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { siteConfig } from "@/config/site";

export function AdminLoginForm({ nextPath }: { nextPath?: string }) {
  const [state, formAction, pending] = useActionState(
    adminLoginAction,
    initialAdminActionState,
  );

  return (
    <form
      action={formAction}
      className="w-full max-w-md rounded-3xl border border-white/10 bg-card p-6 sm:p-8"
    >
      <div className="mb-8">
        <p className="text-[0.65rem] font-bold tracking-[0.14em] text-cyan uppercase">
          Yönetim
        </p>
        <h1 className="mt-3 font-heading text-3xl font-medium tracking-[-0.04em]">
          {siteConfig.name} paneli
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Kategori görselleri, yazılar ve vitrin metinlerini düzenlemek için
          yönetici şifresini girin.
        </p>
      </div>

      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

      <div className="space-y-2">
        <Label htmlFor="admin-password">Yönetici şifresi</Label>
        <Input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-11 rounded-xl border-white/12 bg-black/20 px-3"
        />
      </div>

      {state.status === "error" && state.message ? (
        <p
          className="mt-4 rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs text-destructive"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-cyan px-5 text-sm font-bold text-ink hover:bg-[#63e2ff] disabled:opacity-50"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <LockKeyhole className="size-4" aria-hidden="true" />
        )}
        {pending ? "Kontrol ediliyor…" : "Panele gir"}
      </button>
    </form>
  );
}
