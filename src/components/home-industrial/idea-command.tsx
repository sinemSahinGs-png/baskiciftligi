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

import "./octo-sand-hero.css";
import { HeroVideo } from "@/components/home-industrial/hero-video";
import { OctoInteractiveSandHero } from "@/components/home-industrial/octo-interactive-sand-hero";
import { HeroTypewriter } from "@/components/home-industrial/hero-typewriter";
import { SlotImage } from "@/components/home-industrial/slot-image";
import { OCTO_TV_SHELL, OCTO_TV_MOBILE_MEDIA } from "@/lib/hero-sand/tv-screen";
import { MagneticAction, WordReveal, useHeroPointer } from "@/components/motion/premium";
import { externalQuoteCtaLabel } from "@/domain/external-models/quote-action";
import { trackHomeEvent } from "@/lib/home/analytics";
import { announceStatus } from "@/lib/motion";
import type { IdeaSearchCard } from "@/lib/model-discovery/idea-search";
import { IDEA_SEARCH_MOBILE_PAGE_SIZE } from "@/lib/model-discovery/idea-search";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

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

const PHASE_AT = [0, 450, 1400] as const;

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

function messageForStatus(
  t: ReturnType<typeof useTranslations>,
  status: SearchUiStatus,
  retryAfter?: number,
) {
  if (status === "slow") return t("home.statusSlow");
  if (status === "rate_limited") {
    return retryAfter
      ? t("home.statusRateWait", { n: retryAfter })
      : t("home.statusRate");
  }
  if (status === "unavailable") return t("checkout.connection");
  if (status === "blocked") return t("home.heroFail");
  return t("home.heroNoMatch");
}

function ideaQuoteAction(item: IdeaSearchCard) {
  if (item.quoteAction) return item.quoteAction;
  return item.pricingAllowed ? "verify" : "inspect";
}

function emptySubscribe() {
  return () => undefined;
}

export function IdeaCommand() {
  const t = useTranslations();
  const PHASES = [
    { at: PHASE_AT[0], label: t("home.phase1") },
    { at: PHASE_AT[1], label: t("home.phase2") },
    { at: PHASE_AT[2], label: t("home.phase3") },
  ];
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
  const [phase, setPhase] = useState(t("home.phase1"));
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
      setErrorDetail(messageForStatus(t, nextStatus, payload.retryAfterSeconds));
      if (nextStatus === "ok") {
        trackHomeEvent({
          name: "idea_search_succeeded",
          category: payload.category,
          resultCount: payload.items?.length ?? 0,
          status: payload.closest ? "closest" : "ok",
        });
        announceStatus(t("models.count", { n: payload.items?.length ?? 0 }));
      } else if (nextStatus === "empty") {
        trackHomeEvent({
          name: "idea_search_empty",
          category: payload.category,
          resultCount: 0,
        });
        announceStatus(t("home.heroNoMatch"));
      } else {
        announceStatus(messageForStatus(t, nextStatus, payload.retryAfterSeconds));
      }
    },
    [t],
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
        let label = PHASES[0].label;
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
      data-hero-first-example={t("home.example1")}
      className="hi-hero octo-tv-hero"
      aria-labelledby="idea-command-heading"
    >
      <div className="octo-tv-stage">
        <OctoInteractiveSandHero />
        <div className="octo-tv-frame">
          <picture className="octo-tv-shell-picture">
            <source media={OCTO_TV_MOBILE_MEDIA} srcSet={OCTO_TV_SHELL.mobile} type="image/webp" />
            <source media="(min-width: 768px)" srcSet={OCTO_TV_SHELL.desktop} type="image/webp" />
            <img
              className="octo-tv-shell"
              src={OCTO_TV_SHELL.desktop}
              alt=""
              width={1803}
              height={872}
              decoding="async"
              fetchPriority="high"
            />
          </picture>
          <div className="octo-tv-screen" data-octo-tv-screen="">
            <HeroVideo reducedMotion={reduceMotion} />
            <div className="octo-tv-glass" aria-hidden="true" />
          </div>
          <div className="octo-tv-content">
      <div className="hi-hero-inner">
        <div className="hi-hero-cluster">
        <div className="hi-hero-copy">
          <p className="hi-kicker">{t("home.heroKicker")}</p>
          <WordReveal
            as="h1"
            id="idea-command-heading"
            className="hi-hero-display"
            text={t("home.heroTitle")}
          />
          <span className="hi-hero-rule" aria-hidden="true" />
          <div className="octo-hero-actions">
            <Link href={"/magaza" as Route} className="octo-cta">
              {t("home.heroPrimary")}
            </Link>
            <Link
              href={"/model-yukle" as Route}
              onClick={() => trackHomeEvent({ name: "upload_cta_clicked" })}
              className="octo-cta-ghost"
            >
              {t("home.heroSecondary")}
            </Link>
          </div>
          <p className="hi-hero-lede">
            {t("home.heroLede")}
          </p>
        </div>

        <div className="hi-hero-search">
        <form onSubmit={onSubmit} className="hi-hero-form">
          <label htmlFor={inputId} className="sr-only">
            {t("home.heroLabel")}
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
              placeholder={t("home.heroPlaceholder")}
            />
          </div>
          <MagneticAction className="hi-hero-go-magnet">
            <button
              type="submit"
              disabled={!canSearch || status === "searching"}
              className="hi-hero-go"
            >
              {t("home.heroFind")}
              <span aria-hidden="true"> →</span>
            </button>
          </MagneticAction>
        </form>
        </div>
        </div>
          </div>
          </div>
        </div>
        <p className="octo-scroll-hint octo-tv-scroll">
          {t("home.heroScroll")}
          <span />
        </p>
      </div>

      <div className="octo-tv-below">
        {status === "searching" ? (
          <p className="hi-hero-results mt-4 text-sm font-medium">{phase}</p>
        ) : null}

        {status === "ok" && visibleItems.length > 0 ? (
          <div className="hi-hero-results mt-5">
            {closest ? (
              <p className="mb-3 text-sm text-[color:var(--bc-muted)]">
                {t("home.heroClosest")}
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
                {t("home.heroMore")}
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
                ? t("home.heroConn")
                : status === "empty"
                  ? t("home.heroNoMatch")
                  : status === "slow"
                    ? t("home.heroSlowTitle")
                    : status === "rate_limited"
                      ? t("home.heroWait")
                      : t("home.heroFail")}
            </h3>
            <p className="mt-2 text-sm text-[color:var(--bc-muted)]">
              {errorDetail ?? messageForStatus(t, status)}
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
