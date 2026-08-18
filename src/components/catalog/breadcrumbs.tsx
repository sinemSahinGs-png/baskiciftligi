import type { Route } from "next";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: Route;
}

export function Breadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav aria-label="Sayfa yolu" className={cn("text-sm text-muted-foreground", className)}>
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link
            href={"/" as Route}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <Home aria-hidden="true" className="size-3.5" />
            <span className="sr-only sm:not-sr-only">Ana sayfa</span>
          </Link>
        </li>
        {items.map((item) => (
          <li
            key={`${item.href ?? "current"}-${item.label}`}
            className="flex items-center gap-2"
          >
            <ChevronRight
              aria-hidden="true"
              className="size-3.5 text-white/25"
            />
            {item.href ? (
              <Link
                href={item.href}
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-foreground">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
