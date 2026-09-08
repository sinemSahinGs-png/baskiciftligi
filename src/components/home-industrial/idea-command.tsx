"use client";

import type { Route } from "next";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { ArrowUpRight } from "lucide-react";
import { useReducedMotion } from "motion/react";

import { HeroVideo } from "@/components/home-industrial/hero-video";
import { HeroTypewriter } from "@/components/home-industrial/hero-typewriter";
import { TechnicalGrid } from "@/components/home-industrial/technical-grid";
import { SlotImage } from "@/components/home-industrial/slot-image";
import { HERO_IDEA_EXAMPLES } from "@/components/home-industrial/hero-media";
import { MagneticAction, WordReveal, useHeroPointer } from "@/components/motion/premium";
import { externalQuoteCtaLabel } from "@/domain/external-models/quote-action";
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

interface IdeaSearchResponse {
  status?: SearchUiStatus | "unconfigured";
  category?: string | null;
  variants?: string[];
  chips?: string[];
  items?: IdeaSearchCard[];
  closest?: boolean;
  retryAfterSeconds?: number;
}

const PHASES = [
  { at: 0, label: "Fikrin modele dönüştürülüyor" },
  { at: 450, label: "Uygun modeller taranıyor" },
  { at: 1400, label: "En yakın sonuçlar hazırlanıyor" },
] as const;

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

function ideaQuoteAction(item: IdeaSearchCard) {
  if (item.quoteAction) return item.quoteAction;
  return item.pricingAllowed ? "verify" : "inspect";
}

function emptySubscribe() {
  return () => undefined;
}

export function IdeaCommand() {
  const inputId = "idea-command-input";
  const liveId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const pauseRef = useRef(false);
  useHeroPointer(sectionRef);
  const reduceMotion = useReducedMotion() === true;
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [halted, setHalted] = useState(false);
  const [hadControl, setHadControl] = useState(false);
  const [inView, setInView] = useState(true);
  const [status, setStatus] = useState<SearchUiStatus>("idle");
  const [phase, setPhase] = useState<(typeof PHASES)[number]["label"]>(PHASES[0].label);
  const [items, setItems] = useState<IdeaSearchCard[]>([]);
  const [closest, setClosest] = useState(false);
  const [visibleCount, setVisibleCount] = useState(IDEA_SEARCH_MOBILE_PAGE_SIZE);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, { at: number; payload: IdeaSearchResponse }>>(new Map());
  const phaseTimer = useRef<number>(0);

  const canSearch = query.trim().length >= 2;
  const typewriterEnabled =
    isClient && !query && !focused && !halted && inView && status !== "searching";

  useEffect(() => {
    pauseRef.current = !inView;
  }, [inView]);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        setInView(entries.some((entry) => entry.isIntersecting && entry.intersectionRatio > 0.2));
      },
      { threshold: [0, 0.2, 0.5] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const applyPayload = useCallback(
    (payload: IdeaSearchResponse, httpStatus?: number) => {
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
    },
    [],
  );

  const runSearch = useCallback(
    async (raw: string) => {
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
        applyPayload(cached.payload);
        return;
      }

      setStatus("searching");
      setPhase(PHASES[0].label);
      setErrorDetail(null);
      setClosest(false);
      setVisibleCount(IDEA_SEARCH_MOBILE_PAGE_SIZE);
      trackHomeEvent({ name: "idea_search_started" });
      announceStatus("Modeller aranıyor.");
      window.clearInterval(phaseTimer.current);
      const started = Date.now();
      phaseTimer.current = window.setInterval(() => {
        const elapsed = Date.now() - started;
        let label: (typeof PHASES)[number]["label"] = PHASES[0].label;
        for (const item of PHASES) {
          if (elapsed >= item.at) label = item.label;
        }
        setPhase(label);
      }, 180);

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
        applyPayload(payload, response.status);
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
        window.clearInterval(phaseTimer.current);
      }
    },
    [applyPayload],
  );

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void runSearch(query);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setHalted(true);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      void runSearch(query);
    }
  }

  const visibleItems = items.slice(0, visibleCount);
  const suggesting = typewriterEnabled && !query;

  return (
    <section
      ref={sectionRef}
      id="ne-uretmek-istiyorsun"
      data-home-theme="mono"
      data-hero-first-example={HERO_IDEA_EXAMPLES[0]}
      className="hi-hero"
      aria-labelledby="idea-command-heading"
    >
      <HeroVideo reducedMotion={reduceMotion} />
      <TechnicalGrid className="hi-hero-grid" />
      <div className="hi-hero-vignette" aria-hidden="true" />
      <div className="hi-hero-copy-scrim" aria-hidden="true" />
      <div className="hi-hero-search-scrim" aria-hidden="true" />
      <div className="hi-hero-fade" aria-hidden="true" />
      <div className="hi-hero-path" aria-hidden="true" />
      <div className="hi-hero-inner">
        <div className="hi-hero-cluster">
        <div className="hi-hero-copy">
          <p className="hi-kicker">ÖZEL ÜRETİM · TEK PARÇA</p>
          <WordReveal
            as="h1"
            id="idea-command-heading"
            className="hi-hero-display"
            text="SEN TARİF ET. BİZ ÜRETELİM."
          />
          <span className="hi-hero-rule" aria-hidden="true" />
          <p className="hi-hero-lede">
            Fikrini yaz, sana uygun modelleri bulalım ve gerçek üretim maliyetini hesaplayalım.
          </p>
        </div>

        <div className="hi-hero-search">
        <form onSubmit={onSubmit} className="hi-hero-form">
          <label htmlFor={inputId} className="sr-only">
            Ne üretmek istediğinizi açıklayın
          </label>
          <div
            className={cn("hi-hero-field", status === "searching" && "hi-hero-scan")}
            data-suggesting={suggesting ? "true" : "false"}
            data-status={status}
          >
            {suggesting ? (
              <HeroTypewriter
                reducedMotion={reduceMotion}
                restart={hadControl}
                pauseRef={pauseRef}
              />
            ) : null}
            <input
              id={inputId}
              name="idea"
              maxLength={160}
              value={query}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => {
                setHadControl(true);
                setHalted(true);
                setQuery(event.target.value.slice(0, 160));
                setStatus(event.target.value.trim() ? "typing" : "idle");
              }}
              onFocus={() => {
                setHadControl(true);
                setFocused(true);
                setHalted(true);
              }}
              onClick={() => {
                setHadControl(true);
                setFocused(true);
                setHalted(true);
              }}
              onPaste={() => {
                setHadControl(true);
                setHalted(true);
              }}
              onBlur={() => {
                setFocused(false);
                if (!query) setHalted(false);
              }}
              onKeyDown={onKeyDown}
              placeholder="Örneğin: Beyaz Yatak Odası Lambası"
            />
          </div>
          <MagneticAction className="hi-hero-go-magnet">
            <button
              type="submit"
              disabled={!canSearch || status === "searching"}
              className="hi-hero-go"
            >
              MODEL ÖNERİLERİNİ BUL
              <span aria-hidden="true"> →</span>
            </button>
          </MagneticAction>
        </form>

        <Link
          href={"/model-yukle" as Route}
          onClick={() => trackHomeEvent({ name: "upload_cta_clicked" })}
          className="hi-hero-upload"
        >
          VEYA STL / 3MF DOSYANI YÜKLE
        </Link>
        </div>
        </div>

        {status === "searching" ? (
          <p className="hi-hero-results mt-4 text-sm font-medium">{phase}</p>
        ) : null}

        {status === "ok" && visibleItems.length > 0 ? (
          <div className="hi-hero-results mt-5">
            {closest ? (
              <p className="mb-3 text-sm text-[color:var(--bc-muted)]">
                Tam eşleşme yok. Bunlar fikrine en yakın modeller.
              </p>
            ) : null}
            <ul className="grid gap-px border border-[color:var(--bc-line)] sm:grid-cols-2">
              {visibleItems.map((item) => (
                <li key={item.externalId} className="border-[color:var(--bc-line)] bg-[color:var(--bc-panel)] sm:border-r sm:odd:border-r">
                  <IdeaResultCard item={item} />
                </li>
              ))}
            </ul>
            {items.length > visibleCount ? (
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + IDEA_SEARCH_MOBILE_PAGE_SIZE)}
                className="hi-link mt-3"
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
          <div className="hi-hero-results mt-5 border border-[color:var(--bc-line)] p-4">
            <h3 className="font-medium">
              {status === "unavailable"
                ? "Bağlantı hatası"
                : status === "empty"
                  ? "Tam eşleşme bulamadık"
                  : status === "slow"
                    ? "Thingiverse yavaşladı"
                    : status === "rate_limited"
                      ? "Biraz bekleyelim"
                      : "Arama yapılamadı"}
            </h3>
            <p className="mt-2 text-sm text-[color:var(--bc-muted)]">
              {errorDetail ?? messageForStatus(status)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={"/hazir-modeller" as Route} className="hi-link">
                Hazır modellere git
              </Link>
              <Link
                href={"/model-yukle" as Route}
                onClick={() => trackHomeEvent({ name: "upload_cta_clicked" })}
                className="hi-link"
              >
                Dosyanı yükle
              </Link>
              <Link href={"/iletisim" as Route} className="hi-link">
                Model danışmanlığı
              </Link>
            </div>
          </div>
        ) : null}

        <div id={liveId} className="sr-only" aria-live="polite">
          {status === "searching" ? phase : errorDetail ?? ""}
        </div>
      </div>
    </section>
  );
}

function IdeaResultCard({ item }: { item: IdeaSearchCard }) {
  const action = ideaQuoteAction(item);
  const quoteLabel = externalQuoteCtaLabel(action);

  return (
    <article className="flex h-full flex-col">
      <div className="relative aspect-[4/5] bg-[color:var(--bc-panel-2)]">
        <SlotImage
          src={item.thumbnailUrl}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
        />
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-sm font-semibold">{item.title}</h3>
        <div className="mt-3 flex flex-col gap-2">
          <Link
            href={item.detailPath as Route}
            onClick={() => trackHomeEvent({ name: "idea_result_opened" })}
            className="hi-link"
          >
            Modeli incele
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
          {quoteLabel ? (
            <Link
              href={item.detailPath as Route}
              onClick={() => trackHomeEvent({ name: "idea_result_quote_started" })}
              className="hi-link"
            >
              {quoteLabel}
            </Link>
          ) : null}
        </div>
        {action !== "quote" ? (
          <p className="mt-2 text-[0.75rem] leading-5 text-[color:var(--bc-muted)]">
            {action === "inspect"
              ? "Bu model otomatik fiyata uygun değil. Önce detayı incele."
              : "Fiyat, lisans ve indirilebilir üretim dosyası doğrulanınca netleşir."}
          </p>
        ) : null}
      </div>
    </article>
  );
}
