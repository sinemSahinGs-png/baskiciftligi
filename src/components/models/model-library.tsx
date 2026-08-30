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
import { DiscoveryHero } from "@/components/models/discovery-hero";
import { DiscoveryRail } from "@/components/models/discovery-rail";
import { ExternalModelPriceModal } from "@/components/models/external-model-price-modal";
import {
  discoverySourceToApiParam,
  parseDiscoverySource,
  SortFilter,
  SourceFilter,
  type DiscoverySource,
  type SortOption,
} from "@/components/models/source-filter";
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

function buildLibrarySearch(next: {
  query: string;
  source: DiscoverySource;
  category: string;
}) {
  const params = new URLSearchParams();
  if (next.query.trim()) params.set("q", next.query.trim());
  const apiSource = discoverySourceToApiParam(next.source);
  if (apiSource !== "all") params.set("source", apiSource);
  if (next.category.trim()) params.set("category", next.category.trim());
  return params;
}

function cacheKey(
  query: string,
  source: DiscoverySource,
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

function hasPreview(model: UnifiedDiscoveryResult) {
  if (model.kind === "thingiverse") return Boolean(model.thumbnailUrl);
  return Boolean(model.previewImageUrl);
}

function sortModels(models: UnifiedDiscoveryResult[], sort: SortOption) {
  if (sort === "recommended") return models;
  const copy = [...models];
  if (sort === "with_image") {
    copy.sort((a, b) => Number(hasPreview(b)) - Number(hasPreview(a)));
  }
  if (sort === "newest") {
    copy.sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true }));
  }
  return copy;
}

function resultsTitle(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return "Öne çıkan modeller";
  const capitalized = trimmed.charAt(0).toLocaleUpperCase("tr-TR") + trimmed.slice(1);
  return `${capitalized} modelleri`;
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
      className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4"
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
      className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4"
      aria-hidden="true"
      data-model-skeleton=""
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <li key={index} className="animate-pulse">
          <div className="aspect-[4/5] rounded-xl bg-white/10" />
          <div className="mt-3 h-3 w-1/3 rounded bg-white/10" />
          <div className="mt-2 h-4 w-4/5 rounded bg-white/10" />
          <div className="mt-3 h-8 w-2/3 rounded-lg bg-white/10" />
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

  const [communityFromApi, setCommunityFromApi] = useState(false);
  const communityEnabled = thingiverseEnabled || communityFromApi;

  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [committedQuery, setCommittedQuery] = useState(
    () => (searchParams.get("q") ?? "").trim(),
  );
  const [source, setSource] = useState<DiscoverySource>(() =>
    parseDiscoverySource(searchParams.get("source"), thingiverseEnabled),
  );
  const [category, setCategory] = useState(
    () => searchParams.get("category") ?? "",
  );
  const [sort, setSort] = useState<SortOption>("recommended");
  const [results, setResults] = useState<UnifiedDiscoveryResult[]>(initialCards);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [softError, setSoftError] = useState<string | null>(null);
  const [modalModel, setModalModel] = useState<ExternalQuoteModelContext | null>(null);
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

  const sortedResults = useMemo(
    () => sortModels(results, sort),
    [results, sort],
  );

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
      setSource(parseDiscoverySource(params.get("source"), communityEnabled));
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
    const apiSource = discoverySourceToApiParam(source);
    if (apiSource !== "all") params.set("source", apiSource);
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
        if (source === "all" || source === "internal") {
          const fallback =
            source === "all"
              ? seed
              : seed.filter((item) => item.kind === "curated");
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
    source: DiscoverySource;
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

  function runSearch(term: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery(term);
    setSource("all");
    setCategory("");
    setCommittedQuery(term.trim());
    persistHistory({ query: term, source: "all", category: "" });
  }

  function openCuratedQuote(model: CuratedCatalogCardData) {
    if (!model.sourceUrl) return;
    setReturnFocusKey(`curated-${model.id}`);
    returnFocusRef.current = ctaRefs.current.get(`curated-${model.id}`) ?? null;
    setModalModel(curatedToQuoteContext(model));
    setModalOpen(true);
  }

  const showEmptyQueryMiss =
    !loading && Boolean(committedQuery) && sortedResults.length === 0 && !softError;
  const showSoftEmpty =
    !loading && Boolean(committedQuery) && sortedResults.length === 0 && Boolean(softError);
  const showIdleEmpty =
    !loading && !committedQuery && sortedResults.length === 0 && !softError;

  return (
    <div
      className="relative overflow-x-hidden text-light-text"
      data-model-library-root
      data-community-enabled={communityEnabled ? "true" : "false"}
    >
      <FoundryGrid variant="blueprint" className="pointer-events-none opacity-30" />
      <div className="shell relative py-6 sm:py-10" data-model-library>
        <DiscoveryHero
          query={query}
          onQueryChange={(value) => {
            setQuery(value);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
              commitSearch(value, source, category);
            }, SEARCH_DEBOUNCE_MS);
          }}
          onSubmit={() => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            commitSearch(query, source, category);
          }}
        />

        <DiscoveryRail onSelect={runSearch} />

        <div className="mx-auto mt-10 w-full max-w-[72rem]">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4">
            <div className="min-w-0">
              <h2 className="font-heading text-lg font-semibold sm:text-xl">
                {resultsTitle(committedQuery)}
              </h2>
              {!loading && sortedResults.length > 0 ? (
                <p className="mt-1 text-xs text-muted-light">
                  {sortedResults.length} model
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <SourceFilter
                value={source}
                communityEnabled={communityEnabled}
                onChange={(next) => {
                  setSource(next);
                  persistHistory({
                    query: committedQuery,
                    source: next,
                    category,
                  });
                }}
              />
              <SortFilter value={sort} onChange={setSort} />
            </div>
          </div>

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
            {loading && sortedResults.length === 0 ? <SkeletonGrid /> : null}
            {sortedResults.length > 0 ? (
              <ModelResultsGrid
                models={sortedResults}
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
            ) : showIdleEmpty ? (
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
                  data-load-more=""
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                  className="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-5 text-sm font-semibold transition hover:border-coral/40 hover:bg-coral/[0.06] disabled:opacity-50"
                >
                  {loadingMore ? "Yükleniyor…" : "Daha fazla göster"}
                </button>
              </div>
            ) : null}
          </div>
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
