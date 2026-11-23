"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  CircleDot,
  ChartNoAxesCombined,
  ChevronRight,
  GalleryVerticalEnd,
  Package,
  ShoppingBag,
  Store,
  Tags,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navigationGroups = [
  {
    label: "Mağaza",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: ChartNoAxesCombined,
        exact: true,
      },
      { href: "/admin/siparisler", label: "Siparişler", icon: Package },
      { href: "/admin/urunler", label: "Ürünler", icon: ShoppingBag },
      { href: "/admin/trendyol", label: "Trendyol", icon: Store },
      { href: "/admin/kategoriler", label: "Kategoriler", icon: Tags },
      { href: "/admin/lil-disc", label: "LIL’ DISC", icon: CircleDot },
      { href: "/admin/icerik", label: "İçerik", icon: GalleryVerticalEnd },
    ],
  },
] as const;

const lilDiscNav = [
  {
    label: "LIL’ DISC",
    items: [
      {
        href: "/admin",
        label: "Günlük siparişler",
        icon: ChartNoAxesCombined,
        exact: true,
      },
      { href: "/admin/lil-disc", label: "Albümler", icon: ShoppingBag },
      { href: "/admin/siparisler", label: "Siparişler", icon: Package },
    ],
  },
] as const;

export function AdminNav({ scope = "full" }: { scope?: "full" | "lil_disc" }) {
  const pathname = usePathname();
  const groups = scope === "lil_disc" ? lilDiscNav : navigationGroups;

  return (
    <nav aria-label="Yönetim menüsü" className="space-y-7">
      {groups.map((group) => (
        <section key={group.label}>
          <h2 className="mb-2 px-3 text-[0.65rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">
            {group.label}
          </h2>
          <ul className="space-y-1">
            {group.items.map(({ href, label, icon: Icon, ...item }) => {
              const active =
                "exact" in item && item.exact
                  ? pathname === href
                  : pathname.startsWith(href);

              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors",
                      active
                        ? "bg-cyan text-ink"
                        : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    <span className="flex-1">{label}</span>
                    <ChevronRight
                      className={cn(
                        "size-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100",
                        active && "opacity-70",
                      )}
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}

export function AdminMark() {
  return (
    <span className="grid size-10 place-items-center rounded-2xl border border-cyan/30 bg-cyan/10 text-cyan">
      <Boxes className="size-5" aria-hidden="true" />
    </span>
  );
}
