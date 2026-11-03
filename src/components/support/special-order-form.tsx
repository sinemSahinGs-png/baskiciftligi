"use client";

import { useState } from "react";

import { siteConfig } from "@/config/site";
import { useTranslations } from "next-intl";

export function SpecialOrderForm() {
  const t = useTranslations();
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setMessage(null);
    try {
      const response = await fetch("/api/hazir-modeller/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "homepage",
          customerName: String(data.get("name") ?? ""),
          customerPhone: String(data.get("phone") ?? ""),
          customerEmail: String(data.get("email") ?? ""),
          customerNote: String(data.get("note") ?? ""),
        }),
      });
      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setStatus("error");
        setMessage(payload.error ?? t("special.fail"));
        return;
      }
      setStatus("ok");
      setMessage(payload.message ?? t("special.ok"));
      form.reset();
    } catch {
      setStatus("error");
      setMessage(t("special.connection"));
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="mx-auto max-w-xl space-y-4">
      <label className="block text-sm font-semibold">
        {t("special.name")}
        <input
          required
          name="name"
          minLength={2}
          className="mt-2 h-11 w-full rounded-xl border border-white/15 bg-midnight px-3"
        />
      </label>
      <label className="block text-sm font-semibold">
        {t("special.phone")}
        <input
          required
          name="phone"
          minLength={7}
          className="mt-2 h-11 w-full rounded-xl border border-white/15 bg-midnight px-3"
        />
      </label>
      <label className="block text-sm font-semibold">
        {t("special.email")}
        <input
          type="email"
          name="email"
          className="mt-2 h-11 w-full rounded-xl border border-white/15 bg-midnight px-3"
        />
      </label>
      <label className="block text-sm font-semibold">
        {t("special.note")}
        <textarea
          required
          name="note"
          minLength={8}
          rows={6}
          placeholder={t("special.placeholder")}
          className="mt-2 w-full rounded-xl border border-white/15 bg-midnight px-3 py-3"
        />
      </label>
      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-coral px-4 text-sm font-semibold text-ink disabled:opacity-50"
      >
        {status === "sending" ? t("special.sending") : t("special.send")}
      </button>
      {message ? (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {siteConfig.name} {t("special.footer")}
        </p>
      )}
    </form>
  );
}
