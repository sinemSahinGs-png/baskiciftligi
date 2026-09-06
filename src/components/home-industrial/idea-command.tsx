"use client";

import type { Route } from "next";
import Link from "next/link";
import { useCallback, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { CadFrame, TechnicalGrid, TechnicalPlaceholder } from "@/components/home-industrial/technical-grid";
import { SlotImage } from "@/components/home-industrial/slot-image";
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

const CHIPS = [
  { label: "Telefon standı", query: "telefon standı" },
  { label: "Dekor", query: "dekor" },
  { label: "Yedek parça", query: "yedek parça" },
  { label: "İsme özel anahtarlık", query: "isme özel anahtarlık" },
] as const;

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

export function IdeaCommand() {
  const inputId = "idea-command-input";
  const liveId = useId();
  const [query, setQuery] = useState("");
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
    if (event.key === "Enter") {
      event.preventDefault();
      void runSearch(query);
    }
  }

  const visibleItems = items.slice(0, visibleCount);

  return (
    <section
      id="ne-uretmek-istiyorsun"
      data-home-theme="mono"
      className="hi-section relative overflow-hidden pt-6"
      aria-labelledby="idea-command-heading"
    >
      <TechnicalGrid />
      <div className="hi-shell relative">
        <p className="hi-mono mb-4">+ TASARLA ÜRET YAŞAT</p>
        <div className="relative">
          <div className="pointer-events-none absolute top-[-8%] right-[-6%] h-[78%] w-[58%] max-w-md opacity-40">
            <CadFrame className="relative h-full min-h-40">
              <TechnicalPlaceholder />
              <svg
                aria-hidden="true"
                viewBox="0 0 160 200"
                className="absolute inset-[12%] h-auto w-[76%] text-[color:var(--bc-white)]"
              >
                <ellipse cx="80" cy="28" rx="26" ry="8" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <path
                  d="M54 28 C50 70 42 118 58 176 H102 C118 118 110 70 106 28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <path d="M62 92 H98 M58 128 H102" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.7" />
                <ellipse cx="80" cy="176" rx="22" ry="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </CadFrame>
          </div>
          <h1 id="idea-command-heading" className="hi-display relative max-w-[11ch]">
            FİKRİNİ YAZ<span className="hi-dot">.</span>
            <br />
            BİZ ÜRETELİM<span className="hi-dot">.</span>
          </h1>
        </div>
        <p className="hi-lede">Hayalinden gerçeğe, 3D üretim burada başlar.</p>

        <form onSubmit={onSubmit} className="relative mt-6 max-w-2xl">
          <label htmlFor={inputId} className="sr-only">
            Üretmek istediğin nesneyi yaz
          </label>
          <div className={cn("hi-command-field", status === "searching" && "hi-scan")}>
            <input
              id={inputId}
              name="idea"
              maxLength={160}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value.slice(0, 160));
                setStatus(event.target.value.trim() ? "typing" : "idle");
              }}
              onKeyDown={onKeyDown}
              placeholder="Ne üretmek istiyorsun?"
            />
            <button
              type="submit"
              disabled={!canSearch && status !== "searching"}
              aria-label="Fikrine uygun modelleri bul"
              className="hi-command-go"
            >
              <ArrowRight className="size-5" aria-hidden="true" />
            </button>
          </div>
          <p className="hi-link mt-3 text-[0.8rem]">
            FİKRİME UYGUN MODELLERİ BUL
          </p>
          <p className="mt-1 text-[0.75rem] text-[color:var(--bc-muted)]">
            Ücretsiz model keşfi · Gerçek dilimleme · Anlık fiyat
          </p>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              className="hi-chip"
              onClick={() => {
                setQuery(chip.query);
                setStatus("typing");
                document.getElementById(inputId)?.focus();
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {status === "searching" ? (
          <p className="mt-4 text-sm font-medium">{phase}</p>
        ) : null}

        {status === "ok" && visibleItems.length > 0 ? (
          <div className="mt-5">
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
          <div className="mt-5 border border-[color:var(--bc-line)] p-4">
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
