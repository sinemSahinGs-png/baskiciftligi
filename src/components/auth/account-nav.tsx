"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileBox,
  FileText,
  House,
  MapPin,
  Package,
} from "lucide-react";

import { cn } from "@/lib/utils";

const accountLinks = [
  { href: "/hesabim", label: "Genel bakış", icon: House, exact: true },
  { href: "/hesabim/siparisler", label: "Siparişler", icon: Package },
  { href: "/hesabim/adresler", label: "Adresler", icon: MapPin },
  { href: "/hesabim/yuklemeler", label: "Yüklemeler", icon: FileBox },
  { href: "/hesabim/teklifler", label: "Teklifler", icon: FileText },
] as const;

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Hesap menüsü">
      <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {accountLinks.map(({ href, label, icon: Icon, ...item }) => {
          const active =
            "exact" in item && item.exact
              ? pathname === href
              : pathname.startsWith(href);

          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md px-4 text-sm font-semibold transition-colors",
                  active
                    ? "bg-cobalt text-light-text"
                    : "text-ink-secondary hover:bg-muted hover:text-ink",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
