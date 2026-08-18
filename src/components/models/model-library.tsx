"use client";

import { useMemo, useState } from "react";
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
import { StaggerGrid, StaggerItem } from "@/components/motion/stagger-grid";
import { siteConfig } from "@/config/site";
import { announceStatus } from "@/lib/motion";
import { useFavoritesStore } from "@/stores/favorites-store";
import { isDevelopmentDemoMode } from "@/lib/env";
import { cn } from "@/lib/utils";

const trending = ["vazo", "masaüstü", "aydınlatma", "heykelsi"] as const;

const sourceTabs: Array<{ id: ModelSource | "all"; label: string; tone: string }> = [
  { id: "all", label: "Tümü", tone: "bg-light-text text-dark-text" },
  { id: "owned", label: siteConfig.collectionLabel, tone: "bg-cobalt text-light-text" },
  { id: "licensed", label: "Lisanslı Tasarımcılar", tone: "bg-coral text-light-text" },
  { id: "thingiverse", label: "Thingiverse", tone: "bg-neutral text-dark-text" },
];

function toCards(): ModelCardData[] {
  if (!isDevelopmentDemoMode) {
    return [];
  }
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
            data-motion-state="visible"
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

      <section className="shell relative py-8 sm:py-10" data-visual-landmark data-model-library>
        <div role="tablist" aria-label="Model kaynakları">
          <StaggerGrid className="flex max-w-full min-w-0 gap-2 overflow-x-auto pb-2">
          {sourceTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={source === tab.id}
              onClick={() => setSource(tab.id)}
              className={cn(
                "min-h-11 shrink-0 rounded-md px-4 text-sm font-semibold",
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
              compact
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
            <StaggerGrid
              as="ul"
              data-model-results=""
              className="mt-8 grid gap-6 sm:grid-cols-2 sm:gap-8 xl:grid-cols-3"
            >
              {visible.map((model) => (
                <StaggerItem as="li" key={model.id}>
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
                </StaggerItem>
              ))}
            </StaggerGrid>
          ) : (
            <EmptyState
              icon={<Search aria-hidden="true" className="size-5" />}
              title={
                cards.length === 0
                  ? "Hazır koleksiyon henüz yayınlanmadı"
                  : "Eşleşen model yok"
              }
              description={
                cards.length === 0
                  ? "Stüdyo modelleri yayınlandığında burada görünür. Geliştirme demosu production’da listelenmez."
                  : "Aramayı veya kategori süzgecini sadeleştirmeyi dene."
              }
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
      </section>
    </div>
  );
}
