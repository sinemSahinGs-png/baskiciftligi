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
          .slice(0, 4)
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
          setCards(merged.slice(0, 4));
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

  const visible = cards.slice(0, 4);

  return (
    <section id="sana-gore-hazir-modeller" className="home-section relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 home-tech-grid opacity-25" />
      <div className="home-shell relative">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="home-title home-mask-reveal">Sana göre hazır modeller</h2>
            <p className="home-lede">İlk dört model hemen görünür. Kütüphane bir dokunuş ötede.</p>
          </div>
          <Link
            href={"/hazir-modeller" as Route}
            onClick={() => trackHomeEvent({ name: "ready_model_cta_clicked" })}
            className="home-see-all hidden sm:inline-flex"
          >
            Tümünü gör
          </Link>
        </div>

        {visible.length === 0 && loading ? (
          <div className="mt-5 grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="home-shimmer aspect-[4/5] rounded-[1.25rem] bg-white/8" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <Link
            href={"/hazir-modeller" as Route}
            className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-orange px-5 text-[0.9375rem] font-semibold text-midnight"
          >
            Tüm hazır modelleri gör
          </Link>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3">
            {visible.map((model, index) => (
              <ReadyCard key={model.id} model={model} delay={index * 50} />
            ))}
          </div>
        )}

        <Link
          href={"/hazir-modeller" as Route}
          onClick={() => trackHomeEvent({ name: "ready_model_cta_clicked" })}
          className="home-see-all mt-4 sm:hidden"
        >
          Tümünü gör
        </Link>
      </div>
    </section>
  );
}

function ReadyCard({ model, delay }: { model: ReadyModelCard; delay: number }) {
  return (
    <Link
      href={model.href as Route}
      style={{ animationDelay: `${delay}ms` }}
      className="home-press-card home-reveal-card group flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#f3efe6] text-[#14161c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
    >
      <span className="relative block aspect-[4/5] bg-[#11161c]">
        <SafeImage
          src={model.imageUrl}
          alt={model.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          fallbackLabel="Model görseli"
          className="home-media-reveal object-cover brightness-110"
        />
      </span>
      <span className="flex min-h-[5.5rem] flex-col p-3">
        <span className="text-[0.75rem] font-semibold tracking-wide text-[#0f6f6d] uppercase">
          Hazır 3D model
        </span>
        <span className="mt-1 line-clamp-2 font-heading text-base leading-6 font-semibold">
          {model.name}
        </span>
      </span>
    </Link>
  );
}
