import type { Route } from "next";
import Link from "next/link";
import { AtSign, Mail, MapPin, Phone, Play, Truck } from "lucide-react";

import { Logo } from "@/components/site/logo";
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
    <footer
      data-site-footer
      className="relative bg-deep-ink text-light-text"
    >
      <div aria-hidden="true" className="grid-corner pointer-events-none absolute inset-0 opacity-70" />
      <div className="shell relative py-10 sm:py-12">
        <div className="grid gap-8 border-b border-white/10 pb-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)]">
          <div className="max-w-lg">
            <Logo inverted />
            <p className="mt-6 font-heading text-[clamp(1.55rem,3.2vw,2.35rem)] leading-[1.05] font-bold tracking-[-0.04em]">
              {footerHeading}
            </p>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-light">
              {footerDescription}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-4">
            <nav aria-label="Mağaza">
              <p className="text-sm font-semibold">Mağaza</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-light">
                <li>
                  <Link href={"/magaza" as Route} className="inline-flex min-h-11 items-center hover:text-light-text">
                    Tüm ürünler
                  </Link>
                </li>
                {storeCategoryLinks.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/magaza/${category.slug}` as Route}
                      className="inline-flex min-h-11 items-center hover:text-light-text"
                    >
                      {category.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="Hizmetler">
              <p className="text-sm font-semibold">Hizmetler</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-light">
                <li>
                  <Link href={"/model-yukle" as Route} className="inline-flex min-h-11 items-center hover:text-light-text">
                    Model yükle
                  </Link>
                </li>
                <li>
                  <Link href={"/hazir-modeller" as Route} className="inline-flex min-h-11 items-center hover:text-light-text">
                    Hazır modeller
                  </Link>
                </li>
                <li>
                  <Link href={"/kurumsal-uretim" as Route} className="inline-flex min-h-11 items-center hover:text-light-text">
                    Kurumsal üretim
                  </Link>
                </li>
                <li>
                  <Link href={"/malzemeler" as Route} className="inline-flex min-h-11 items-center hover:text-light-text">
                    Malzemeler
                  </Link>
                </li>
                <li>
                  <Link href={"/hizmetler/3d-baski" as Route} className="inline-flex min-h-11 items-center hover:text-light-text">
                    3D baskı
                  </Link>
                </li>
              </ul>
            </nav>
            <nav aria-label="Hesap">
              <p className="text-sm font-semibold">Hesap</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-light">
                <li>
                  <Link href={"/hesabim" as Route} className="inline-flex min-h-11 items-center hover:text-light-text">
                    Hesabım
                  </Link>
                </li>
                <li>
                  <Link href={"/favoriler" as Route} className="inline-flex min-h-11 items-center hover:text-light-text">
                    Favoriler
                  </Link>
                </li>
                <li>
                  <Link href={"/sepet" as Route} className="inline-flex min-h-11 items-center hover:text-light-text">
                    Sepet
                  </Link>
                </li>
                <li>
                  <Link href={"/hesabim/siparisler" as Route} className="inline-flex min-h-11 items-center hover:text-light-text">
                    Siparişlerim
                  </Link>
                </li>
                <li>
                  <Link href={"/siparis-takip" as Route} className="inline-flex min-h-11 items-center hover:text-light-text">
                    Sipariş takibi
                  </Link>
                </li>
              </ul>
            </nav>
            <nav aria-label="Yasal">
              <p className="text-sm font-semibold">Yasal</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-light">
                <li>
                  <Link href={"/yasal/kvkk" as Route} className="inline-flex min-h-11 items-center hover:text-light-text">
                    KVKK
                  </Link>
                </li>
                <li>
                  <Link href={"/yasal/gizlilik" as Route} className="inline-flex min-h-11 items-center hover:text-light-text">
                    Gizlilik
                  </Link>
                </li>
                <li>
                  <Link href={"/yasal/mesafeli-satis" as Route} className="inline-flex min-h-11 items-center hover:text-light-text">
                    Mesafeli satış
                  </Link>
                </li>
                <li>
                  <Link href={"/yasal/iade" as Route} className="inline-flex min-h-11 items-center hover:text-light-text">
                    İade
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="grid gap-4 border-b border-white/10 py-6 md:grid-cols-2">
          <p className="flex items-start gap-3 text-sm text-muted-light">
            <Truck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-cyan" />
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
              className="h-11 flex-1 rounded-md border border-white/25 bg-white/8 px-4 text-sm text-light-text disabled:opacity-70"
            />
            <button
              type="button"
              className="h-11 rounded-md border border-white/25 px-4 text-sm font-semibold text-light-text/80"
            >
              Kayıt kapalı
            </button>
          </fieldset>
        </div>

        <div className="grid gap-4 py-6 text-sm sm:grid-cols-2 md:grid-cols-3">
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

        <div className="flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-muted-light sm:flex-row sm:items-center sm:justify-between">
          <p>
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
        </div>
      </div>
    </footer>
  );
}
