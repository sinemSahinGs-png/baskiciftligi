"use client";

import { useActionState } from "react";

import { saveLilDiscStaffAction } from "@/app/admin/ekip/actions";
import { initialAdminActionState } from "@/app/admin/admin-state";

export function StaffInviteForm() {
  const [state, formAction, pending] = useActionState(
    saveLilDiscStaffAction,
    initialAdminActionState,
  );

  return (
    <form
      action={formAction}
      className="max-w-md space-y-4 rounded-2xl border border-white/10 bg-[#12151a] p-6"
    >
      <label className="block text-sm font-semibold">
        Kullanıcı adı
        <input
          required
          name="username"
          defaultValue="kutaygulec"
          className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3"
        />
      </label>
      <label className="block text-sm font-semibold">
        Görünen ad
        <input
          name="displayName"
          defaultValue="Kutay Güleç"
          className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3"
        />
      </label>
      <label className="block text-sm font-semibold">
        Şifre
        <input
          required
          type="password"
          name="password"
          minLength={8}
          className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3"
        />
      </label>
      {state.message ? (
        <p
          className={
            state.status === "error" ? "text-sm text-red-300" : "text-sm text-emerald-300"
          }
        >
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#f27a1a] text-sm font-bold text-white disabled:opacity-50"
      >
        Hesabı kaydet
      </button>
    </form>
  );
}
