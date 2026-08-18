"use client";

import { useMemo, useRef, useState } from "react";
import type { Route } from "next";
import { Search } from "lucide-react";

import { FoundryGrid } from "@/components/brand/foundry-grid";
import { octoDemoModels } from "@/components/content/content-data";
import { EmptyState } from "@/components/feedback/empty-state";
import { ModelCard } from "@/components/models/model-card";
import type { ModelCardData } from "@/components/models/model-card";
import {
  ModelLibraryState,
  ModelLibraryStateGrid,
} from "@/components/models/model-library-state";
import { ThingiverseDiscovery } from "@/components/models/thingiverse-discovery";
import type { ModelSource } from "@/components/models/model-source-badge";
import { RevealHeading } from "@/components/motion/reveal-words";
import { StaggerGrid } from "@/components/motion/stagger-grid";
import { useScrollMotion } from "@/components/motion/scroll-motion-provider";
import { useSafeInView } from "@/components/motion/use-safe-in-view";
import { siteConfig } from "@/config/site";
import { announceStatus } from "@/lib/motion";
import { useFavoritesStore } from "@/stores/favorites-store";
import { cn } from "@/lib/utils";

const trending = ["vazo", "masaüstü", "aydınlatma", "heykelsi"] as const;

const sourceTabs: Array<{ id: ModelSource | "all"; label: string; tone: string }> = [
  { id: "all", label: "Tümü", tone: "bg-light-text text-dark-text" },
  { id: "owned", label: siteConfig.collectionLabel, tone: "bg-cobalt text-light-text" },
  { id: "licensed", label: "Lisanslı Tasarımcılar", tone: "bg-coral text-light-text" },
  { id: "thingiverse", label: "Thingiverse", tone: "bg-neutral text-dark-text" },
];

function toCards(): ModelCardData[] {
  return octoDemoModels.map((model) => ({
    id: model.externalId,
    href: `/hazir-modeller/octo-demo/${model.externalId}` as Route,
    name: model.name,
    creator: siteConfig.studioLabel,
    category: model.category,
    source: "owned",
    license: "Demo · lisans yok",
    permission: "unverified",
  }));
}

export function ModelLibrary() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<ModelSource | "all">("all");
  const [category, setCategory] = useState("");
  const modelIds = useFavoritesStore((state) => state.modelIds);
  const toggleModel = useFavoritesStore((state) => state.toggleModel);
  const hasHydrated = useFavoritesStore((state) => state.hasHydrated);
  const searchRef = useRef<HTMLLabelElement>(null);
  const { ready, reduced } = useScrollMotion();
  const searchInView = useSafeInView(searchRef, { once: true, amount: 0.2 });
  const searchState = reduced || !ready ? "visible" : searchInView ? "visible" : "idle";

  const cards = useMemo(() => toCards(), []);
  const categories = [...new Set(cards.map((card) => card.category))];

  const visible = cards.filter((card) => {
    const matchesQuery =
      !query ||
      `${card.name} ${card.category} ${card.creator}`
        .toLocaleLowerCase("tr-TR")
        .includes(query.toLocaleLowerCase("tr-TR"));
    const matchesSource = source === "all" || card.source === source;
    const matchesCategory = !category || card.category === category;
    return matchesQuery && matchesSource && matchesCategory;
  });

  return (
    <div className="relative text-light-text">
      <FoundryGrid variant="blueprint" className="opacity-40" />
      <header className="relative overflow-hidden py-10 sm:py-14">
        <FoundryGrid variant="fade" className="opacity-70" />
        <div className="shell relative">
          <p className="eyebrow">Hazır modeller</p>
          <RevealHeading
            as="h1"
            text="Ne üretmek istiyorsun?"
            className="display-title stack-title max-w-[16ch]"
          />
          <label
            ref={searchRef}
            data-motion-state={searchState}
            className="relative mt-8 block max-w-2xl"
          >
            <span className="sr-only">Model ara</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-light"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Model, kategori veya kullanım ara"
              className="motion-search h-14 w-full rounded-md border border-white/15 bg-white/8 pr-4 pl-12 text-base text-light-text outline-none placeholder:text-muted-light"
            />
          </label>
          <p className="mt-4 text-sm text-muted-light">Popüler aramalar</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {trending.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setQuery(term)}
                className="min-h-11 rounded-md border border-white/15 px-3 text-sm"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="shell relative py-10">
        <div role="tablist" aria-label="Model kaynakları">
          <StaggerGrid className="flex gap-2 overflow-x-auto pb-2">
          {sourceTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={source === tab.id}
              onClick={() => setSource(tab.id)}
              data-motion-item="idle"
              className={cn(
                "motion-item min-h-11 shrink-0 rounded-md px-4 text-sm font-semibold",
                source === tab.id
                  ? tab.tone
                  : "border border-white/15 text-light-text",
              )}
            >
              {tab.label}
            </button>
          ))}
          </StaggerGrid>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("")}
            className={cn(
              "min-h-11 rounded-md px-3 text-sm",
              !category ? "bg-white/12 font-semibold" : "border border-white/15",
            )}
          >
            Tüm kategoriler
          </button>
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={cn(
                "min-h-11 rounded-md px-3 text-sm",
                category === item
                  ? "bg-white/12 font-semibold"
                  : "border border-white/15",
              )}
            >
              {item}
            </button>
          ))}
        </div>

        {source === "thingiverse" ? <ThingiverseDiscovery /> : null}

        {source === "licensed" ? (
          <section className="mt-10 space-y-6">
            <EmptyState
              icon={<Search aria-hidden="true" className="size-5" />}
              title="Lisanslı tasarımcı kataloğu henüz bağlı değil"
              description="Doğrulanmış ticari izinli modeller burada ayrı bir kaynak olarak listelenecek. Şu an satın alınabilir harici kayıt yok."
            />
            <ModelLibraryStateGrid
              ids={["permission-review", "verified", "not-permitted", "missing-file"]}
            />
          </section>
        ) : null}

        {source === "all" || source === "owned" ? (
          visible.length > 0 ? (
            <StaggerGrid as="ul" className="mt-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((model) => (
                <li key={model.id} data-motion-item="idle" className="motion-item">
                  <ModelCard
                    model={model}
                    isFavorite={hasHydrated && modelIds.includes(model.id)}
                    onFavorite={() => {
                      const next = !modelIds.includes(model.id);
                      toggleModel(model.id);
                      announceStatus(
                        next
                          ? `${model.name} kaydedildi.`
                          : `${model.name} kayıtlardan çıkarıldı.`,
                      );
                    }}
                  />
                </li>
              ))}
            </StaggerGrid>
          ) : (
            <EmptyState
              icon={<Search aria-hidden="true" className="size-5" />}
              title="Eşleşen model yok"
              description="Aramayı veya kategori süzgecini sadeleştirmeyi dene."
            />
          )
        ) : null}

        {source === "all" ? (
          <p className="mt-10 text-sm text-muted-light">
            Başlangıç fiyatı yalnızca doğrulanmış ticari izin ve gerçek teklif
            olduğunda gösterilir. Demo kayıtlarda fiyat yoktur.
          </p>
        ) : null}

        {source === "owned" ? (
          <div className="mt-10">
            <ModelLibraryState id="missing-file" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
