"use client";

import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowRight, Loader2, Search, Upload } from "lucide-react";

import { SafeImage } from "@/components/media/safe-image";
import { ModelCardMedia } from "@/components/models/model-card-media";
import { externalQuoteCtaLabel } from "@/domain/external-models/quote-action";
import {
  homepageIdeaExamples,
  homepageIdeaPlaceholders,
} from "@/domain/home/homepage";
import { trackHomeEvent } from "@/lib/home/analytics";
import { announceStatus } from "@/lib/motion";
import type { IdeaSearchCard } from "@/lib/model-discovery/idea-search";
import { IDEA_SEARCH_MOBILE_PAGE_SIZE } from "@/lib/model-discovery/idea-search";
import { cn } from "@/lib/utils";

type SearchUiStatus =
  | "idle"
  | "typing"
  | "searching"
  | "ok"
  | "empty"
  | "slow"
  | "rate_limited"
  | "unavailable"
  | "blocked";

const PHASES = [
  { at: 0, label: "Fikrin modele dönüştürülüyor" },
  { at: 450, label: "Uygun modeller taranıyor" },
  { at: 1400, label: "En yakın sonuçlar hazırlanıyor" },
] as const;

function phaseForElapsed(ms: number) {
  let label: (typeof PHASES)[number]["label"] = PHASES[0]!.label;
  for (const phase of PHASES) {
    if (ms >= phase.at) label = phase.label;
  }
  return label;
}

export function IdeaSearchSection() {
  const inputId = useId();
  const liveId = useId();
  const [query, setQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [status, setStatus] = useState<SearchUiStatus>("idle");
  const [phase, setPhase] = useState<(typeof PHASES)[number]["label"]>(
    PHASES[0].label,
  );
  const [chips, setChips] = useState<string[]>([]);
  const [items, setItems] = useState<IdeaSearchCard[]>([]);
  const [closest, setClosest] = useState(false);
  const [visibleCount, setVisibleCount] = useState(IDEA_SEARCH_MOBILE_PAGE_SIZE);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, { at: number; payload: IdeaSearchResponse }>>(
    new Map(),
  );

  const canSearch = query.trim().length >= 2;
  const showingPanel =
    status === "searching" ||
    status === "ok" ||
    status === "empty" ||
    status === "slow" ||
    status === "rate_limited" ||
    status === "unavailable" ||
    status === "blocked";

  useEffect(() => {
    if (query.trim() || status === "searching") return;
    const timer = window.setInterval(() => {
      setPlaceholderIndex((index) => (index + 1) % homepageIdeaPlaceholders.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [query, status]);

  useEffect(() => {
    if (status !== "searching") return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      setPhase(phaseForElapsed(Date.now() - started));
    }, 180);
    return () => window.clearInterval(timer);
  }, [status]);

  const runSearch = useCallback(async (raw: string) => {
    const nextQuery = raw.trim();
    if (nextQuery.length < 2) {
      setStatus("idle");
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const cached = cacheRef.current.get(nextQuery.toLocaleLowerCase("tr-TR"));
    if (cached && Date.now() - cached.at < 45_000) {
      applyPayload(cached.payload, nextQuery);
      return;
    }

    setStatus("searching");
    setPhase(PHASES[0].label);
    setErrorDetail(null);
    setClosest(false);
    setVisibleCount(IDEA_SEARCH_MOBILE_PAGE_SIZE);
    trackHomeEvent({ name: "idea_search_started" });
    announceStatus("Modeller aranıyor.");

    const timeout = window.setTimeout(() => controller.abort("timeout"), 12_000);

    try {
      const response = await fetch("/api/home/idea-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: nextQuery }),
        signal: controller.signal,
      });
      const payload = (await response.json()) as IdeaSearchResponse;
      if (controller.signal.aborted) return;
      cacheRef.current.set(nextQuery.toLocaleLowerCase("tr-TR"), {
        at: Date.now(),
        payload,
      });
      applyPayload(payload, nextQuery, response.status);
    } catch (error) {
      if (controller.signal.aborted && controller.signal.reason !== "timeout") {
        return;
      }
      const timedOut =
        controller.signal.reason === "timeout" ||
        (error instanceof DOMException && error.name === "AbortError");
      setItems([]);
      setStatus(timedOut ? "slow" : "unavailable");
      setErrorDetail(
        timedOut
          ? "Thingiverse şu an yavaş. Ana sayfanın geri kalanını kullanmaya devam edebilirsin."
          : "Bağlantı kurulamadı. Yeniden deneyebilirsin.",
      );
      announceStatus(timedOut ? "Arama zaman aşımına uğradı." : "Arama bağlantı hatası.");
    } finally {
      window.clearTimeout(timeout);
    }

    function applyPayload(
      payload: IdeaSearchResponse,
      usedQuery: string,
      httpStatus?: number,
    ) {
      void usedQuery;
      setChips(payload.chips ?? payload.variants ?? []);
      setItems(payload.items ?? []);
      setClosest(Boolean(payload.closest));
      const nextStatus = resolveStatus(payload.status, httpStatus, payload.items?.length ?? 0);
      setStatus(nextStatus);
      setErrorDetail(messageForStatus(nextStatus, payload.retryAfterSeconds));
      if (nextStatus === "ok") {
        trackHomeEvent({
          name: "idea_search_succeeded",
          category: payload.category,
          resultCount: payload.items?.length ?? 0,
          status: payload.closest ? "closest" : "ok",
        });
        announceStatus(`${payload.items?.length ?? 0} model bulundu.`);
      } else if (nextStatus === "empty") {
        trackHomeEvent({
          name: "idea_search_empty",
          category: payload.category,
          resultCount: 0,
        });
        announceStatus("Eşleşen model bulunamadı.");
      } else {
        announceStatus(messageForStatus(nextStatus, payload.retryAfterSeconds));
      }
    }
  }, []);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void runSearch(query);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void runSearch(query);
    }
  }

  const visibleItems = items.slice(0, visibleCount);
  const canShowMore = items.length > visibleCount;

  return (
    <section
      id="ne-uretmek-istiyorsun"
      className="home-section relative overflow-hidden"
      aria-labelledby="idea-search-heading"
    >
      <div className="pointer-events-none absolute inset-0 home-tech-grid opacity-25" />
      <div className="home-shell relative">
        <p className="text-[0.8125rem] font-semibold tracking-[0.14em] text-cyan uppercase">
          Keşif
        </p>
        <h2 id="idea-search-heading" className="home-title home-mask-reveal mt-2 max-w-xl">
          Ne üretmek istiyorsun?
        </h2>
        <p className="home-lede">
          Aklındakini birkaç kelimeyle anlat. Sana uygun 3D modelleri bulalım.
        </p>

        <form onSubmit={onSubmit} className="mt-6 max-w-2xl">
          <label htmlFor={inputId} className="sr-only">
            Üretmek istediğin nesneyi yaz
          </label>
          <div
            data-idea-search-field={status}
            className={cn(
              "home-composer p-2.5 sm:p-3",
              status === "searching" && "is-searching",
            )}
          >
            <div className="flex items-end gap-2">
              <textarea
                id={inputId}
                name="idea"
                rows={showingPanel ? 1 : 2}
                maxLength={160}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value.slice(0, 160));
                  setStatus(event.target.value.trim() ? "typing" : "idle");
                }}
                onKeyDown={onKeyDown}
                placeholder={homepageIdeaPlaceholders[placeholderIndex]}
                className="min-h-12 w-full resize-none bg-transparent px-3 py-3 text-base leading-7 text-[#f3efe6] outline-none placeholder:text-white/45"
              />
              <button
                type="submit"
                disabled={!canSearch && status !== "searching"}
                aria-label="Ara — Model önerilerini bul"
                className={cn(
                  "home-composer-submit home-cta-press inline-flex shrink-0 items-center justify-center gap-1.5 px-4 text-[0.9375rem] font-semibold",
                  canSearch && "is-armed",
                )}
              >
                {status === "searching" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Search className="size-4" aria-hidden="true" />
                )}
                Ara
              </button>
            </div>
            <div className="mt-1 flex items-center px-3 pb-1">
              <Link
                href={"/model-yukle" as Route}
                onClick={() => trackHomeEvent({ name: "upload_cta_clicked" })}
                className="inline-flex min-h-10 items-center gap-1.5 text-[0.875rem] font-semibold text-white/75 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
              >
                <Upload className="size-4" aria-hidden="true" />
                Dosyam hazır, yükle
              </Link>
            </div>

            {status === "searching" ? (
              <div className="mt-3 border-t border-white/8 px-2 pt-4 pb-2">
                <p className="text-base font-semibold">{phase}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(chips.length ? chips : ["nesne", "ölçü", "kullanım"]).map((chip) => (
                    <span
                      key={chip}
                      className="home-chip-in rounded-full bg-cyan/15 px-3 py-1 text-[0.8125rem] font-semibold text-cyan"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="home-shimmer overflow-hidden rounded-2xl bg-white/6">
                      <div className="aspect-[4/5] bg-white/8" />
                      <div className="space-y-2 p-3">
                        <div className="h-4 w-2/3 rounded bg-white/10" />
                        <div className="h-3 w-1/3 rounded bg-white/8" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {status === "ok" && visibleItems.length > 0 ? (
              <div className="mt-3 border-t border-white/8 px-1 pt-4 pb-2">
                {closest ? (
                  <div className="mb-3 px-2">
                    <h3 className="font-heading text-xl font-semibold tracking-[-0.03em]">
                      Yakın sonuçlar
                    </h3>
                    <p className="mt-1.5 text-base leading-7 text-white/80">
                      Tam eşleşme yok. Bunlar fikrine en yakın modeller; ana nesne
                      her başlıkta geçmeyebilir.
                    </p>
                  </div>
                ) : null}
                <ul className="grid gap-3 sm:grid-cols-2">
                  {visibleItems.map((item, index) => (
                    <li
                      key={item.externalId}
                      className="home-result-card"
                      style={{ animationDelay: `${index * 55}ms` }}
                    >
                      <IdeaResultCard item={item} />
                    </li>
                  ))}
                </ul>
                {canShowMore ? (
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((count) => count + IDEA_SEARCH_MOBILE_PAGE_SIZE)
                    }
                    className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-4 text-[0.9375rem] font-semibold"
                  >
                    Daha fazla göster
                  </button>
                ) : null}
              </div>
            ) : null}

            {status === "empty" ||
            status === "slow" ||
            status === "rate_limited" ||
            status === "unavailable" ||
            status === "blocked" ? (
              <div className="mt-3 border-t border-white/8 px-3 pt-4 pb-3">
                <h3 className="font-heading text-xl font-semibold tracking-[-0.03em]">
                  {emptyTitle(status)}
                </h3>
                <p className="mt-2 text-base leading-7 text-white/80">
                  {errorDetail ?? messageForStatus(status)}
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  {status === "empty" ? (
                    <button
                      type="button"
                      onClick={() => {
                        const simplified = query.split(/\s+/).slice(0, 2).join(" ");
                        setQuery(simplified);
                        void runSearch(simplified);
                      }}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-cyan px-4 text-[0.9375rem] font-semibold text-midnight"
                    >
                      Sorguyu sadeleştir
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void runSearch(query)}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-cyan px-4 text-[0.9375rem] font-semibold text-midnight"
                    >
                      Yeniden dene
                    </button>
                  )}
                  <Link
                    href={"/hazir-modeller" as Route}
                    onClick={() => trackHomeEvent({ name: "ready_model_cta_clicked" })}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-[0.9375rem] font-semibold underline-offset-4 hover:underline"
                  >
                    Hazır modellere git
                  </Link>
                  <Link
                    href={"/model-yukle" as Route}
                    onClick={() => trackHomeEvent({ name: "upload_cta_clicked" })}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-[0.9375rem] font-semibold underline-offset-4 hover:underline"
                  >
                    Dosyanı yükle
                  </Link>
                  <Link
                    href={"/iletisim" as Route}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-[0.9375rem] font-semibold underline-offset-4 hover:underline"
                  >
                    Model danışmanlığı
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </form>

        <div className="mt-6">
          <p className="text-[0.8125rem] font-semibold tracking-wide text-white/70 uppercase">
            Örnek fikirler · kaydır
          </p>
          <ul className="home-chip-rail mt-3">
            {homepageIdeaExamples.map((example) => (
              <li key={example.id} className="snap-start">
                <button
                  type="button"
                  onClick={() => {
                    setQuery(example.query);
                    setStatus("typing");
                    document.getElementById(inputId)?.focus();
                  }}
                  className="home-press-card group flex min-h-11 w-[12.5rem] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#f3efe6] text-left text-[#14161c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
                >
                  <span className="relative aspect-[16/10] overflow-hidden bg-[#d9d3c6]">
                    <SafeImage
                      src={example.imageUrl}
                      alt=""
                      fill
                      sizes="200px"
                      className="home-media-reveal object-cover brightness-110"
                    />
                  </span>
                  <span className="px-3 py-2.5 text-base leading-6 font-semibold">
                    {example.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div id={liveId} className="sr-only" aria-live="polite">
          {status === "searching" ? phase : errorDetail ?? ""}
        </div>
      </div>
    </section>
  );
}

interface IdeaSearchResponse {
  status?: SearchUiStatus | "unconfigured";
  category?: string | null;
  variants?: string[];
  chips?: string[];
  items?: IdeaSearchCard[];
  closest?: boolean;
  retryAfterSeconds?: number;
}

function resolveStatus(
  status: IdeaSearchResponse["status"],
  httpStatus: number | undefined,
  count: number,
): SearchUiStatus {
  if (httpStatus === 429 || status === "rate_limited") return "rate_limited";
  if (status === "slow") return "slow";
  if (status === "blocked") return "blocked";
  if (status === "unavailable" || status === "unconfigured") return "unavailable";
  if (status === "empty" || count === 0) return "empty";
  return "ok";
}

function messageForStatus(status: SearchUiStatus, retryAfter?: number) {
  if (status === "slow") {
    return "Thingiverse şu an yavaş. Ana sayfanın geri kalanını kullanmaya devam edebilirsin.";
  }
  if (status === "rate_limited") {
    return retryAfter
      ? `Arama sınırı. ${retryAfter} saniye sonra yeniden dene.`
      : "Arama sınırı. Kısa süre sonra yeniden dene.";
  }
  if (status === "unavailable") {
    return "Bağlantı kurulamadı. Hazır modeller veya dosya yükleme ile devam edebilirsin.";
  }
  if (status === "blocked") {
    return "Bu arama güvenlik politikası nedeniyle çalıştırılmadı.";
  }
  return "Tam eşleşme bulamadık. Sorguyu sadeleştirebilir, hazır model seçebilir veya dosyanı yükleyebilirsin.";
}

function emptyTitle(status: SearchUiStatus) {
  if (status === "slow") return "Thingiverse yavaşladı";
  if (status === "rate_limited") return "Biraz bekleyelim";
  if (status === "unavailable") return "Bağlantı hatası";
  if (status === "blocked") return "Arama yapılamadı";
  return "Tam eşleşme bulamadık";
}

function ideaQuoteAction(item: IdeaSearchCard) {
  if (item.quoteAction) return item.quoteAction;
  return item.pricingAllowed ? "verify" : "inspect";
}

function IdeaResultCard({ item }: { item: IdeaSearchCard }) {
  const action = ideaQuoteAction(item);
  const quoteLabel = externalQuoteCtaLabel(action);

  return (
    <article className="home-press-card flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#f3efe6] text-[#14161c]">
      <ModelCardMedia
        src={item.thumbnailUrl}
        alt={item.title}
        badge="Hazır 3D model"
        sizes="(max-width: 640px) 100vw, 50vw"
        className="aspect-[4/5] rounded-none bg-[#11161c] sm:rounded-none"
      />
      <div className="flex min-w-0 flex-1 flex-col p-3.5">
        <h3 className="line-clamp-2 font-heading text-base leading-6 font-semibold">
          {item.title}
        </h3>
        {item.likeCount != null ? (
          <p className="mt-1 text-[0.8125rem] leading-5 text-[#3d4148]">
            {item.likeCount} beğeni
          </p>
        ) : null}
        <div className="mt-3 flex flex-col gap-2">
          <Link
            href={item.detailPath as Route}
            onClick={() => trackHomeEvent({ name: "idea_result_opened" })}
            className="home-cta-press inline-flex min-h-11 items-center justify-center gap-1 rounded-xl bg-cyan/20 px-3 text-[0.9375rem] font-semibold text-midnight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
          >
            Modeli incele
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          {quoteLabel ? (
            <Link
              href={item.detailPath as Route}
              onClick={() => trackHomeEvent({ name: "idea_result_quote_started" })}
              className="home-cta-press inline-flex min-h-11 items-center justify-center rounded-xl border border-black/12 px-3 text-[0.9375rem] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
            >
              {quoteLabel}
            </Link>
          ) : null}
        </div>
        {action !== "quote" ? (
          <p className="mt-2 text-[0.8125rem] leading-5 text-[#3d4148]">
            {action === "inspect"
              ? "Bu model otomatik fiyata uygun değil. Önce detayı incele."
              : "Fiyat, lisans ve indirilebilir üretim dosyası doğrulanınca netleşir."}
          </p>
        ) : null}
      </div>
    </article>
  );
}
