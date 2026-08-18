import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { Logo } from "@/components/site/logo";
import { SiteFooter } from "@/components/site/site-footer";
import { siteConfig } from "@/config/site";

const assurances = [
  "Sipariş ve teklif tek hesapta",
  "Parola uygulama sunucusunda tutulmaz",
  "Özel üretim dosyaları henüz yüklenmez",
] as const;

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-porcelain text-dark-text">
      <header className="border-b border-hairline bg-optical">
        <div className="shell flex h-16 items-center justify-between">
          <Logo />
          <Link href="/" className="text-sm font-medium hover:underline">
            Mağazaya dön
          </Link>
        </div>
      </header>
      <main
        id="ana-icerik"
        className="shell grid items-start gap-12 py-10 lg:grid-cols-2 lg:items-center lg:py-12"
      >
        <section className="relative hidden max-w-lg overflow-hidden rounded-xl bg-midnight p-8 text-light-text lg:block">
          <p className="text-sm text-cyan">{siteConfig.tagline}</p>
          <h2 className="mt-4 font-heading text-5xl leading-[0.95] font-bold tracking-[-0.05em]">
            Üretim sürecin, net bir hesapta.
          </h2>
          <ul className="mt-8 space-y-3">
            {assurances.map((assurance) => (
              <li key={assurance} className="flex items-center gap-3 text-sm">
                <ShieldCheck aria-hidden="true" className="size-4 text-lime" />
                {assurance}
              </li>
            ))}
          </ul>
        </section>
        <section className="flex justify-center lg:justify-end">{children}</section>
      </main>
      <SiteFooter />
    </div>
  );
}
