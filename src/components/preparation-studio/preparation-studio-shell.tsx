"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  AlertCircle,
  ChevronDown,
  Crosshair,
  GripHorizontal,
  Layers,
  Maximize2,
  Move,
  RotateCcw,
  RotateCw,
  Ruler,
  Scan,
  UploadCloud,
} from "lucide-react";

import { FormSignal } from "@/components/brand/form-signal";
import type { StudioTool } from "@/components/preparation-studio/build-plate-viewport";
import { previewColorHex } from "@/components/preparation-studio/preview-colors";
import {
  defaultSessionSnapshot,
  savePreparationSession,
} from "@/components/preparation-studio/session-persistence";
import { useGeometryLoader } from "@/components/preparation-studio/use-geometry-loader";
import { siteConfig } from "@/config/site";
import {
  buildAutoOrientCandidates,
  nextAutoOrientCandidate,
  quickLayFlatTransform,
} from "@/domain/manufacturing/auto-orient";
import { evaluateBuildVolumeFit } from "@/domain/manufacturing/build-volume-fit";
import {
  COLOR_OPTIONS,
  DEVELOPMENT_PRINTER,
  QUALITY_PROFILES,
} from "@/domain/manufacturing/profiles";
import {
  DEFAULT_MANUFACTURING_TRANSFORM,
  normalizeTransform,
  serializeTransformForUpload,
  uniformScalePercent,
  type ManufacturingTransform,
} from "@/domain/manufacturing/transform";
import {
  applyUniformScaleFromPercent,
  centerOnPlateTransform,
  computeOrientedBounds,
  placeOnBedTransform,
} from "@/domain/manufacturing/transform-math";
import {
  canRedoTransform,
  canUndoTransform,
  commitTransformHistory,
  createTransformHistory,
  redoTransformHistory,
  undoTransformHistory,
} from "@/domain/manufacturing/transform-history";
import {
  mapAnalysisError,
  mapWorkerOfflinePollingError,
} from "@/domain/manufacturing/worker-errors";
import { formatMoney } from "@/lib/money";
import { applyExternalProductionOptions } from "@/lib/models/apply-production-options";
import {
  peekPendingExternalUpload,
  takePendingExternalUpload,
  type ExternalQuoteModelContext,
} from "@/lib/models/external-quote-context";
import { announceStatus } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";

const BuildPlateViewport = dynamic(
  () =>
    import("@/components/preparation-studio/build-plate-viewport").then(
      (mod) => mod.BuildPlateViewport,
    ),
  { ssr: false },
);

const MAX_BYTES = 100 * 1024 * 1024;
const ALLOWED = [".stl", ".obj", ".3mf"];
const RIGHTS =
  "Bu dosyayı üretme ve çoğaltma hakkına sahip olduğumu ve kaynak modelin lisans koşullarını kontrol ettiğimi onaylıyorum.";
const TABS = [
  ["model", "Model"],
  ["transform", "Transform"],
  ["production", "Production"],
  ["quality", "Quality"],
  ["quantity", "Quantity"],
  ["analysis", "Analiz"],
] as const;
type TabId = (typeof TABS)[number][0];

type Quote = { id: string; grossMinor: number; netMinor: number; vatMinor: number; duration: number; grams: number; reviewRequired: boolean };
const fmtMm = (v: number) => `${v.toFixed(1)} mm`;
const fmtDur = (s: number) => { const h = Math.floor(s / 3600); const m = Math.round((s % 3600) / 60); return h <= 0 ? `${m} dk` : `${h} sa ${m} dk`; };
const allowedFile = (f: File) => ALLOWED.some((ext) => f.name.toLocaleLowerCase("tr-TR").endsWith(ext));

export function PreparationStudio() {
  const router = useRouter();
  const addLine = useCartStore((s) => s.addLine);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rights, setRights] = useState(false);
  const [tab, setTab] = useState<TabId>("model");
  const [activeTool, setActiveTool] = useState<StudioTool>("select");
  const [wireframe, setWireframe] = useState(false);
  const [fitKey, setFitKey] = useState(0);
  const [resetCameraKey, setResetCameraKey] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [history, setHistory] = useState(createTransformHistory);
  const [autoIdx, setAutoIdx] = useState(-1);
  const [technology, setTechnology] = useState<"FDM" | "SLA">("FDM");
  const [colorId, setColorId] = useState("black");
  const [preset, setPreset] = useState<"ekonomik" | "standart" | "detayli">("standart");
  const [infill, setInfill] = useState(20);
  const [supports, setSupports] = useState<"auto" | "on" | "off">("auto");
  const [quantity, setQuantity] = useState(1);
  const [placeOnBed, setPlaceOnBed] = useState(true);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobLabel, setJobLabel] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [analysisStale, setAnalysisStale] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [workerOnline, setWorkerOnline] = useState<boolean | null>(null);
  const [handoff] = useState(() =>
    typeof window === "undefined" ? null : peekPendingExternalUpload(),
  );
  const [externalContext, setExternalContext] = useState<ExternalQuoteModelContext | null>(
    () => handoff?.context ?? null,
  );

  const { geometry, status, originalDimensionsMm, triangleCount } = useGeometryLoader(file);
  const bed = DEVELOPMENT_PRINTER.buildVolumeMm;
  const transform = history.present;
  const dims = useMemo(
    () =>
      originalDimensionsMm
        ? computeOrientedBounds(originalDimensionsMm, transform).dimensions
        : null,
    [originalDimensionsMm, transform],
  );
  const fit = useMemo(
    () =>
      originalDimensionsMm
        ? evaluateBuildVolumeFit(originalDimensionsMm, transform, bed)
        : null,
    [originalDimensionsMm, transform, bed],
  );
  const scalePct = uniformScalePercent(transform);
  const autoCandidates = useMemo(
    () =>
      originalDimensionsMm ? buildAutoOrientCandidates(originalDimensionsMm, bed, transform) : [],
    [originalDimensionsMm, bed, transform],
  );

  const invalidateQuote = useCallback(() => {
    setAnalysisStale(true);
    setQuote(null);
    setJobId(null);
    setJobLabel(null);
  }, []);

  const applyTransform = useCallback(
    (next: ManufacturingTransform) => {
      let t = normalizeTransform({ ...next, placeOnBed });
      if (placeOnBed && originalDimensionsMm) t = placeOnBedTransform(t, originalDimensionsMm);
      setHistory((s) => commitTransformHistory(s, t));
      invalidateQuote();
    },
    [invalidateQuote, originalDimensionsMm, placeOnBed],
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    void fetch("/api/manufacturing/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((p: { worker?: { online?: boolean } }) => setWorkerOnline(Boolean(p.worker?.online)))
      .catch(() => setWorkerOnline(false));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      setHistory((s) => (e.shiftKey ? redoTransformHistory(s) : undoTransformHistory(s)));
      invalidateQuote();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [invalidateQuote]);

  useEffect(() => {
    savePreparationSession({
      ...defaultSessionSnapshot(),
      material: "PLA",
      colorId,
      preset,
      infill,
      supports,
      quantity,
      technology,
      transform,
      fileName: file?.name ?? null,
      externalTitle: externalContext?.title ?? null,
    });
  }, [colorId, externalContext?.title, file?.name, infill, preset, quantity, supports, technology, transform]);

  const acceptFile = useCallback(
    (next: File, opts?: { rightsOk?: boolean }) => {
      if (!allowedFile(next)) return setError("Yalnızca STL, 3MF veya OBJ seçilebilir.");
      if (next.size > MAX_BYTES) return setError("Dosya 100 MB sınırını aşıyor.");
      setError(null);
      setFile(next);
      invalidateQuote();
      setHistory(createTransformHistory());
      setAutoIdx(-1);
      if (opts?.rightsOk) setRights(true);
      setTab("model");
      setMobileOpen(false);
      announceStatus(`${next.name} yerel olarak okunuyor.`);
    },
    [invalidateQuote],
  );

  const handoffApplied = useRef(false);
  useEffect(() => {
    const root = globalThis as typeof globalThis & { __bcHandoffConsumed?: boolean };
    if (handoffApplied.current || root.__bcHandoffConsumed) return;
    const pending = takePendingExternalUpload() ?? handoff;
    if (!pending) return;
    handoffApplied.current = true;
    root.__bcHandoffConsumed = true;
    queueMicrotask(() => {
      setExternalContext(pending.context);
      setRights(true);
      applyExternalProductionOptions({
        material: () => undefined,
        colorId: setColorId,
        scalePercent: (v) => applyTransform(applyUniformScaleFromPercent(transform, v)),
        quantity: setQuantity,
        options: pending.context.productionOptions,
      });
      acceptFile(pending.file, { rightsOk: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handoff]);

  const geometryError =
    status === "corrupt" || status === "unsupported"
      ? "Bu dosya geçerli bir STL, OBJ veya 3MF değil."
      : null;

  async function submitJob() {
    if (!rights) return setError(RIGHTS);
    if (!file) return setError("Önce bir dosya seçin.");
    setSubmitting(true);
    setError(null);
    setQuote(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("rightsConfirmed", "true");
      form.set("materialId", "pla");
      form.set("colorId", colorId);
      form.set("qualityId", preset);
      form.set("infillPercent", String(infill));
      form.set("supports", supports);
      form.set("scalePercent", String(scalePct));
      form.set("quantity", String(quantity));
      form.set("unit", "mm");
      form.set("manufacturingTransform", serializeTransformForUpload(transform));
      if (externalContext) {
        form.set("externalModelId", externalContext.externalModelId);
        form.set("sourceType", externalContext.sourceType);
        form.set("sourceUrl", externalContext.sourceUrl);
        form.set("sourceTitle", externalContext.title);
        if (externalContext.attribution) form.set("attribution", externalContext.attribution);
        if (externalContext.licenseVerified && externalContext.licenseName) {
          form.set("licenseName", externalContext.licenseName);
          form.set("licenseVerified", "true");
        }
      }
      const res = await fetch("/api/manufacturing/uploads", { method: "POST", body: form });
      const payload = (await res.json()) as { error?: string; jobId?: string };
      if (!res.ok) throw new Error(payload.error ?? "Yükleme doğrulanamadı.");
      if (!payload.jobId) throw new Error("İş oluşturulamadı.");
      setJobId(payload.jobId);
      setAnalysisStale(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gönderim başarısız.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    const started = Date.now();
    let timer = 0;
    const poll = async () => {
      const res = await fetch(`/api/manufacturing/jobs/${jobId}`, { cache: "no-store" });
      const p = (await res.json()) as { state?: string; stateLabel?: string; quoteId?: string | null; errorCode?: string | null; errorMessage?: string | null };
      if (cancelled) return;
      setJobLabel(p.stateLabel ?? null);
      if (p.stateLabel) announceStatus(p.stateLabel);
      if (p.quoteId) {
        const q = (await (await fetch(`/api/manufacturing/quotes/${p.quoteId}`, { cache: "no-store" })).json()) as { id: string; breakdown: { grossMinor: number; netMinor: number; vatMinor: number; productionDurationSeconds: number; reviewRequired: boolean }; metrics: { filamentWeightGrams: number } };
        setQuote({ id: q.id, grossMinor: q.breakdown.grossMinor, netMinor: q.breakdown.netMinor, vatMinor: q.breakdown.vatMinor, duration: q.breakdown.productionDurationSeconds, grams: q.metrics.filamentWeightGrams, reviewRequired: q.breakdown.reviewRequired });
        return;
      }
      if (p.state === "failed") { const m = mapAnalysisError({ errorCode: p.errorCode, errorMessage: p.errorMessage, state: p.state }); setError(`${m.title}. ${m.message}`); return; }
      if (Date.now() - started > 600_000) { const m = mapAnalysisError({ errorCode: "timeout" }); setError(`${m.title}. ${m.message}`); return; }
      if (Date.now() - started > 20_000 && (p.state === "uploaded" || p.state === "created")) { const m = mapWorkerOfflinePollingError(); setError(`${m.title}. ${m.message}`); return; }
      timer = window.setTimeout(() => void poll(), 2000);
    };
    void poll();
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [jobId]);

  async function addQuoteToCart() {
    if (!quote) return;
    const res = await fetch(`/api/manufacturing/quotes/${quote.id}/cart`, { method: "POST" });
    const payload = (await res.json()) as {
      error?: string;
      line?: { productId: string; quoteId: string; quantity: number };
    };
    if (!res.ok || !payload.line) return setError(payload.error ?? "Teklif sepete eklenemedi.");
    addLine({
      productId: payload.line.productId,
      quoteId: payload.line.quoteId,
      quantity: payload.line.quantity,
    });
    router.push("/sepet");
  }

  const onDrop = (e: DragEvent<HTMLElement>) => { e.preventDefault(); const next = e.dataTransfer.files[0]; if (next) acceptFile(next); };
  const onChange = (e: ChangeEvent<HTMLInputElement>) => { const next = e.target.files?.[0]; if (next) acceptFile(next); };
  const layFlat = () => {
    if (!originalDimensionsMm) return;
    const next = quickLayFlatTransform(originalDimensionsMm, transform);
    if (next) applyTransform(next);
  };
  const autoOrient = () => {
    const c = nextAutoOrientCandidate(autoCandidates, autoIdx);
    if (!c) return;
    setAutoIdx((i) => (i + 1) % autoCandidates.length);
    applyTransform(c.transform);
  };
  const center = () => {
    if (!originalDimensionsMm) return;
    applyTransform(centerOnPlateTransform(transform, originalDimensionsMm, bed));
  };
  const reset = () => {
    applyTransform({ ...DEFAULT_MANUFACTURING_TRANSFORM, source: "reset" });
    setResetCameraKey((v) => v + 1);
  };

  const priceHint = quote ? `${formatMoney(quote.grossMinor)} KDV dahil` : "Fiyat, dilimleme bitince görünür";
  const tools = [
    { id: "select", label: "Seç", icon: Crosshair, tool: "select" as const },
    { id: "rotate", label: "Döndür", icon: RotateCw, tool: "rotate" as const },
    { id: "scale", label: "Ölçekle", icon: Maximize2, tool: "scale" as const },
    { id: "move", label: "Taşı", icon: Move, tool: "move" as const },
    { id: "lay", label: "Düzle", icon: Layers, run: layFlat },
    { id: "auto", label: "Oto yön", icon: Scan, run: autoOrient },
    { id: "center", label: "Ortala", icon: Crosshair, run: center },
    { id: "reset", label: "Sıfırla", icon: RotateCcw, run: reset },
    { id: "wire", label: "Tel kafes", icon: Ruler, run: () => setWireframe((v) => !v) },
  ];
  const tabNav = (
    <nav aria-label="İnceleyici sekmeleri" className="flex gap-1 overflow-x-auto border-b border-white/10 px-2 py-2 text-xs">
      {TABS.map(([id, label]) => (
        <button key={id} type="button" onClick={() => setTab(id)} className={cn("shrink-0 rounded-md px-2 py-1.5 font-semibold", tab === id ? "bg-cobalt text-light-text" : "text-muted-light")}>{label}</button>
      ))}
    </nav>
  );

  const inspector = (
    <div className="space-y-4 p-4">
      {tab === "model" && (
        <>
          <h2 className="font-heading text-xl font-bold">Model</h2>
          <label htmlFor="model-file" onDragOver={(e) => e.preventDefault()} onDrop={onDrop} className="mt-3 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-cyan/40 bg-midnight/50 px-4 text-center">
            <UploadCloud className="size-6 text-cyan" aria-hidden="true" />
            <span className="mt-2 text-sm font-semibold">Sürükle veya dosya seç</span>
          </label>
          {file ? <p className="text-sm">{file.name}{triangleCount ? ` · ${triangleCount} üçgen` : ""}</p> : null}
          <label className="flex items-start gap-3 text-sm leading-6">
            <input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} className="mt-1" />
            <span>{RIGHTS}</span>
          </label>
        </>
      )}
      {tab === "transform" && (
        <>
          <h2 className="font-heading text-xl font-bold">Transform</h2>
          <h3 className="mt-2 text-sm font-semibold">Baskı yönü</h3>
          <p className="text-xs text-muted-light">Modelin tablaya hangi yönde yerleşeceğini belirle.</p>
          {dims ? <p className="text-sm">{fmtMm(dims.x)} × {fmtMm(dims.y)} × {fmtMm(dims.z)}</p> : null}
          <label className="block text-sm font-semibold">Ölçek %{scalePct}
            <input type="range" min={10} max={400} value={scalePct} onChange={(e) => applyTransform(applyUniformScaleFromPercent(transform, Number(e.target.value)))} className="mt-2 w-full" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={placeOnBed} onChange={(e) => { setPlaceOnBed(e.target.checked); applyTransform({ ...transform, placeOnBed: e.target.checked }); }} />
            Plakaya oturt
          </label>
          <div className="flex gap-2">
            <button type="button" disabled={!canUndoTransform(history)} onClick={() => { setHistory((s) => undoTransformHistory(s)); invalidateQuote(); }} className="min-h-10 flex-1 rounded-md border border-white/15 text-sm disabled:opacity-40">Geri al</button>
            <button type="button" disabled={!canRedoTransform(history)} onClick={() => { setHistory((s) => redoTransformHistory(s)); invalidateQuote(); }} className="min-h-10 flex-1 rounded-md border border-white/15 text-sm disabled:opacity-40">Yinele</button>
          </div>
        </>
      )}
      {tab === "production" && (
        <>
          <h2 className="font-heading text-xl font-bold">Production</h2>
          <div className="grid gap-2">{(["FDM", "SLA"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTechnology(t)} className={cn("rounded-md border px-3 py-2 text-sm", technology === t ? "border-violet bg-violet/20" : "border-white/12")}>{t}</button>
          ))}</div>
          <div className="grid grid-cols-2 gap-2">{COLOR_OPTIONS.map((c) => (
            <button key={c.id} type="button" onClick={() => setColorId(c.id)} className={cn("min-h-10 rounded-md border text-sm", colorId === c.id ? "border-cyan bg-cyan/20" : "border-white/12")}>{c.label}</button>
          ))}</div>
        </>
      )}
      {tab === "quality" && (
        <>
          <h2 className="font-heading text-xl font-bold">Quality</h2>
          <div className="grid gap-2">{QUALITY_PROFILES.map((q) => (
            <button key={q.id} type="button" onClick={() => setPreset(q.id as typeof preset)} className={cn("min-h-10 rounded-md border px-3 text-sm font-semibold", preset === q.id ? "border-info bg-info text-light-text" : "border-white/12")}>{q.name} · {q.layerHeightMm} mm</button>
          ))}</div>
          <label className="block text-sm font-semibold">Dolgu %{infill}
            <select value={infill} onChange={(e) => setInfill(Number(e.target.value))} className="mt-2 h-10 w-full rounded-md border border-white/15 bg-midnight px-3">{[10, 15, 20, 30, 50, 100].map((v) => <option key={v} value={v}>%{v}</option>)}</select>
          </label>
          <label className="block text-sm font-semibold">Destek
            <select value={supports} onChange={(e) => setSupports(e.target.value as typeof supports)} className="mt-2 h-10 w-full rounded-md border border-white/15 bg-midnight px-3">
              <option value="auto">Otomatik</option><option value="on">Açık</option><option value="off">Kapalı</option>
            </select>
          </label>
        </>
      )}
      {tab === "quantity" && (
        <>
          <h2 className="font-heading text-xl font-bold">Quantity</h2>
          <label className="block text-sm font-semibold">Adet
            <input type="number" min={1} max={20} value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} className="mt-2 h-10 w-full rounded-md border border-white/15 bg-midnight px-3" />
          </label>
        </>
      )}
      {tab === "analysis" && (
        <>
          <h2 className="font-heading text-xl font-bold">Analiz</h2>
          {fit && !fit.fits ? <p className="text-sm text-warm">Model plakaya sığmıyor.</p> : null}
          {workerOnline === false ? <p className="rounded-md border border-warm/40 bg-warm/10 px-3 py-2 text-sm">{mapWorkerOfflinePollingError().message}</p> : null}
          {jobLabel && !quote ? <p className="flex items-center gap-2 text-sm"><FormSignal spinning className="size-4" />{jobLabel}</p> : null}
          {quote ? (
            <div className="space-y-1 rounded-md border border-lime/30 bg-lime/10 px-3 py-2 text-sm">
              <p className="font-semibold">{quote.reviewRequired ? "Geçici teklif" : "Otomatik teklif hazır"}</p>
              <p>{formatMoney(quote.grossMinor)} KDV dahil</p>
              <p>{quote.grams.toFixed(2)} g · {fmtDur(quote.duration)}</p>
              <p>Net {formatMoney(quote.netMinor)} · KDV {formatMoney(quote.vatMinor)}</p>
            </div>
          ) : <p className="rounded-md border border-white/15 px-3 py-2 text-sm">Fiyat, PrusaSlicer çıktısı olmadan gösterilmez.</p>}
          <button type="button" disabled={!rights || submitting || !file || technology === "SLA"} onClick={() => void submitJob()} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-cobalt text-sm font-semibold text-light-text disabled:opacity-40">{submitting ? "Gönderiliyor" : "Analiz et ve fiyatı hesapla"}</button>
          <button type="button" disabled={!quote} onClick={() => void addQuoteToCart()} className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-cyan text-sm font-semibold disabled:opacity-40">Teklifi sepete ekle</button>
          <p className="text-xs text-muted-light">{siteConfig.name} fiyatı tarayıcıdan kabul etmez.</p>
        </>
      )}
      {error || geometryError ? (
        <p role="alert" className="flex gap-2 text-sm text-error">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {error ?? geometryError}
        </p>
      ) : null}
      {analysisStale && quote ? <p className="text-xs text-warm">Dönüşüm değişti; analizi yenileyin.</p> : null}
    </div>
  );

  const toolRail = (vertical: boolean) => (
    <div className={cn("flex gap-1 border-white/10 bg-carbon p-1", vertical ? "w-14 shrink-0 flex-col border-r" : "border-t")}>
      {tools.map((t) => {
        const Icon = t.icon;
        const active = t.id === "wire" ? wireframe : "tool" in t && t.tool === activeTool;
        return (
          <button key={t.id} type="button" aria-label={t.label} title={t.label} onClick={() => { if ("run" in t && t.run) t.run(); else if ("tool" in t && t.tool) setActiveTool(t.tool); }} className={cn("inline-flex min-h-11 items-center justify-center rounded-md text-xs font-semibold", vertical ? "w-full flex-col gap-1 px-1 py-2" : "flex-1 px-2", active ? "bg-cyan/20 text-cyan" : "text-muted-light hover:bg-white/8")}>
            <Icon className="size-4" aria-hidden="true" />{vertical ? <span className="text-[10px] leading-none">{t.label}</span> : null}
          </button>
        );
      })}
    </div>
  );

  return (
    <div data-testid="configurator-shell" className="flex h-[calc(100svh-4rem)] min-h-[calc(100svh-4rem)] min-w-0 flex-col bg-midnight text-light-text lg:grid lg:min-h-[calc(100svh-4rem)] lg:grid-rows-[auto_1fr_auto]">
      {externalContext ? <p className="border-b border-white/10 bg-white/5 px-4 py-2 text-xs text-muted-light lg:col-span-full">Hazır modelden devam ediyorsun: {externalContext.title}</p> : null}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2 lg:col-span-full">
        <p className="flex items-center gap-2 text-sm"><FormSignal className="size-4" />Görüntüleyici · {file?.name ?? "Dosya seçilmedi"}</p>
        <div className="flex flex-wrap gap-1">
          <button type="button" className="min-h-10 px-3 text-sm" onClick={() => setFitKey((v) => v + 1)}>Sığdır</button>
          <button type="button" className="min-h-10 px-3 text-sm" onClick={reset}>Sıfırla</button>
          <button type="button" aria-label="Tel kafes" className="min-h-10 px-3 text-sm" onClick={() => setWireframe((v) => !v)}>Tel kafes</button>
          <button type="button" className="min-h-10 rounded-md bg-cobalt px-3 text-sm font-semibold" onClick={() => { setTab("analysis"); if (!isDesktop) setMobileOpen(true); }}>Analiz et</button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col lg:col-span-full lg:grid lg:grid-cols-[3.5rem_minmax(0,1fr)_20rem]">
        {isDesktop ? toolRail(true) : null}
        <section data-testid="mesh-viewer" className={cn("relative min-h-0", isDesktop ? "min-h-[28rem]" : "h-[42svh] shrink-0")}>
          <input id="model-file" type="file" accept=".stl,.obj,.3mf" onChange={onChange} className="sr-only" />
          <div className="h-full" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
            {file ? <BuildPlateViewport geometry={geometry} transform={transform} activeTool={activeTool} previewColor={previewColorHex(colorId)} wireframe={wireframe} showBoundingBox={false} buildVolumeMm={bed} fitKey={fitKey} resetCameraKey={resetCameraKey} reducedMotion={typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches} onTransformCommit={applyTransform} /> : <div className="grid h-full place-items-center p-8 text-center text-sm text-muted-light">Dosya seçildiğinde gerçek mesh burada açılır.</div>}
          </div>
          {dims ? <><span className="pointer-events-none absolute top-14 left-10 z-10 text-xs text-cyan/80">X {dims.x.toFixed(1)}</span><span className="pointer-events-none absolute top-14 right-10 z-10 text-xs text-cyan/80">Y {dims.y.toFixed(1)}</span><span className="pointer-events-none absolute right-10 bottom-14 z-10 text-xs text-cyan/80">Z {dims.z.toFixed(1)}</span></> : null}
          {status === "parsing" ? <p className="absolute bottom-3 left-3 z-10 text-xs">Model okunuyor</p> : null}
          {geometryError ? (
            <p role="alert" className="absolute top-3 left-3 z-10 max-w-[min(100%,20rem)] rounded-md border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">
              {geometryError}
            </p>
          ) : null}
        </section>
        {isDesktop ? <aside className="flex w-80 min-w-80 flex-col border-l border-white/10 bg-carbon">{tabNav}<div className="min-h-0 flex-1 overflow-y-auto">{inspector}</div></aside> : null}
        {!isDesktop ? (
          <div data-testid="config-drawer" data-expanded={mobileOpen ? "true" : "false"} className={cn("z-30 flex flex-col border-t border-white/10 bg-carbon pb-[env(safe-area-inset-bottom)]", mobileOpen ? "min-h-0 max-h-[58%] flex-1" : "shrink-0")}>
            {toolRail(false)}
            <button type="button" aria-label="İnceleyici panelini sürükle" onClick={() => setMobileOpen((o) => !o)} className="flex min-h-8 items-center justify-center pt-1"><GripHorizontal className="size-5 text-muted-light" aria-hidden="true" /></button>
            <div className="flex items-center justify-between gap-2 px-4 pb-2"><p className="min-w-0 truncate text-sm font-semibold">{file?.name ?? "Dosya seçilmedi"}{dims ? ` · ${fmtMm(dims.x)} × ${fmtMm(dims.y)} × ${fmtMm(dims.z)}` : ""}</p><button type="button" aria-expanded={mobileOpen} onClick={() => setMobileOpen((o) => !o)} className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-md px-3 text-sm font-semibold">{mobileOpen ? "Küçült" : "Genişlet"}<ChevronDown className={cn("size-4 transition-transform", mobileOpen && "rotate-180")} aria-hidden="true" /></button></div>
            <div className="flex items-center justify-between gap-3 px-4 pb-3"><p className="min-w-0 truncate text-xs text-muted-light">{priceHint}</p><button type="button" disabled={!rights || submitting || !file || technology === "SLA"} onClick={() => void submitJob()} className="inline-flex min-h-10 shrink-0 items-center rounded-md bg-cobalt px-3 text-sm font-semibold text-light-text disabled:opacity-40">{submitting ? "Gönderiliyor" : "Analiz et ve fiyatı hesapla"}</button></div>
            {mobileOpen ? <div className="min-h-0 flex-1 overflow-y-auto">{tabNav}{inspector}</div> : <div className="px-2 pb-2">{tabNav}</div>}
          </div>
        ) : null}
      </div>
      <footer className="flex items-center justify-between gap-3 border-t border-white/10 bg-carbon px-4 py-2 text-xs lg:col-span-full"><p className="truncate">{file?.name ?? "Dosya seçilmedi"}</p><p className="text-muted-light">{priceHint}</p>{fit ? <p className={fit.fits ? "text-lime" : "text-warm"}>{fit.fits ? "Plakaya sığıyor" : "Sığmıyor"}</p> : null}</footer>
    </div>
  );
}
