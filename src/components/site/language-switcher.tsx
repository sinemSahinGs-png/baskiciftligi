"use client";

import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { localeMeta, localePath, locales, type AppLocale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ inverted }: { inverted?: boolean }) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("common");
  const pathname = usePathname() || "/";
  const [pending, setPending] = useState(false);

  async function select(next: AppLocale) {
    if (next === locale || pending) return;
    setPending(true);
    const search = typeof window === "undefined" ? "" : window.location.search;
    const href = localePath(next, pathname, search);
    try {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
    } catch {
      /* cookie is also set on the prefixed navigation */
    }
    window.location.assign(href);
  }

  return (
    <div
      className="flex max-w-[7.5rem] shrink-0 items-center gap-0.5 rounded-md border border-white/15 p-0.5 sm:max-w-none"
      role="group"
      aria-label={t("language")}
    >
      {locales.map((code) => (
        <button
          key={code}
          type="button"
          lang={localeMeta[code].html}
          disabled={pending}
          aria-pressed={code === locale}
          onClick={() => void select(code)}
          className={cn(
            "min-h-8 min-w-8 rounded px-1.5 text-[0.7rem] font-bold tracking-wide",
            code === locale
              ? inverted
                ? "bg-white text-midnight"
                : "bg-coral text-midnight"
              : "text-current opacity-70 hover:opacity-100",
          )}
        >
          {localeMeta[code].label}
        </button>
      ))}
    </div>
  );
}
