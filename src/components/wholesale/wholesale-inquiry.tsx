import { Mail, Phone } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { siteConfig } from "@/config/site";

export function WholesaleInquiry() {
  const email = siteConfig.contact.email.trim();
  const phone = siteConfig.contact.phone.trim();
  const instagram = siteConfig.social.instagram.trim();
  const phoneHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;

  return (
    <main id="ana-icerik" className="mx-auto w-[min(40rem,calc(100%-1.5rem))] py-16">
      <p className="text-[0.65rem] font-bold tracking-[0.16em] text-[#8a5a22] uppercase">
        Toptan & bayiler
      </p>
      <h1 className="mt-3 font-heading text-4xl font-medium tracking-[-0.04em]">
        Toptan için bize ulaşın.
      </h1>
      <p className="mt-4 text-base leading-7 text-[#5c5a55]">
        Adet, bayi ve kurumsal üretim işleri teklifle ilerler. Fiyat listesi
        bu sayfada yoktur; ihtiyacını yaz, stüdyo dönüş yapsın.
      </p>

      <ul className="mt-10 grid gap-3">
        {email ? (
          <li>
            <a
              href={`mailto:${email}?subject=${encodeURIComponent("Toptan / bayi talebi")}`}
              className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#1b1c1a]/10 bg-white px-4 text-sm font-semibold"
            >
              <Mail className="size-4 shrink-0" aria-hidden="true" />
              {email}
            </a>
          </li>
        ) : null}
        {phoneHref ? (
          <li>
            <a
              href={phoneHref}
              className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#1b1c1a]/10 bg-white px-4 text-sm font-semibold"
            >
              <Phone className="size-4 shrink-0" aria-hidden="true" />
              {phone}
            </a>
          </li>
        ) : null}
        {instagram ? (
          <li>
            <a
              href={instagram}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#1b1c1a]/10 bg-white px-4 text-sm font-semibold"
            >
              Instagram
            </a>
          </li>
        ) : null}
        <li>
          <Link
            href={"/iletisim" as Route}
            className="flex min-h-14 items-center justify-center rounded-full bg-[#1b1c1a] px-5 text-sm font-bold text-[#f6f3ec]"
          >
            İletişim bilgileri
          </Link>
        </li>
      </ul>
    </main>
  );
}
