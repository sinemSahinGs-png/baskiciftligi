"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";

import { Logo } from "@/components/site/logo";
import { SearchOverlay } from "@/components/site/search-overlay";
import { SafeImage } from "@/components/media/safe-image";
import { siteConfig } from "@/config/site";
import type { Category, Product } from "@/domain/catalog/types";
import { homepageShopCategorySlugs } from "@/domain/home/homepage";
import { announceStatus, foundryEase } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { selectCartCount, useCartStore } from "@/stores/cart-store";
import { useFavoritesStore } from "@/stores/favorites-store";

interface SiteHeaderProps {
  categories: Category[];
  products?: Product[];
}

export function SiteHeader({ categories, products = [] }: SiteHeaderProps) {
  const pathname = usePathname();
  const darkShell =
    pathname === "/" ||
    pathname.startsWith("/hazir-modeller") ||
    pathname.startsWith("/model-yukle") ||
    pathname.startsWith("/kurumsal");
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState({ path: pathname, open: false });
  if (mobileMenu.path !== pathname) {
    setMobileMenu({ path: pathname, open: false });
  }
  const mobileOpen = mobileMenu.open;
  const setMobileOpen = (open: boolean | ((current: boolean) => boolean)) => {
    setMobileMenu((current) => ({
      path: pathname,
      open: typeof open === "function" ? open(current.open) : open,
    }));
  };
  const cartCount = useCartStore(selectCartCount);
  const cartHydrated = useCartStore((state) => state.hasHydrated);
  const favoriteCount = useFavoritesStore((state) => state.productIds.length);
  const favoritesHydrated = useFavoritesStore((state) => state.hasHydrated);
  const reduceMotion = useReducedMotion();
  const [megaOpen, setMegaOpen] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const megaTimer = useRef<number>(0);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousCartCount = useRef(cartCount);
  const cartReady = useRef(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 10);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    if (!cartHydrated) {
      return;
    }
    if (!cartReady.current) {
      cartReady.current = true;
      previousCartCount.current = cartCount;
      return;
    }
    if (cartCount > previousCartCount.current) {
      setCartPulse(true);
      announceStatus("Ürün sepete eklendi.");
      const timer = window.setTimeout(() => setCartPulse(false), 480);
      previousCartCount.current = cartCount;
      return () => window.clearTimeout(timer);
    }
    previousCartCount.current = cartCount;
  }, [cartCount, cartHydrated]);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  function openMega() {
    window.clearTimeout(megaTimer.current);
    setMegaOpen(true);
  }

  function closeMega() {
    window.clearTimeout(megaTimer.current);
    megaTimer.current = window.setTimeout(() => setMegaOpen(false), 120);
  }

  const shopCategories = homepageShopCategorySlugs
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter((category): category is Category => Boolean(category));

  const inverted = darkShell && !scrolled && !searchOpen && !mobileOpen;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b transition-[background-color,border-color,color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          inverted
            ? "border-transparent bg-transparent text-light-text"
              : darkShell
                ? "border-white/10 bg-midnight/82 text-light-text backdrop-blur-sm md:backdrop-blur-md"
                : "border-hairline bg-porcelain/92 text-ink backdrop-blur-sm md:backdrop-blur-md",
        )}
      >
        <div className="shell flex h-16 items-center gap-3 sm:h-[4.25rem]">
          <Logo inverted={darkShell} className="mr-auto" />

          <nav aria-label="Ana menü" className="hidden items-center gap-1 xl:flex">
            <Link
              href={"/magaza" as Route}
              data-active={pathname.startsWith("/magaza") ? "true" : undefined}
              className="nav-signal inline-flex min-h-11 items-center px-3 text-sm font-medium"
            >
              Mağaza
            </Link>
            <div
              className="relative"
              onMouseEnter={openMega}
              onMouseLeave={closeMega}
              onFocus={openMega}
              onBlur={(event) => {
                const next = event.relatedTarget;
                if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
                  closeMega();
                }
              }}
            >
              <button
                type="button"
                aria-expanded={megaOpen}
                aria-controls="category-mega-menu"
                className="nav-signal inline-flex min-h-11 items-center px-3 text-sm font-medium"
              >
                Kategoriler
              </button>
              <AnimatePresence>
                {megaOpen ? (
                  <m.div
                    id="category-mega-menu"
                    initial={
                      reduceMotion ? false : { opacity: 0.88, y: -10 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: -8 }
                    }
                    transition={{ duration: 0.28, ease: foundryEase }}
                    className="absolute top-full left-0 z-50 w-[min(52rem,calc(100vw-3rem))] pt-3"
                  >
                <div className="grid grid-cols-[1.4fr_0.8fr] gap-6 rounded-xl border border-white/10 bg-midnight p-5 text-light-text shadow-[0_24px_80px_rgb(7_7_19/0.45)]">
                  <div className="grid grid-cols-2 gap-3">
                    {shopCategories.slice(0, 6).map((category) => (
                      <Link
                        key={category.id}
                        href={`/magaza/${category.slug}` as Route}
                        className="group/item flex min-h-16 gap-3 rounded-lg p-2 hover:bg-white/8"
                      >
                        <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
                          <SafeImage
                            src={category.imageUrl}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </span>
                        <span className="min-w-0 self-center">
                          <span className="block text-sm font-semibold">
                            {category.name}
                          </span>
                          <span className="mt-0.5 line-clamp-1 block text-xs text-muted-light">
                            {category.eyebrow}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                  <div className="flex flex-col justify-between rounded-lg bg-cobalt p-5 text-light-text">
                    <div>
                      <p className="text-sm font-semibold">Koleksiyonlar</p>
                      <ul className="mt-3 space-y-2 text-sm">
                        <li>
                          <Link href={"/magaza" as Route} className="hover:underline">
                            Tüm ürünler
                          </Link>
                        </li>
                        <li>
                          <Link
                            href={"/magaza/yeni-gelenler" as Route}
                            className="hover:underline"
                          >
                            Yeni gelenler
                          </Link>
                        </li>
                        <li>
                          <Link
                            href={"/magaza?koleksiyon=cok-satanlar" as Route}
                            className="hover:underline"
                          >
                            Öne çıkanlar
                          </Link>
                        </li>
                        <li>
                          <Link
                            href={"/model-yukle" as Route}
                            className="hover:underline"
                          >
                            Özel baskı
                          </Link>
                        </li>
                      </ul>
                    </div>
                    <Link
                      href={"/model-yukle" as Route}
                      className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold"
                    >
                      Model yükle
                      <ArrowUpRight aria-hidden="true" className="size-4" />
                    </Link>
                  </div>
                </div>
                  </m.div>
                ) : null}
              </AnimatePresence>
            </div>
            {siteConfig.primaryNavigation.slice(1).map((item) => (
              <Link
                key={item.href}
                href={item.href as Route}
                data-active={pathname.startsWith(item.href) ? "true" : undefined}
                className="nav-signal inline-flex min-h-11 items-center px-3 text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center">
            <button
              type="button"
              aria-label="Ara"
              onClick={() => setSearchOpen(true)}
              className="inline-flex size-11 items-center justify-center"
            >
              <Search aria-hidden="true" className="size-5" />
            </button>
            <Link
              href={"/hesabim" as Route}
              aria-label="Hesabım"
              className="hidden size-11 items-center justify-center lg:inline-flex"
            >
              <UserRound aria-hidden="true" className="size-5" />
            </Link>
            <Link
              href={"/favoriler" as Route}
              aria-label={
                favoritesHydrated ? `Favoriler, ${favoriteCount}` : "Favoriler"
              }
              className="relative hidden size-11 items-center justify-center lg:inline-flex"
            >
              <Heart aria-hidden="true" className="size-5" />
            </Link>
            <Link
              href={"/sepet" as Route}
              aria-label={cartHydrated ? `Sepet, ${cartCount}` : "Sepet"}
              className="relative inline-flex size-11 items-center justify-center"
            >
              <ShoppingBag aria-hidden="true" className="size-5" />
              {cartHydrated && cartCount > 0 ? (
                <span
                  className={cn(
                    "tabular absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-coral px-1 text-[0.7rem] leading-4 font-bold text-light-text",
                    cartPulse && reduceMotion === false && "cart-badge-pulse",
                  )}
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </Link>
            <button
              ref={menuButtonRef}
              type="button"
              aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((open) => !open)}
              className="inline-flex size-11 items-center justify-center xl:hidden"
            >
              {mobileOpen ? (
                <X aria-hidden="true" className="size-5" />
              ) : (
                <Menu aria-hidden="true" className="size-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen ? (
        <m.div
          initial={reduceMotion ? false : { opacity: 0.92, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
          transition={{ duration: 0.32, ease: foundryEase }}
          className="fixed inset-0 z-50 bg-midnight text-light-text xl:hidden"
        >
          <div className="shell flex h-16 items-center justify-between">
            <Logo inverted />
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Menüyü kapat"
              onClick={() => {
                setMobileOpen(false);
                menuButtonRef.current?.focus();
              }}
              className="inline-flex size-11 items-center justify-center"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          <nav aria-label="Mobil menü" className="shell overflow-y-auto pb-16">
            <ul>
              {siteConfig.navigation.map((item) => (
                <li key={`${item.href}-${item.label}`} className="border-b border-hairline">
                  <Link
                    href={item.href as Route}
                    className="flex min-h-14 items-center justify-between font-heading text-[1.85rem] font-bold tracking-[-0.04em] sm:text-3xl"
                  >
                    {item.label}
                    <ArrowUpRight aria-hidden="true" className="size-5 text-muted-light" />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm font-semibold text-muted-light">
              Kategoriler
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {shopCategories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/magaza/${category.slug}` as Route}
                className="flex min-h-12 items-center rounded-md border border-white/15 px-3 text-sm font-medium"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8 grid gap-2">
              <Link
                href={"/hesabim" as Route}
                className="flex min-h-12 items-center rounded-md bg-cobalt px-4 text-sm font-bold"
              >
                Hesabım
              </Link>
              <Link
                href={"/favoriler" as Route}
                className="flex min-h-12 items-center justify-between rounded-md bg-white/8 px-4 text-sm font-semibold"
              >
                Favoriler
                <span className="tabular text-muted-light">
                  {favoritesHydrated ? favoriteCount : "—"}
                </span>
              </Link>
            </div>
          </nav>
        </m.div>
        ) : null}
      </AnimatePresence>

      <SearchOverlay
        open={searchOpen}
        onOpenChange={setSearchOpen}
        categories={categories}
        products={products}
      />
    </>
  );
}
