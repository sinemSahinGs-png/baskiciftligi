import type { Route } from "next";
import Link from "next/link";
import { AtSign, Mail, Phone, Play } from "lucide-react";

import { Logo } from "@/components/site/logo";
import { SiteFooterMobile } from "@/components/site/site-footer-mobile";
import { siteConfig } from "@/config/site";
import { getMessages, msg } from "@/i18n/get-messages";
import { getRequestLocale } from "@/i18n/request-locale";

export async function SiteFooter({
  heading,
  description,
}: {
  heading?: string;
  description?: string;
} = {}) {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const phoneHref = siteConfig.contact.phone
    ? `tel:${siteConfig.contact.phone.replace(/[^\d+]/g, "")}`
    : null;
  const footerHeading = heading && locale === "tr" ? heading : msg(messages, "footer.heading");
  const footerDescription =
    description && locale === "tr" ? description : msg(messages, "footer.description");

  return (
    <footer data-site-footer className="site-footer-brand octo-abyss-floor relative bg-deep-ink text-light-text">
      <div className="octo-footer-scene">
        <img
          src="/images/home-industrial/footer-sand-panel.jpg"
          alt=""
          className="octo-footer-scene-photo"
        />
      <SiteFooterMobile description={footerDescription} />

      <div className="octo-footer-panel hidden md:block">
        <div className="octo-footer-top">
          <Logo inverted />
          <p className="octo-footer-heading">{footerHeading}</p>
        </div>
        <div className="octo-footer-grid">
          <div className="octo-footer-blurb">
            <p className="octo-footer-copy">{footerDescription}</p>
            {siteConfig.contact.email || siteConfig.contact.phone ? (
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
            </div>
            ) : null}
          </div>
          <nav aria-label={msg(messages, "footer.store")}>
            <p className="octo-footer-nav-title">{msg(messages, "footer.store")}</p>
            <ul className="octo-footer-links">
              <li>
                <Link href={"/magaza" as Route} className="inline-flex min-h-8 items-center hover:text-light-text">
                  {msg(messages, "common.allProducts")}
                </Link>
              </li>
              <li>
                <Link href={"/model-yukle" as Route} className="inline-flex min-h-8 items-center hover:text-light-text">
                  {msg(messages, "common.upload")}
                </Link>
              </li>
              <li>
                <Link href={"/hazir-modeller" as Route} className="inline-flex min-h-8 items-center hover:text-light-text">
                  {msg(messages, "common.readyModels")}
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-label={msg(messages, "common.help")}>
            <p className="octo-footer-nav-title">{msg(messages, "common.help")}</p>
            <ul className="octo-footer-links">
              <li>
                <Link href={"/siparis-takip" as Route} className="inline-flex min-h-8 items-center hover:text-light-text">
                  {msg(messages, "common.track")}
                </Link>
              </li>
              <li>
                <Link href={"/hesabim" as Route} className="inline-flex min-h-8 items-center hover:text-light-text">
                  {msg(messages, "common.account")}
                </Link>
              </li>
              <li>
                <Link href={"/iletisim" as Route} className="inline-flex min-h-8 items-center hover:text-light-text">
                  {msg(messages, "common.contact")}
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-label={msg(messages, "common.corporate")}>
            <p className="octo-footer-nav-title">{msg(messages, "common.corporate")}</p>
            <ul className="octo-footer-links">
              <li>
                <Link href={"/toptan" as Route} className="inline-flex min-h-8 items-center hover:text-light-text">
                  {msg(messages, "common.wholesale")}
                </Link>
              </li>
              <li>
                <Link href={"/kurumsal-uretim" as Route} className="inline-flex min-h-8 items-center hover:text-light-text">
                  {msg(messages, "footer.corporateProduction")}
                </Link>
              </li>
              <li>
                <Link href={"/malzemeler" as Route} className="inline-flex min-h-8 items-center hover:text-light-text">
                  {msg(messages, "common.materials")}
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="octo-footer-legal">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}
          </p>
          <nav aria-label={msg(messages, "common.legal")} className="flex flex-wrap gap-x-3 gap-y-1">
            <Link href={"/yasal/kvkk" as Route} className="hover:text-light-text">
              {msg(messages, "common.kvkk")}
            </Link>
            <Link href={"/yasal/gizlilik" as Route} className="hover:text-light-text">
              {msg(messages, "common.privacy")}
            </Link>
            <Link href={"/yasal/mesafeli-satis" as Route} className="hover:text-light-text">
              {msg(messages, "common.distance")}
            </Link>
            <Link href={"/yasal/iade" as Route} className="hover:text-light-text">
              {msg(messages, "common.returns")}
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
      </div>
    </footer>
  );
}
