"use client";

import type { Route } from "next";
import Link from "next/link";
import { ChevronDown, Mail, Play } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/site/logo";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type FooterGroup = {
  id: string;
  label: string;
  links: Array<{ href: string; label: string }>;
};

function useFooterGroups(): FooterGroup[] {
  const t = useTranslations();
  return [
    {
      id: "magaza",
      label: t("footer.store"),
      links: [
        { href: "/magaza", label: t("common.allProducts") },
        { href: "/model-yukle", label: t("common.upload") },
        { href: "/hazir-modeller", label: t("common.readyModels") },
      ],
    },
    {
      id: "yardim",
      label: t("common.help"),
      links: [
        { href: "/siparis-takip", label: t("common.track") },
        { href: "/hesabim", label: t("common.account") },
        { href: "/iletisim", label: t("common.contact") },
      ],
    },
    {
      id: "kurumsal",
      label: t("common.corporate"),
      links: [
        { href: "/toptan", label: t("common.wholesale") },
        { href: "/toptan/katalog", label: t("footer.wholesaleCatalog") },
        { href: "/kurumsal-uretim", label: t("footer.corporateProduction") },
        { href: "/malzemeler", label: t("common.materials") },
      ],
    },
    {
      id: "yasal",
      label: t("common.legal"),
      links: [
        { href: "/yasal/kvkk", label: t("common.kvkk") },
        { href: "/yasal/gizlilik", label: t("common.privacy") },
        { href: "/yasal/mesafeli-satis", label: t("common.distance") },
        { href: "/yasal/iade", label: t("common.returns") },
      ],
    },
  ];
}

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
  const footerGroups = useFooterGroups();
  const [openId, setOpenId] = useState<string | null>(null);
  const hasContact = Boolean(siteConfig.contact.email || siteConfig.contact.phone);

  return (
    <div className="md:hidden" data-site-footer-mobile="">
      <div className="max-w-none px-4 py-3">
        <Logo inverted />
        <p className="mt-2 max-w-sm text-sm leading-5 text-muted-light">{description}</p>

        <div className="mt-3">
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

        {hasContact ? (
          <div className="mt-4 space-y-2 text-sm text-muted-light">
            {siteConfig.contact.email ? (
              <p className="flex items-center gap-2">
                <Mail aria-hidden="true" className="size-4 text-coral" />
                {siteConfig.contact.email}
              </p>
            ) : null}
            {siteConfig.contact.phone ? (
              <p className="flex items-center gap-2">
                {siteConfig.contact.phone}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-muted-light">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}
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
