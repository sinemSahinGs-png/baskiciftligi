"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, ShoppingBag, Store, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { selectCartCount, useCartStore } from "@/stores/cart-store";

const items = [
  { href: "/", label: "Ana Sayfa", icon: Home, match: (path: string) => path === "/" },
  {
    href: "/magaza",
    label: "Mağaza",
    icon: Store,
    match: (path: string) => path.startsWith("/magaza") || path.startsWith("/urun"),
  },
  {
    href: "/favoriler",
    label: "Favoriler",
    icon: Heart,
    match: (path: string) => path.startsWith("/favoriler"),
  },
  {
    href: "/sepet",
    label: "Sepet",
    icon: ShoppingBag,
    match: (path: string) => path.startsWith("/sepet"),
  },
  {
    href: "/hesabim",
    label: "Hesabım",
    icon: UserRound,
    match: (path: string) => path.startsWith("/hesabim"),
  },
] as const;

export function StoreBottomNav() {
  const pathname = usePathname();
  const cartCount = useCartStore(selectCartCount);
  const cartHydrated = useCartStore((state) => state.hasHydrated);

  if (
    pathname.startsWith("/odeme") ||
    pathname.startsWith("/model-yukle") ||
    pathname.startsWith("/urun") ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  return (
    <nav aria-label="Mobil mağaza menüsü" className="store-bottom-nav md:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href as Route}
            data-active={active ? "true" : undefined}
            className="relative"
          >
            <Icon aria-hidden="true" className="size-5" />
            <span>{item.label}</span>
            {item.href === "/sepet" && cartHydrated && cartCount > 0 ? (
              <span className="store-nav-count">{cartCount > 99 ? "99+" : cartCount}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function storefrontMainClass(className?: string) {
  return cn("store-page", className);
}
