import type { Route } from "next";
import Link from "next/link";
import { AtSign, Mail, MapPin, Phone, Play, Truck } from "lucide-react";

import { FormSignal } from "@/components/brand/form-signal";
import { Logo } from "@/components/site/logo";
import { MotionScope } from "@/components/motion/motion-scope";
import { RevealCopy } from "@/components/motion/reveal-copy";
import { RevealWords } from "@/components/motion/reveal-words";
import { StaggerGrid } from "@/components/motion/stagger-grid";
import { siteConfig } from "@/config/site";
import { homepageShopCategorySlugs } from "@/domain/home/homepage";

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

export function SiteFooter() {
  const phoneHref = siteConfig.contact.phone
    ? `tel:${siteConfig.contact.phone.replace(/[^\d+]/g, "")}`
    : null;

  return (
    <footer className="relative overflow-hidden bg-deep-ink text-light-text">
      <div aria-hidden="true" className="grid-corner absolute inset-0 opacity-80" />
      <div className="shell relative py-12 sm:py-16">
        <div className="grid gap-12 border-b border-white/10 pb-12 lg:grid-cols-[1.1fr_1.9fr]">
          <div className="max-w-lg">
            <Logo inverted />
            <RevealWords
              as="p"
              text={siteConfig.footerHeading}
              className="mt-8 font-heading text-[clamp(1.85rem,3.6vw,2.85rem)] leading-[0.95] font-bold tracking-[-0.05em]"
            />
            <RevealCopy
              text={siteConfig.footerDescription}
              className="mt-5 max-w-md text-sm leading-7 text-muted-light"
            />
            <FormSignal spinning className="mt-6 size-10" />
          </div>
          <StaggerGrid className="grid gap-10 sm:grid-cols-2 xl:grid-cols-4">
            <nav aria-label="Mağaza" data-motion-item="idle" className="motion-item">
              <p className="text-sm font-semibold">Mağaza</p>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-light">
                <li>
                  <Link href={"/magaza" as Route} className="hover:text-light-text">
                    Tüm ürünler
                  </Link>
                </li>
                {storeCategoryLinks.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/magaza/${category.slug}` as Route}
                      className="hover:text-light-text"
                    >
                      {category.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="Hizmetler" data-motion-item="idle" className="motion-item">
              <p className="text-sm font-semibold">Hizmetler</p>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-light">
                <li>
                  <Link href={"/model-yukle" as Route} className="hover:text-light-text">
                    Model yükle
                  </Link>
                </li>
                <li>
                  <Link href={"/hazir-modeller" as Route} className="hover:text-light-text">
                    Hazır modeller
                  </Link>
                </li>
                <li>
                  <Link href={"/kurumsal-uretim" as Route} className="hover:text-light-text">
                    Kurumsal üretim
                  </Link>
                </li>
                <li>
                  <Link href={"/malzemeler" as Route} className="hover:text-light-text">
                    Malzemeler
                  </Link>
                </li>
                <li>
                  <Link href={"/hizmetler/3d-baski" as Route} className="hover:text-light-text">
                    3D baskı
                  </Link>
                </li>
              </ul>
            </nav>
            <nav aria-label="Hesap" data-motion-item="idle" className="motion-item">
              <p className="text-sm font-semibold">Hesap</p>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-light">
                <li>
                  <Link href={"/hesabim" as Route} className="hover:text-light-text">
                    Hesabım
                  </Link>
                </li>
                <li>
                  <Link href={"/favoriler" as Route} className="hover:text-light-text">
                    Favoriler
                  </Link>
                </li>
                <li>
                  <Link href={"/sepet" as Route} className="hover:text-light-text">
                    Sepet
                  </Link>
                </li>
                <li>
                  <Link href={"/hesabim/siparisler" as Route} className="hover:text-light-text">
                    Siparişlerim
                  </Link>
                </li>
                <li>
                  <Link href={"/siparis-takip" as Route} className="hover:text-light-text">
                    Sipariş takibi
                  </Link>
                </li>
              </ul>
            </nav>
            <nav aria-label="Yasal" data-motion-item="idle" className="motion-item">
              <p className="text-sm font-semibold">Yasal</p>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-light">
                <li>
                  <Link href={"/yasal/kvkk" as Route} className="hover:text-light-text">
                    KVKK
                  </Link>
                </li>
                <li>
                  <Link href={"/yasal/gizlilik" as Route} className="hover:text-light-text">
                    Gizlilik
                  </Link>
                </li>
                <li>
                  <Link href={"/yasal/mesafeli-satis" as Route} className="hover:text-light-text">
                    Mesafeli satış
                  </Link>
                </li>
                <li>
                  <Link href={"/yasal/iade" as Route} className="hover:text-light-text">
                    İade
                  </Link>
                </li>
              </ul>
            </nav>
          </StaggerGrid>
        </div>

        <div className="grid gap-6 border-b border-white/10 py-8 md:grid-cols-2">
          <p className="flex items-start gap-3 text-sm text-muted-light">
            <Truck aria-hidden="true" className="mt-0.5 size-4 text-cyan" />
            Türkiye geneli teslimat. Süre, üretim ve kargo olarak ürün sayfasında
            görünür. Ödeme altyapısı henüz bağlı değil.
          </p>
          <fieldset disabled className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">
              E-posta
            </label>
            <input
              id="newsletter-email"
              type="email"
              name="newsletter"
              autoComplete="off"
              disabled
              readOnly
              placeholder="Bülten yakında"
              suppressHydrationWarning
              className="h-11 flex-1 rounded-md border border-white/15 bg-white/5 px-4 text-sm text-light-text disabled:opacity-60"
            />
            <button
              type="button"
              className="h-11 rounded-md border border-white/15 px-4 text-sm font-semibold opacity-60"
            >
              Kayıt kapalı
            </button>
          </fieldset>
        </div>

        <div className="grid gap-6 py-8 text-sm md:grid-cols-3">
          <div className="flex items-start gap-3">
            <Mail aria-hidden="true" className="mt-0.5 size-4 text-coral" />
            <span>
              <span className="block text-xs text-muted-light">E-posta</span>
              <span className="mt-1 block font-medium">
                {siteConfig.contact.email || "Yayın öncesi yapılandırılacak"}
              </span>
            </span>
          </div>
          <div className="flex items-start gap-3">
            <Phone aria-hidden="true" className="mt-0.5 size-4 text-cyan" />
            <span>
              <span className="block text-xs text-muted-light">Telefon</span>
              {phoneHref ? (
                <a href={phoneHref} className="mt-1 block font-medium hover:underline">
                  {siteConfig.contact.phone}
                </a>
              ) : (
                <span className="mt-1 block font-medium">
                  Yayın öncesi yapılandırılacak
                </span>
              )}
            </span>
          </div>
          <div className="flex items-start gap-3">
            <MapPin aria-hidden="true" className="mt-0.5 size-4 text-orange" />
            <span>
              <span className="block text-xs text-muted-light">Stüdyo</span>
              <span className="mt-1 block font-medium">
                {siteConfig.city}, Türkiye
              </span>
            </span>
          </div>
        </div>

        <MotionScope className="flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-muted-light sm:flex-row sm:items-center sm:justify-between">
          <p data-motion-item="idle" className="motion-item">
            © {new Date().getFullYear()} {siteConfig.legalName}
          </p>
          <div className="flex gap-2">
            {siteConfig.social.instagram ? (
              <a
                href={siteConfig.social.instagram}
                aria-label={`${siteConfig.name} Instagram`}
                className="inline-flex size-11 items-center justify-center"
              >
                <AtSign aria-hidden="true" className="size-4" />
              </a>
            ) : null}
            {siteConfig.social.youtube ? (
              <a
                href={siteConfig.social.youtube}
                aria-label={`${siteConfig.name} YouTube`}
                className="inline-flex size-11 items-center justify-center"
              >
                <Play aria-hidden="true" className="size-4" />
              </a>
            ) : null}
          </div>
        </MotionScope>
      </div>
    </footer>
  );
}
