import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";

import { LanguageSwitcher } from "@/components/site/language-switcher";
import { Logo } from "@/components/site/logo";
import { siteConfig } from "@/config/site";
import { getMessages, msg } from "@/i18n/get-messages";
import { getRequestLocale } from "@/i18n/request-locale";

export default async function WholesaleLayout({ children }: { children: ReactNode }) {
  const messages = getMessages(await getRequestLocale());
  const email = siteConfig.contact.email;
  const phone = siteConfig.contact.phone;

  return (
    <div className="min-h-screen bg-[#f6f3ec] text-[#1b1c1a]">
      <header className="ws-header border-b">
        <div className="mx-auto flex min-h-14 w-[min(72rem,calc(100%-1.5rem))] items-center justify-between gap-3 py-2">
          <Logo className="max-w-none" />
          <nav className="flex items-center gap-3 text-xs font-semibold">
            <LanguageSwitcher />
            <Link href={"/siparis-takip" as Route} className="min-h-11 px-2 py-3">
              {msg(messages, "wholesale.track")}
            </Link>
            <Link href={"/toptan/katalog" as Route} className="min-h-11 px-2 py-3">
              {msg(messages, "wholesale.catalog")}
            </Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="ws-footer mt-8 border-t py-8 text-sm">
        <div className="mx-auto w-[min(72rem,calc(100%-1.5rem))] space-y-3">
          <p className="font-heading text-base">{siteConfig.name}</p>
          <p className="text-[color:var(--ws-muted,#5c5a55)]">
            {siteConfig.legalName}
            {siteConfig.city ? ` · ${siteConfig.city}` : ""}
            {email ? ` · ${email}` : ""}
            {phone ? ` · ${phone}` : ""}
          </p>
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold">
            <Link href={"/yasal/gizlilik" as Route}>{msg(messages, "common.privacy")}</Link>
            <Link href={"/yasal/kvkk" as Route}>{msg(messages, "common.kvkk")}</Link>
            <Link href={"/yasal/mesafeli-satis" as Route}>{msg(messages, "common.distance")}</Link>
            <Link href={"/yasal/iade" as Route}>{msg(messages, "common.returns")}</Link>
            {email ? <a href={`mailto:${email}`}>{msg(messages, "common.support")}</a> : null}
          </nav>
        </div>
      </footer>
    </div>
  );
}
