"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { FoundryGrid } from "@/components/brand/foundry-grid";
import { EmptyState } from "@/components/feedback/empty-state";
import {
  CuratedCatalogCard,
  type CuratedCatalogCardData,
} from "@/components/models/curated-catalog-card";
import { ExternalModelPriceModal } from "@/components/models/external-model-price-modal";
import { ModelLibraryState } from "@/components/models/model-library-state";
import {
  ThingiverseLibraryCard,
  type ThingiverseLibraryCardData,
} from "@/components/models/thingiverse-library-card";
import { StaggerGrid, StaggerItem } from "@/components/motion/stagger-grid";
import type { CuratedModelRecord } from "@/domain/curated-models/types";
import { platformLabel } from "@/domain/curated-models/types";
import {
  labelForSourceType,
  readExternalQuoteContext,
  sourceTypeFromPlatform,
  type ExternalQuoteModelContext,
} from "@/lib/models/external-quote-context";
import type {
  UnifiedDiscoveryResult,
  UnifiedSearchPayload,
} from "@/lib/models/unified-discovery";
import { announceStatus } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { THINGIVERSE_CATEGORY_LABELS } from "@/providers/thingiverse/categories";

const trending = [
  "figür",
  "telefon tutucu",
  "vazo",
  "masaüstü düzenleyici",
] as const;

type LibrarySource = "all" | "owned" | "curated" | "thingiverse";

const SEARCH_DEBOUNCE_MS = 350;

function toCard(model: CuratedModelRecord): CuratedCatalogCardData {
  return {
    id: model.id,
    slug: model.slug,
    titleTr: model.titleTr,
    categoryLabel: model.categoryLabel,
    listingKind: model.listingKind,
    previewImageUrl: model.previewImageUrl,
    imageAlt: model.imageAlt,
    authorName: model.authorName,
    platformType: model.platformType,
    platformLabel: platformLabel(model.platformType),
    sourceUrl: model.sourceUrl,
    hasProductionFile: Boolean(model.downloadUrl),
    licenseName: model.licenseVerified ? model.licenseCode : null,
    licenseVerified: model.licenseVerified,
    attribution: model.attributionText,
  };
}

function parseSource(
  raw: string | null,
  communityEnabled: boolean,
): LibrarySource {
  if (raw === "owned") return "owned";
  if (raw === "curated") return "curated";
  if ((raw === "thingiverse" || raw === "community") && communityEnabled) {
    return "thingiverse";
  }
  if (raw === "web" || raw === "printables") return "all";
  return "all";
}

function buildLibrarySearch(next: {
  query: string;
  source: LibrarySource;
  category: string;
}) {
  const params = new URLSearchParams();
  if (next.query.trim()) params.set("q", next.query.trim());
  if (next.source !== "all") params.set("source", next.source);
  if (next.category.trim()) params.set("category", next.category.trim());
  return params;
}

function cacheKey(
  query: string,
  source: LibrarySource,
  category: string,
  page = 1,
) {
  return `${source}::${category}::${query.trim().toLocaleLowerCase("tr-TR")}::p${page}`;
}

function curatedToQuoteContext(
  model: CuratedCatalogCardData,
): ExternalQuoteModelContext {
  return {
    externalModelId: model.id,
    sourceType: sourceTypeFromPlatform(model.platformType ?? "other"),
    sourceUrl: model.sourceUrl ?? "",
    title: model.titleTr,
    categoryLabel: model.categoryLabel,
    previewImageUrl: model.previewImageUrl,
    imageAlt: model.imageAlt,
    attribution: model.attribution ?? null,
    licenseName: model.licenseVerified ? model.licenseName ?? null : null,
    licenseVerified: Boolean(model.licenseVerified),
    platformLabel: model.platformLabel ?? labelForSourceType("other"),
    slug: model.slug,
  };
}

function mergeUnique(
  existing: UnifiedDiscoveryResult[],
  incoming: UnifiedDiscoveryResult[],
) {
  const seen = new Set(existing.map((item) => `${item.kind}-${item.id}`));
  const merged = [...existing];
  for (const item of incoming) {
    const key = `${item.kind}-${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}

function normalizeModels(raw: unknown): UnifiedDiscoveryResult[] {
  if (!Array.isArray(raw)) return [];
  const out: UnifiedDiscoveryResult[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id =
      typeof row.id === "string"
        ? row.id
        : typeof row.id === "number"
          ? String(row.id)
          : null;
    if (!id) continue;
    if (row.kind === "thingiverse") {
      const key = `thingiverse:${id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ ...(item as ThingiverseLibraryCardData), kind: "thingiverse", id });
      continue;
    }
    if (row.kind === "curated") {
      const key = `curated:${id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        ...(item as CuratedCatalogCardData),
        kind: "curated",
        id,
      });
    }
  }
  return out;
}

const ModelResultsGrid = memo(function ModelResultsGrid({
  models,
  onExternalQuote,
  ctaRefs,
}: {
  models: UnifiedDiscoveryResult[];
  onExternalQuote: (model: CuratedCatalogCardData) => void;
  ctaRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>;
}) {
  return (
    <StaggerGrid
      as="ul"
      data-model-results=""
      className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4"
    >
      {models.map((model) => (
        <StaggerItem as="li" key={`${model.kind}-${model.id}`} className="h-full">
          {model.kind === "curated" ? (
            <CuratedCatalogCard
              model={model}
              onExternalQuote={onExternalQuote}
              ref={(node) => {
                if (node) ctaRefs.current.set(`curated-${model.id}`, node);
                else ctaRefs.current.delete(`curated-${model.id}`);
              }}
            />
          ) : (
            <ThingiverseLibraryCard model={model} />
          )}
        </StaggerItem>
      ))}
    </StaggerGrid>
  );
});

function SkeletonGrid() {
  return (
    <ul
      className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4"
      aria-hidden="true"
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <li key={index} className="animate-pulse">
          <div className="aspect-[4/5] rounded-lg bg-white/10" />
          <div className="mt-3 h-3 w-1/3 rounded bg-white/10" />
          <div className="mt-2 h-4 w-4/5 rounded bg-white/10" />
        </li>
      ))}
    </ul>
  );
}

export function ModelLibrary({
  curatedModels = [],
  thingiverseEnabled = false,
}: {
  curatedModels?: CuratedModelRecord[];
  thingiverseEnabled?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialCards = useMemo<UnifiedDiscoveryResult[]>(
    () => curatedModels.map((model) => ({ kind: "curated" as const, ...toCard(model) })),
    [curatedModels],
  );

  /** SSR may lag env; API can promote community tab at runtime. */
  const [communityFromApi, setCommunityFromApi] = useState(false);
  const communityEnabled = thingiverseEnabled || communityFromApi;

  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [committedQuery, setCommittedQuery] = useState(
    () => (searchParams.get("q") ?? "").trim(),
  );
  const [source, setSource] = useState<LibrarySource>(() =>
    parseSource(searchParams.get("source"), thingiverseEnabled),
  );
  const [category, setCategory] = useState(
    () => searchParams.get("category") ?? "",
  );
  const [results, setResults] = useState<UnifiedDiscoveryResult[]>(initialCards);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [softError, setSoftError] = useState<string | null>(null);
  const [modalModel, setModalModel] = useState<ExternalQuoteModelContext | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [returnFocusKey, setReturnFocusKey] = useState<string | null>(null);
  const cacheRef = useRef(new Map<string, UnifiedSearchPayload>());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ctaRefs = useRef(new Map<string, HTMLButtonElement>());
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const requestSeq = useRef(0);
  const initialCardsRef = useRef(initialCards);

  useEffect(() => {
    initialCardsRef.current = initialCards;
  }, [initialCards]);

  const sourceTabs = useMemo(() => {
    const tabs: Array<{ id: LibrarySource; label: string; tone: string }> = [
      { id: "all", label: "Tümü", tone: "bg-light-text text-dark-text" },
      {
        id: "owned",
        label: "Baskı Çiftliği modelleri",
        tone: "bg-cobalt text-light-text",
      },
      {
        id: "curated",
        label: "Küratörlü modeller",
        tone: "bg-orange text-midnight",
      },
    ];
    if (communityEnabled) {
      tabs.push({
        id: "thingiverse",
        label: "Topluluk modelleri",
        tone: "bg-neutral text-dark-text",
      });
    }
    return tabs;
  }, [communityEnabled]);

  const categories = useMemo(() => {
    if (communityEnabled && (source === "thingiverse" || source === "all")) {
      return [...THINGIVERSE_CATEGORY_LABELS];
    }
    const set = new Set<string>();
    for (const model of curatedModels) {
      if (model.categoryLabel) set.add(model.categoryLabel);
    }
    for (const model of results) {
      if (model.kind === "curated" && model.categoryLabel) {
        set.add(model.categoryLabel);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, "tr"));
  }, [curatedModels, results, source, communityEnabled]);

  useEffect(() => {
    const restored = readExternalQuoteContext();
    if (!restored?.sourceUrl || !restored.title) return;
    queueMicrotask(() => {
      setModalModel(restored);
      setModalOpen(true);
    });
  }, []);

  useEffect(() => {
    function onPopState() {
      const params = new URLSearchParams(window.location.search);
      setQuery(params.get("q") ?? "");
      setCommittedQuery((params.get("q") ?? "").trim());
      setSource(parseSource(params.get("source"), communityEnabled));
      setCategory(params.get("category") ?? "");
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [communityEnabled]);

  useEffect(() => {
    const key = cacheKey(committedQuery, source, category, 1);
    const cached = cacheRef.current.get(key);
    if (cached) {
      const models = normalizeModels(cached.models);
      setResults(models);
      setPage(cached.page ?? 1);
      setHasMore(Boolean(cached.hasMore));
      setSoftError(cached.softError ?? null);
      if (cached.thingiverseConnected) setCommunityFromApi(true);
      setLoading(false);
      return;
    }

    const seq = ++requestSeq.current;
    const controller = new AbortController();
    setLoading(true);
    setSoftError(null);
    setPage(1);
    setHasMore(false);

    const params = new URLSearchParams();
    if (committedQuery.trim()) params.set("q", committedQuery.trim());
    if (source !== "all") params.set("source", source);
    if (category.trim()) params.set("category", category.trim());
    params.set("page", "1");

    void fetch(`/api/hazir-modeller/search?${params}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Arama başarısız");
        return (await response.json()) as UnifiedSearchPayload & {
          categoryRelaxed?: boolean;
        };
      })
      .then((payload) => {
        if (seq !== requestSeq.current) return;
        const models = normalizeModels(payload.models);
        const next: UnifiedSearchPayload = {
          models,
          page: payload.page ?? 1,
          hasMore: Boolean(payload.hasMore),
          softError: payload.softError,
          thingiverseConnected: payload.thingiverseConnected,
        };
        cacheRef.current.set(key, next);
        setResults(models);
        setPage(next.page ?? 1);
        setHasMore(Boolean(next.hasMore));
        setSoftError(next.softError ?? null);
        if (payload.thingiverseConnected) setCommunityFromApi(true);
        if (payload.categoryRelaxed && category) {
          setCategory("");
          const params = buildLibrarySearch({
            query: committedQuery,
            source,
            category: "",
          });
          const target = params.toString() ? `${pathname}?${params}` : pathname;
          window.history.replaceState(null, "", target);
        }
      })
      .catch((error: Error) => {
        if (error.name === "AbortError") return;
        if (seq !== requestSeq.current) return;
        const seed = initialCardsRef.current;
        if (source === "all" || source === "owned" || source === "curated") {
          const fallback =
            source === "all"
              ? seed
              : seed.filter((item) => {
                  if (item.kind !== "curated") return false;
                  if (source === "owned") return item.listingKind === "studio";
                  return item.listingKind === "curated_external";
                });
          const filtered = committedQuery
            ? fallback.filter((item) => {
                if (item.kind !== "curated") return false;
                const hay = `${item.titleTr} ${item.categoryLabel}`.toLocaleLowerCase(
                  "tr-TR",
                );
                return hay.includes(committedQuery.toLocaleLowerCase("tr-TR"));
              })
            : fallback;
          setResults(filtered);
        } else {
          setResults([]);
        }
        setHasMore(false);
        setSoftError(
          "Topluluk araması şu an tamamlanamadı. İç katalog sonuçları korunuyor.",
        );
      })
      .finally(() => {
        if (seq === requestSeq.current) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [committedQuery, source, category, pathname]);

  async function loadMore() {
    if (!hasMore || loadingMore || source !== "thingiverse") return;
    const nextPage = page + 1;
    const key = cacheKey(committedQuery, source, category, nextPage);
    const cached = cacheRef.current.get(key);
    if (cached) {
      setResults((prev) => mergeUnique(prev, normalizeModels(cached.models)));
      setPage(cached.page ?? nextPage);
      setHasMore(Boolean(cached.hasMore));
      return;
    }

    setLoadingMore(true);
    const params = new URLSearchParams();
    if (committedQuery.trim()) params.set("q", committedQuery.trim());
    params.set("source", "thingiverse");
    if (category.trim()) params.set("category", category.trim());
    params.set("page", String(nextPage));

    try {
      const response = await fetch(`/api/hazir-modeller/search?${params}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Sayfa yüklenemedi");
      const payload = (await response.json()) as UnifiedSearchPayload;
      const models = normalizeModels(payload.models);
      const next: UnifiedSearchPayload = {
        models,
        page: payload.page ?? nextPage,
        hasMore: Boolean(payload.hasMore),
        softError: payload.softError,
      };
      cacheRef.current.set(key, next);
      setResults((prev) => mergeUnique(prev, models));
      setPage(next.page ?? nextPage);
      setHasMore(Boolean(next.hasMore));
      if (next.softError) setSoftError(next.softError);
      if (payload.thingiverseConnected) setCommunityFromApi(true);
    } catch {
      setSoftError("Daha fazla model yüklenemedi. Kısa süre sonra yeniden deneyin.");
    } finally {
      setLoadingMore(false);
    }
  }

  function persistHistory(next: {
    query: string;
    source: LibrarySource;
    category: string;
  }) {
    const params = buildLibrarySearch(next);
    const target = params.toString() ? `${pathname}?${params}` : pathname;
    const current =
      window.location.pathname +
      (window.location.search || "") +
      (window.location.hash || "");
    if (current === target) return;
    window.history.pushState(null, "", target);
  }

  function commitSearch(
    nextQuery = query,
    nextSource = source,
    nextCategory = category,
  ) {
    const trimmed = nextQuery.trim();
    // Text search must not keep a sticky category that blanks community hits.
    const categoryForSearch = trimmed ? "" : nextCategory;
    if (categoryForSearch !== category) {
      setCategory(categoryForSearch);
    }
    setCommittedQuery(trimmed);
    persistHistory({
      query: trimmed,
      source: nextSource,
      category: categoryForSearch,
    });
    announceStatus(
      trimmed ? `“${trimmed}” için arama yapıldı.` : "Arama temizlendi.",
    );
  }

  function openCuratedQuote(model: CuratedCatalogCardData) {
    if (!model.sourceUrl) return;
    setReturnFocusKey(`curated-${model.id}`);
    returnFocusRef.current = ctaRefs.current.get(`curated-${model.id}`) ?? null;
    setModalModel(curatedToQuoteContext(model));
    setModalOpen(true);
  }

  const showEmptyQueryMiss =
    !loading && Boolean(committedQuery) && results.length === 0 && !softError;
  const showSoftEmpty =
    !loading && Boolean(committedQuery) && results.length === 0 && Boolean(softError);

  return (
    <div
      className="relative text-light-text"
      data-model-library-root
      data-community-enabled={communityEnabled ? "true" : "false"}
    >
      <FoundryGrid variant="blueprint" className="pointer-events-none opacity-30" />
      <div className="shell relative py-6 sm:py-8" data-model-library>
        <header className="max-w-3xl">
          <p className="eyebrow">Hazır modeller</p>
          <h1 className="mt-2 font-heading text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
            Ne üretmek istiyorsun?
          </h1>

          <form
            className="mt-6 max-w-3xl"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              if (debounceRef.current) clearTimeout(debounceRef.current);
              commitSearch(query, source === "owned" || source === "curated" ? source : source, category);
            }}
          >
            <label className="relative block">
              <span className="sr-only">Model ara</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-light"
              />
              <input
                data-model-search-input
                value={query}
                onChange={(event) => {
                  const value = event.target.value;
                  setQuery(value);
                  if (debounceRef.current) clearTimeout(debounceRef.current);
                  debounceRef.current = setTimeout(() => {
                    commitSearch(value, source, category);
                  }, SEARCH_DEBOUNCE_MS);
                }}
                placeholder="Vazo, telefon standı, figür…"
                className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] pr-28 pl-12 text-base text-light-text outline-none placeholder:text-muted-light focus-visible:ring-2 focus-visible:ring-coral/60"
                autoComplete="off"
                enterKeyHint="search"
              />
              <button
                type="submit"
                className="absolute top-1/2 right-2 inline-flex min-h-10 -translate-y-1/2 items-center justify-center rounded-xl bg-coral px-4 text-sm font-semibold text-midnight"
              >
                Ara
              </button>
            </label>
          </form>

          <p className="mt-3 text-xs text-muted-light">Popüler aramalar</p>
          <div className="mt-2 flex max-w-full gap-2 overflow-x-auto pb-1">
            {trending.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  if (debounceRef.current) clearTimeout(debounceRef.current);
                  setQuery(term);
                  setSource("all");
                  setCategory("");
                  setCommittedQuery(term);
                  persistHistory({ query: term, source: "all", category: "" });
                }}
                className="min-h-10 shrink-0 rounded-md border border-white/15 px-3 text-sm"
              >
                {term}
              </button>
            ))}
          </div>
        </header>

        <div
          role="tablist"
          aria-label="Model kaynakları"
          className="mt-5 flex max-w-full gap-2 overflow-x-auto pb-1"
        >
          {sourceTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              data-library-source={tab.id}
              aria-selected={source === tab.id}
              onClick={() => {
                setSource(tab.id);
                persistHistory({
                  query: committedQuery,
                  source: tab.id,
                  category,
                });
              }}
              className={cn(
                "min-h-10 shrink-0 rounded-md px-3.5 text-sm font-semibold",
                source === tab.id
                  ? tab.tone
                  : "border border-white/15 text-light-text",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {categories.length > 0 ? (
          <div className="mt-3 flex max-w-full gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => {
                setCategory("");
                persistHistory({
                  query: committedQuery,
                  source,
                  category: "",
                });
              }}
              className={cn(
                "min-h-9 shrink-0 rounded-md px-3 text-xs font-semibold",
                !category
                  ? "bg-white/15"
                  : "border border-white/15 text-muted-light",
              )}
            >
              Tüm kategoriler
            </button>
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setCategory(item);
                  persistHistory({
                    query: committedQuery,
                    source,
                    category: item,
                  });
                }}
                className={cn(
                  "min-h-9 shrink-0 rounded-md px-3 text-xs font-semibold",
                  category === item
                    ? "bg-white/15"
                    : "border border-white/15 text-muted-light",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-5 space-y-5" aria-busy={loading}>
          {softError ? (
            <p
              role="status"
              data-community-soft-error=""
              className="rounded-xl border border-amber-400/30 bg-amber-400/5 px-4 py-3 text-sm text-amber-50"
            >
              {softError}
            </p>
          ) : null}
          {loading && results.length === 0 ? <SkeletonGrid /> : null}
          {results.length > 0 ? (
            <ModelResultsGrid
              models={results}
              onExternalQuote={openCuratedQuote}
              ctaRefs={ctaRefs}
            />
          ) : showEmptyQueryMiss || showSoftEmpty ? (
            <div
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
              data-search-empty=""
            >
              <p className="text-sm font-semibold">
                {showSoftEmpty
                  ? "Topluluk sonuçları geçici olarak alınamadı."
                  : "Sonuç bulunamadı."}
              </p>
              <p className="mt-1 text-sm text-muted-light">
                Aramayı düzenleyebilir veya kendi modelini yükleyebilirsin.
              </p>
            </div>
          ) : !loading ? (
            <EmptyState
              icon={<Search aria-hidden="true" className="size-5" />}
              title="Keşfetmeye başla"
              description="Popüler bir arama seç veya kendi dosyanı yükle. Topluluk modelleri bağlantı açıkken burada birleşir."
            />
          ) : null}

          {source === "thingiverse" && hasMore ? (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="inline-flex min-h-11 items-center rounded-md border border-white/20 px-5 text-sm font-semibold disabled:opacity-50"
              >
                {loadingMore ? "Yükleniyor…" : "Daha fazla yükle"}
              </button>
            </div>
          ) : null}

          {source === "owned" ? (
            <div className="pt-2">
              <ModelLibraryState id="missing-file" />
            </div>
          ) : null}
        </div>
      </div>

      <ExternalModelPriceModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open && returnFocusKey) {
            returnFocusRef.current =
              ctaRefs.current.get(returnFocusKey) ?? returnFocusRef.current;
          }
        }}
        model={modalModel}
        returnFocusRef={returnFocusRef}
      />
    </div>
  );
}
