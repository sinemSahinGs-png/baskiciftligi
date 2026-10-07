import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";

import { Logo } from "@/components/site/logo";
import { siteConfig } from "@/config/site";

export default function WholesaleLayout({ children }: { children: ReactNode }) {
  const email = siteConfig.contact.email;
  const phone = siteConfig.contact.phone;

  return (
    <div className="min-h-screen bg-[#f6f3ec] text-[#1b1c1a]">
      <header className="ws-header border-b">
        <div className="mx-auto flex min-h-14 w-[min(72rem,calc(100%-1.5rem))] items-center justify-between gap-3 py-2">
          <Logo className="max-w-none" />
          <nav className="flex items-center gap-3 text-xs font-semibold">
            <Link href={"/siparis-takip" as Route} className="min-h-11 px-2 py-3">
              Sipariş takip
            </Link>
            <Link href={"/toptan/katalog" as Route} className="min-h-11 px-2 py-3">
              Katalog
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
            <Link href={"/yasal/gizlilik" as Route}>Gizlilik</Link>
            <Link href={"/yasal/kvkk" as Route}>KVKK</Link>
            <Link href={"/yasal/mesafeli-satis" as Route}>Mesafeli satış</Link>
            <Link href={"/yasal/iade" as Route}>İade / cayma</Link>
            {email ? <a href={`mailto:${email}`}>Destek</a> : null}
          </nav>
        </div>
      </footer>
    </div>
  );
}
