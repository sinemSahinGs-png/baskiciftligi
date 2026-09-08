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
import { StoreMegaMenu, MobileStoreNav } from "@/components/site/store-mega-menu";
import { siteConfig } from "@/config/site";
import type { Category, Product } from "@/domain/catalog/types";
import type { StorefrontCategorySlug } from "@/domain/catalog/storefront-taxonomy";
import { announceStatus, foundryEase } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { selectCartCount, useCartStore } from "@/stores/cart-store";
import { useFavoritesStore } from "@/stores/favorites-store";

interface SiteHeaderProps {
  categories: Category[];
  products?: Product[];
  categoryArtwork: Record<StorefrontCategorySlug, string | null>;
}

export function SiteHeader({
  categories,
  products = [],
  categoryArtwork,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const darkShell = true;
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
  const [cartPulse, setCartPulse] = useState(false);
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

  const inverted = pathname === "/" && !scrolled && !searchOpen && !mobileOpen;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 isolate overflow-visible border-b transition-[background-color,border-color,color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          inverted
            ? "border-transparent bg-transparent text-light-text"
              : darkShell
                ? "border-white/10 bg-[#050708] text-light-text backdrop-blur-sm md:backdrop-blur-md"
                : "border-hairline bg-porcelain/92 text-ink backdrop-blur-sm md:backdrop-blur-md",
        )}
      >
        <div className="shell flex h-14 items-center gap-2 sm:h-16 md:gap-3">
          <Logo inverted={darkShell} className="mr-auto" />

          <nav aria-label="Ana menü" className="hidden h-full items-center gap-1 self-stretch lg:flex">
            <StoreMegaMenu inverted={inverted} categoryArtwork={categoryArtwork} />
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
              className="inline-flex size-11 items-center justify-center"
            >
              <UserRound aria-hidden="true" className="size-5" />
            </Link>
            <Link
              href={"/favoriler" as Route}
              aria-label={
                favoritesHydrated ? `Favoriler, ${favoriteCount}` : "Favoriler"
              }
              className="relative inline-flex size-11 items-center justify-center"
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
              className="inline-flex size-11 items-center justify-center lg:hidden"
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
          className="fixed inset-0 z-50 bg-midnight text-light-text lg:hidden"
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
              <MobileStoreNav
                categoryArtwork={categoryArtwork}
                onNavigate={() => setMobileOpen(false)}
              />
              {siteConfig.primaryNavigation
                .filter(
                  (item) =>
                    item.label !== "Mağaza" &&
                    item.label !== "Toptan & Bayiler",
                )
                .map((item) => (
                <li key={`${item.href}-${item.label}`} className="border-b border-hairline">
                  <Link
                    href={item.href as Route}
                    className="flex min-h-14 items-center justify-between font-heading text-[1.85rem] font-bold tracking-[-0.04em] sm:text-3xl"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                    <ArrowUpRight aria-hidden="true" className="size-5 text-muted-light" />
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
              <Link
                href={"/sepet" as Route}
                className="flex min-h-12 items-center justify-between rounded-md bg-white/8 px-4 text-sm font-semibold"
              >
                Sepet
                <span className="tabular text-muted-light">
                  {cartHydrated ? cartCount : "—"}
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
