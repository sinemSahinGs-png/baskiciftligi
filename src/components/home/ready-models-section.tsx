"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";

import { SafeImage } from "@/components/media/safe-image";
import { trackHomeEvent } from "@/lib/home/analytics";

export interface ReadyModelCard {
  id: string;
  name: string;
  category: string;
  imageUrl?: string | null;
  href: string;
  source?: "curated" | "thingiverse" | "fallback";
}

export function ReadyModelsSection({
  fallback,
}: {
  fallback: ReadyModelCard[];
}) {
  const [cards, setCards] = useState(fallback);
  const [loading, setLoading] = useState(fallback.length === 0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort("timeout"), 6_000);

    fetch("/api/hazir-modeller/search?source=thingiverse", {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return;
        const body = (await response.json()) as {
          models?: Array<{
            id?: string;
            title?: string;
            categoryLabel?: string;
            thumbnailUrl?: string;
          }>;
        };
        const live = (body.models ?? [])
          .filter((model) => model.id && model.title)
          .slice(0, 8)
          .map((model) => ({
            id: `tv-${model.id}`,
            name: model.title!,
            category: model.categoryLabel ?? "Thingiverse",
            imageUrl: model.thumbnailUrl,
            href: `/hazir-modeller/thingiverse/${model.id}`,
            source: "thingiverse" as const,
          }));
        if (live.length > 0) {
          const seen = new Set<string>();
          const merged = [...live, ...fallback].filter((card) => {
            if (seen.has(card.id)) return false;
            seen.add(card.id);
            return true;
          });
          setCards(merged.slice(0, 8));
        }
      })
      .catch(() => {
        // Homepage continues with cache/fallback cards.
      })
      .finally(() => {
        window.clearTimeout(timer);
        setLoading(false);
      });

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [fallback]);

  const visible = cards.slice(0, 6);

  return (
    <section
      id="sana-gore-hazir-modeller"
      className="relative overflow-hidden bg-[#12151c] text-light-text"
    >
      <div className="pointer-events-none absolute inset-0 home-tech-grid opacity-30" />
      <div className="home-shell relative py-12 sm:py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-[1.65rem] leading-[1.08] font-bold tracking-[-0.04em] sm:text-3xl">
              Sana göre hazır modeller
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/70">
              İlk kartlar hemen görünür. Topluluk sonuçları arka planda dolar.
            </p>
          </div>
          <Link
            href={"/hazir-modeller" as Route}
            onClick={() => trackHomeEvent({ name: "ready_model_cta_clicked" })}
            className="hidden min-h-11 shrink-0 items-center text-sm font-semibold sm:inline-flex"
          >
            Tüm hazır modelleri gör
          </Link>
        </div>

        {visible.length === 0 && loading ? (
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="home-shimmer aspect-[4/5] rounded-2xl bg-white/8" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <Link
            href={"/hazir-modeller" as Route}
            className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-orange px-5 text-sm font-semibold text-midnight"
          >
            Tüm hazır modelleri gör
          </Link>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 md:hidden">
            {visible.slice(0, 4).map((model) => (
              <ReadyCard key={model.id} model={model} />
            ))}
          </div>
        )}

        {visible.length > 0 ? (
          <div className="mt-6 hidden gap-3 overflow-x-auto pb-1 md:flex lg:grid lg:grid-cols-4 lg:overflow-visible">
            {visible.map((model) => (
              <div key={model.id} className="w-[15.5rem] shrink-0 lg:w-auto">
                <ReadyCard model={model} />
              </div>
            ))}
          </div>
        ) : null}

        <Link
          href={"/hazir-modeller" as Route}
          onClick={() => trackHomeEvent({ name: "ready_model_cta_clicked" })}
          className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold sm:hidden"
        >
          Tüm hazır modelleri gör
        </Link>
      </div>
    </section>
  );
}

function ReadyCard({ model }: { model: ReadyModelCard }) {
  return (
    <Link
      href={model.href as Route}
      className="group relative block overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
    >
      <span className="relative block aspect-[4/5] bg-white/8">
        <SafeImage
          src={model.imageUrl}
          alt={model.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
        <span className="absolute inset-x-0 bottom-0 p-3">
          <span className="text-[0.7rem] font-semibold tracking-wide text-cyan uppercase">
            {model.category}
          </span>
          <span className="mt-1 block font-heading text-base leading-snug font-semibold">
            {model.name}
          </span>
        </span>
      </span>
    </Link>
  );
}
