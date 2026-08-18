import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main
      id="ana-icerik"
      className="shell flex min-h-[75vh] items-center justify-center py-24"
    >
      <div className="relative max-w-2xl text-center">
        <span
          aria-hidden="true"
          className="absolute inset-x-0 -top-16 font-heading text-[8rem] leading-none text-cobalt/20 sm:text-[12rem]"
        >
          404
        </span>
        <div className="relative">
          <p className="text-sm text-ink-secondary">Sayfa bulunamadı</p>
          <h1 className="mt-5 font-heading text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
            Aradığınız yüzey burada değil.
          </h1>
          <p className="mx-auto mt-5 max-w-lg leading-7 text-ink-secondary">
            Bağlantı değişmiş veya içerik yayından kaldırılmış olabilir. Mağazaya
            dönebilir ya da arama yapabilirsiniz.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className={cn(buttonVariants(), "gap-2")}>
              <ArrowLeft aria-hidden="true" />
              Ana sayfaya dön
            </Link>
            <Link
              href="/arama"
              className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
            >
              <Search aria-hidden="true" />
              Mağazada ara
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
