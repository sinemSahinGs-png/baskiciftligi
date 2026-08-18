"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useRef } from "react";
import { Search } from "lucide-react";

import { useScrollMotion } from "@/components/motion/scroll-motion-provider";
import { useSafeInView } from "@/components/motion/use-safe-in-view";
import { cn } from "@/lib/utils";

export function CatalogSearch({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const ref = useRef<HTMLFormElement>(null);
  const { ready, reduced } = useScrollMotion();
  const inView = useSafeInView(ref, { once: true, amount: 0.2 });
  const state = reduced || !ready ? "visible" : inView ? "visible" : "idle";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const query = String(form.get("q") ?? "").trim();
    const next = new URLSearchParams(searchParams.toString());
    if (query) {
      next.set("q", query);
    } else {
      next.delete("q");
    }
    next.delete("sayfa");
    const suffix = next.toString();
    router.push((suffix ? `${pathname}?${suffix}` : pathname) as Route);
  }

  return (
    <form
      ref={ref}
      onSubmit={submit}
      data-motion-state={state}
      className={cn("relative", className)}
    >
      <label htmlFor="catalog-search" className="sr-only">
        Ürün ara
      </label>
      <Search
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2",
          tone === "light" ? "text-white/65" : "text-ink-muted",
        )}
      />
      <input
        id="catalog-search"
        key={urlQuery}
        name="q"
        defaultValue={urlQuery}
        placeholder="Ürün, malzeme veya kullanım ara"
        className={cn(
          "motion-search h-14 w-full rounded-md border pr-4 pl-12 text-base outline-none",
          tone === "light"
            ? "border-white/20 bg-white/10 text-light-text placeholder:text-white/55"
            : "border-hairline bg-elevated text-dark-text placeholder:text-ink-muted",
        )}
      />
    </form>
  );
}
