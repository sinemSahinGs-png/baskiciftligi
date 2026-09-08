import type { Route } from "next";
import Link from "next/link";
import { AtSign, Mail, MapPin, Phone, Play } from "lucide-react";

import { Logo } from "@/components/site/logo";
import { SiteFooterMobile } from "@/components/site/site-footer-mobile";
import { siteConfig } from "@/config/site";

export function SiteFooter({
  heading,
  description,
}: {
  heading?: string;
  description?: string;
} = {}) {
  const phoneHref = siteConfig.contact.phone
    ? `tel:${siteConfig.contact.phone.replace(/[^\d+]/g, "")}`
    : null;
  const footerHeading = heading ?? siteConfig.footerHeading;
  const footerDescription = description ?? siteConfig.footerDescription;

  return (
    <footer data-site-footer className="relative bg-deep-ink text-light-text">
      <SiteFooterMobile description={footerDescription} />

      <div className="shell relative hidden py-6 md:block">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <Logo inverted />
          <p className="max-w-sm text-sm font-semibold leading-6">{footerHeading}</p>
        </div>
        <div className="mt-5 grid gap-6 lg:grid-cols-4">
          <div className="max-w-xs">
            <p className="max-w-xs text-sm leading-6 text-muted-light">{footerDescription}</p>
            <div className="mt-3 space-y-1.5 text-sm text-muted-light">
              {siteConfig.contact.email ? (
                <p className="flex items-center gap-2">
                  <Mail aria-hidden="true" className="size-3.5 text-coral" />
                  {siteConfig.contact.email}
                </p>
              ) : null}
              {phoneHref ? (
                <p className="flex items-center gap-2">
                  <Phone aria-hidden="true" className="size-3.5 text-cyan" />
                  <a href={phoneHref} className="hover:text-light-text">
                    {siteConfig.contact.phone}
                  </a>
                </p>
              ) : null}
              <p className="flex items-center gap-2">
                <MapPin aria-hidden="true" className="size-3.5 text-orange" />
                {siteConfig.city}, Türkiye
              </p>
            </div>
          </div>
          <nav aria-label="Mağaza">
            <p className="text-sm font-semibold">Mağaza</p>
            <ul className="mt-2 space-y-0.5 text-sm text-muted-light">
              <li>
                <Link href={"/magaza" as Route} className="inline-flex min-h-8 items-center hover:text-light-text">
                  Tüm ürünler
                </Link>
              </li>
              <li>
                <Link href={"/model-yukle" as Route} className="inline-flex min-h-8 items-center hover:text-light-text">
                  Model yükle
                </Link>
              </li>
              <li>
                <Link href={"/hazir-modeller" as Route} className="inline-flex min-h-8 items-center hover:text-light-text">
                  Hazır modeller
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-label="Yardım">
            <p className="text-sm font-semibold">Yardım</p>
            <ul className="mt-2 space-y-0.5 text-sm text-muted-light">
              <li>
                <Link href={"/siparis-takip" as Route} className="inline-flex min-h-8 items-center hover:text-light-text">
                  Sipariş takibi
                </Link>
              </li>
              <li>
                <Link href={"/hesabim" as Route} className="inline-flex min-h-8 items-center hover:text-light-text">
                  Hesabım
                </Link>
              </li>
              <li>
                <Link href={"/iletisim" as Route} className="inline-flex min-h-8 items-center hover:text-light-text">
                  İletişim
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-label="Kurumsal">
            <p className="text-sm font-semibold">Kurumsal</p>
            <ul className="mt-2 space-y-0.5 text-sm text-muted-light">
              <li>
                <Link href={"/toptan" as Route} className="inline-flex min-h-8 items-center hover:text-light-text">
                  Toptan & Bayiler
                </Link>
              </li>
              <li>
                <Link href={"/kurumsal-uretim" as Route} className="inline-flex min-h-8 items-center hover:text-light-text">
                  Kurumsal üretim
                </Link>
              </li>
              <li>
                <Link href={"/malzemeler" as Route} className="inline-flex min-h-8 items-center hover:text-light-text">
                  Malzemeler
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-4 text-xs text-muted-light sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.legalName}
          </p>
          <nav aria-label="Yasal" className="flex flex-wrap gap-x-3 gap-y-1">
            <Link href={"/yasal/kvkk" as Route} className="hover:text-light-text">
              KVKK
            </Link>
            <Link href={"/yasal/gizlilik" as Route} className="hover:text-light-text">
              Gizlilik
            </Link>
            <Link href={"/yasal/mesafeli-satis" as Route} className="hover:text-light-text">
              Mesafeli satış
            </Link>
            <Link href={"/yasal/iade" as Route} className="hover:text-light-text">
              İade
            </Link>
          </nav>
          <div className="flex gap-1">
            {siteConfig.social.instagram ? (
              <a
                href={siteConfig.social.instagram}
                aria-label={`${siteConfig.name} Instagram`}
                className="inline-flex size-9 items-center justify-center"
              >
                <AtSign aria-hidden="true" className="size-4" />
              </a>
            ) : null}
            {siteConfig.social.youtube ? (
              <a
                href={siteConfig.social.youtube}
                aria-label={`${siteConfig.name} YouTube`}
                className="inline-flex size-9 items-center justify-center"
              >
                <Play aria-hidden="true" className="size-4" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
