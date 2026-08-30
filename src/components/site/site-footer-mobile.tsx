"use client";

import type { Route } from "next";
import Link from "next/link";
import { ChevronDown, Mail, Play, Truck } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/site/logo";
import { siteConfig } from "@/config/site";
import { homepageShopCategorySlugs } from "@/domain/home/homepage";
import { cn } from "@/lib/utils";

const storeCategoryLinks = [
  { slug: "ev-ve-dekorasyon", label: "Ev ve Dekorasyon" },
  { slug: "biblo-ve-heykel", label: "Biblo ve Heykel" },
  { slug: "anahtarlik", label: "Anahtarlık" },
  { slug: "magnet", label: "Magnet" },
  { slug: "masaustu-aksesuarlari", label: "Masaüstü Aksesuarları" },
  { slug: "kisiye-ozel-urunler", label: "Kişiye Özel Ürünler" },
  { slug: "fonksiyonel-parcalar", label: "Fonksiyonel Parçalar" },
  { slug: "kurumsal-promosyon", label: "Kurumsal Promosyon" },
] as const satisfies ReadonlyArray<{
  slug: (typeof homepageShopCategorySlugs)[number];
  label: string;
}>;

type FooterGroup = {
  id: string;
  label: string;
  links: Array<{ href: string; label: string }>;
};

const footerGroups: FooterGroup[] = [
  {
    id: "magaza",
    label: "Mağaza",
    links: [
      { href: "/magaza", label: "Tüm ürünler" },
      ...storeCategoryLinks.map((c) => ({
        href: `/magaza/${c.slug}`,
        label: c.label,
      })),
    ],
  },
  {
    id: "hizmetler",
    label: "Hizmetler",
    links: [
      { href: "/model-yukle", label: "Model yükle" },
      { href: "/hazir-modeller", label: "Hazır modeller" },
      { href: "/kurumsal-uretim", label: "Kurumsal üretim" },
      { href: "/malzemeler", label: "Malzemeler" },
      { href: "/hizmetler/3d-baski", label: "3D baskı" },
    ],
  },
  {
    id: "hesap",
    label: "Hesabım",
    links: [
      { href: "/hesabim", label: "Hesabım" },
      { href: "/favoriler", label: "Favoriler" },
      { href: "/sepet", label: "Sepet" },
      { href: "/hesabim/siparisler", label: "Siparişlerim" },
      { href: "/siparis-takip", label: "Sipariş takibi" },
    ],
  },
  {
    id: "yasal",
    label: "Yasal",
    links: [
      { href: "/yasal/kvkk", label: "KVKK" },
      { href: "/yasal/gizlilik", label: "Gizlilik" },
      { href: "/yasal/mesafeli-satis", label: "Mesafeli satış" },
      { href: "/yasal/iade", label: "İade" },
    ],
  },
];

function FooterAccordion({
  group,
  open,
  onToggle,
}: {
  group: FooterGroup;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = `footer-panel-${group.id}`;
  return (
    <div className="border-b border-white/10">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex min-h-12 w-full items-center justify-between py-3 text-left text-sm font-semibold"
      >
        {group.label}
        <ChevronDown
          aria-hidden="true"
          className={cn("size-4 transition", open && "rotate-180")}
        />
      </button>
      {open ? (
        <ul id={panelId} className="space-y-1 pb-3 text-sm text-muted-light">
          {group.links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href as Route}
                className="inline-flex min-h-11 items-center hover:text-light-text"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function SiteFooterMobile({
  description,
}: {
  description: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const hasContact = Boolean(siteConfig.contact.email || siteConfig.contact.phone);

  return (
    <div className="md:hidden" data-site-footer-mobile="">
      <div className="max-w-none px-4 py-8">
        <Logo inverted />
        <p className="mt-3 max-w-sm text-sm leading-6 text-muted-light">{description}</p>

        <div className="mt-5">
          {footerGroups.map((group) => (
            <FooterAccordion
              key={group.id}
              group={group}
              open={openId === group.id}
              onToggle={() =>
                setOpenId((current) => (current === group.id ? null : group.id))
              }
            />
          ))}
        </div>

        <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-muted-light">
          <Truck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-cyan" />
          Türkiye geneli teslimat. Süre, üretim ve kargo olarak ürün sayfasında görünür.
        </p>

        <fieldset disabled className="mt-4 flex flex-col gap-2">
          <label htmlFor="newsletter-email-mobile" className="sr-only">
            E-posta
          </label>
          <input
            id="newsletter-email-mobile"
            type="email"
            disabled
            readOnly
            placeholder="Bülten yakında"
            className="min-h-11 rounded-lg border border-white/20 bg-white/5 px-3 text-sm disabled:opacity-70"
          />
        </fieldset>

        {hasContact ? (
          <div className="mt-4 space-y-2 text-sm text-muted-light">
            {siteConfig.contact.email ? (
              <p className="flex items-center gap-2">
                <Mail aria-hidden="true" className="size-4 text-coral" />
                {siteConfig.contact.email}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-light">İletişim bilgileri yakında</p>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-muted-light">
          <p>
            © {new Date().getFullYear()} {siteConfig.legalName}
          </p>
          {siteConfig.social.youtube ? (
            <a href={siteConfig.social.youtube} aria-label="YouTube" className="inline-flex size-11 items-center justify-center">
              <Play aria-hidden="true" className="size-4" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
