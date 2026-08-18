import type { Metadata } from "next";
import Link from "next/link";
import { Search, SearchX, Sparkles } from "lucide-react";

import { siteConfig } from "@/config/site";
import { CatalogGrid } from "@/components/catalog/catalog-grid";
import { listProducts } from "@/domain/catalog/repository";

function normalizeQuery(value: string | string[] | undefined) {
  const firstValue = Array.isArray(value) ? value[0] : value;
  return firstValue?.trim().slice(0, 80) ?? "";
}

export async function generateMetadata(
  props: PageProps<"/arama">,
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const query = normalizeQuery(searchParams.q);

  return {
    title: query ? `“${query}” için arama` : "Arama",
    description: query
      ? `${siteConfig.name} kataloğunda “${query}” arama sonuçları.`
      : `${siteConfig.name} ürün kataloğunda arama yapın.`,
    alternates: { canonical: "/arama" },
    robots: query
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

export default async function SearchPage(props: PageProps<"/arama">) {
  const searchParams = await props.searchParams;
  const query = normalizeQuery(searchParams.q);
  const products = query ? await listProducts({ query, limit: 40 }) : [];

  return (
    <main id="ana-icerik" className="shell min-h-[70vh] py-12 sm:py-20">
      <header className="max-w-3xl">
        <p className="text-sm text-ink-secondary">Katalog araması</p>
        <h1 className="mt-5 font-heading text-5xl font-bold tracking-[-0.04em] sm:text-6xl">
          Aradığın tasarımı bul.
        </h1>
        <p className="body-large mt-5">
          Ürün adı, kullanım alanı veya tasarım özelliğiyle ara.
        </p>
      </header>

      <form
        action="/arama"
        method="get"
        role="search"
        aria-label="Ürün ara"
        className="glass mt-9 flex gap-2 rounded-2xl p-2"
      >
        <label htmlFor="site-search" className="sr-only">
          Arama ifadesi
        </label>
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="site-search"
            name="q"
            type="search"
            required
            maxLength={80}
            defaultValue={query}
            autoComplete="off"
            placeholder="Örn. masaüstü düzenleyici"
            className="h-12 w-full rounded-xl border-0 bg-transparent pr-4 pl-12 text-base outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-md bg-cobalt px-5 text-sm font-semibold text-light-text"
        >
          <span className="hidden sm:inline">Ürünlerde ara</span>
          <Search aria-hidden="true" className="size-4 sm:hidden" />
        </button>
      </form>

      <section aria-labelledby="search-results-heading" className="mt-12">
        {query ? (
          <>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <span className="eyebrow">Sonuçlar</span>
                <h2
                  id="search-results-heading"
                  className="mt-3 text-3xl font-semibold"
                >
                  “{query}”
                </h2>
              </div>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {products.length} eşleşme
              </p>
            </div>

            {products.length > 0 ? (
              <CatalogGrid products={products} priorityCount={3} />
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-hairline bg-optical px-6 py-12 text-center">
                <SearchX aria-hidden="true" className="size-9 text-cobalt" />
                <h3 className="mt-5 text-2xl font-semibold">
                  Sonuç bulunamadı
                </h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                  Daha kısa veya genel bir ifade dene. İstersen tüm kataloğa
                  dönüp kategoriler arasında gezinebilirsin.
                </p>
                <Link
                  href="/magaza"
                  className="mt-6 inline-flex h-11 items-center rounded-md bg-cobalt px-5 text-sm font-semibold text-light-text"
                >
                  Tüm ürünleri keşfet
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-hairline bg-optical px-6 py-12 text-center">
            <Sparkles aria-hidden="true" className="size-8 text-cobalt" />
            <h2
              id="search-results-heading"
              className="mt-5 text-2xl font-semibold"
            >
              Bir fikirle başla
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
              “Vazo”, “kablo” veya “kişiye özel” gibi bir ifade yaz. Sonuçlar
              yalnızca yayındaki katalog ürünlerinden gelir.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
