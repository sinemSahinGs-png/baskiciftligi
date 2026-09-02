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
import {
  geometryErrorCopy,
  useGeometryLoader,
} from "@/components/preparation-studio/use-geometry-loader";
import { siteConfig } from "@/config/site";
import { COMMERCE_SHIPPING_POLICY } from "@/domain/commerce/shipping-policy";
import {
  buildAutoOrientCandidates,
  nextAutoOrientCandidate,
  quickLayFlatTransform,
} from "@/domain/manufacturing/auto-orient";
import { evaluateBuildVolumeFit } from "@/domain/manufacturing/build-volume-fit";
import { plateToBinaryStl } from "@/domain/manufacturing/threemf/plate-stl";
import {
  COLOR_OPTIONS,
  DEVELOPMENT_PRINTER,
  QUALITY_PROFILES,
} from "@/domain/manufacturing/profiles";
import {
  deriveStudioPhase,
  isQuoteStale,
  stageFromJobState,
  STUDIO_STAGE_COPY,
  type StudioProgressStage,
} from "@/domain/manufacturing/studio-phase";
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
  mapWorkerBusyError,
  mapWorkerServiceUnavailableError,
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
  ["transform", "Boyut ve yön"],
  ["material", "Malzeme"],
  ["quality", "Kalite"],
  ["quantity", "Adet"],
  ["quote", "Teklif"],
] as const;
type TabId = (typeof TABS)[number][0];

type Quote = {
  id: string;
  grossMinor: number;
  netMinor: number;
  vatMinor: number;
  duration: number;
  grams: number;
  reviewRequired: boolean;
  shippingStatus: "not_included";
  expiresAt?: string | null;
};

const fmtMm = (v: number) => `${v.toFixed(1)} mm`;
const fmtDur = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h <= 0 ? `${m} dk` : `${h} sa ${m} dk`;
};
const allowedFile = (f: File) =>
  ALLOWED.some((ext) => f.name.toLocaleLowerCase("tr-TR").endsWith(ext));

type ToolDef = {
  id: string;
  label: string;
  icon: typeof Crosshair;
  tool?: StudioTool;
  run?: () => void;
};

function StudioToolRail({
  vertical,
  tools,
  activeTool,
  wireframe,
  onTool,
}: {
  vertical: boolean;
  tools: ToolDef[];
  activeTool: StudioTool;
  wireframe: boolean;
  onTool: (tool: StudioTool) => void;
}) {
  return (
    <div className={cn("flex gap-1 border-white/10 bg-[#171e28]/90 p-1 backdrop-blur", vertical ? "w-14 shrink-0 flex-col border-r" : "border-t")}>
      {tools.map((item) => {
        const Icon = item.icon;
        const active = item.id === "wire" ? wireframe : item.tool === activeTool;
        return (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            title={item.label}
            onClick={() => {
              if (item.run) item.run();
              else if (item.tool) onTool(item.tool);
            }}
            className={cn(
              "inline-flex min-h-11 items-center justify-center rounded-md text-xs font-semibold",
              vertical ? "w-full flex-col gap-1 px-1 py-2" : "flex-1 px-2",
              active ? "bg-cyan/20 text-cyan" : "text-muted-light hover:bg-white/8",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {vertical ? <span className="text-[10px] leading-none">{item.label}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

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
  const [colorId, setColorId] = useState("gray");
  const [preset, setPreset] = useState<"ekonomik" | "standart" | "detayli">("standart");
  const [infill, setInfill] = useState(20);
  const [supports, setSupports] = useState<"auto" | "on" | "off">("auto");
  const [quantity, setQuantity] = useState(1);
  const [placeOnBed, setPlaceOnBed] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobState, setJobState] = useState<string | null>(null);
  const [jobLabel, setJobLabel] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteFingerprint, setQuoteFingerprint] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartCompleted, setCartCompleted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [workerOnline, setWorkerOnline] = useState<boolean | null>(null);
  const [outOfPlate, setOutOfPlate] = useState(false);
  const [enteredAt, setEnteredAt] = useState<number | null>(null);
  const [selectedPlateId, setSelectedPlateId] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [handoff] = useState(() =>
    typeof window === "undefined" ? null : peekPendingExternalUpload(),
  );
  const [externalContext, setExternalContext] = useState<ExternalQuoteModelContext | null>(
    () => handoff?.context ?? null,
  );
  const requestGen = useRef(0);

  const { geometry, status, originalDimensionsMm, triangleCount, plates, requiresPlateSelection, activePlate, errorMessage } =
    useGeometryLoader(file, selectedPlateId);
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
  const fingerprint = [
    file ? `${file.name}:${file.size}:${file.lastModified}` : "",
    selectedPlateId ?? "default",
    serializeTransformForUpload(transform),
    preset,
    infill,
    supports,
    quantity,
    colorId,
  ].join(":");
  const quoteStale = isQuoteStale({
    hasQuote: Boolean(quote),
    quoteFingerprint,
    currentFingerprint: fingerprint,
  });
  const phase = deriveStudioPhase({
    hasFile: Boolean(file),
    parseStatus: status,
    submitting,
    addingToCart,
    cartCompleted,
    jobState,
    hasQuote: Boolean(quote),
    quoteStale,
    failed,
  });

  const submittedFingerprint = useRef<string | null>(null);
  const [tick, setTick] = useState(0);

  const invalidateQuote = useCallback(() => {
    requestGen.current += 1;
    setQuote(null);
    setQuoteFingerprint(null);
    setJobId(null);
    setJobState(null);
    setJobLabel(null);
    setFailed(false);
    setCartCompleted(false);
    setSubmitting(false);
    submittedFingerprint.current = null;
  }, []);

  const markSettingsChanged = useCallback(() => {
    requestGen.current += 1;
    setSubmitting(false);
    setFailed(false);
    setJobId(null);
    setJobState(null);
    setJobLabel(null);
  }, []);

  const applyTransform = useCallback(
    (next: ManufacturingTransform) => {
      let t = normalizeTransform({ ...next, placeOnBed });
      if (placeOnBed && originalDimensionsMm) t = placeOnBedTransform(t, originalDimensionsMm);
      setHistory((s) => commitTransformHistory(s, t));
      markSettingsChanged();
    },
    [markSettingsChanged, originalDimensionsMm, placeOnBed],
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setIsDesktop(mq.matches);
    const syncMotion = () => setReducedMotion(motion.matches);
    sync();
    syncMotion();
    mq.addEventListener("change", sync);
    motion.addEventListener("change", syncMotion);
    return () => {
      mq.removeEventListener("change", sync);
      motion.removeEventListener("change", syncMotion);
    };
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
      markSettingsChanged();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [markSettingsChanged]);

  useEffect(() => {
    savePreparationSession({
      ...defaultSessionSnapshot(),
      material: "PLA",
      colorId,
      preset,
      infill,
      supports,
      quantity,
      technology: "FDM",
      transform,
      fileName: file?.name ?? null,
      externalTitle: externalContext?.title ?? null,
    });
  }, [colorId, externalContext?.title, file?.name, infill, preset, quantity, supports, transform]);

  const acceptFile = useCallback(
    (next: File, opts?: { rightsOk?: boolean }) => {
      if (!allowedFile(next)) return setError("Yalnızca STL, 3MF veya OBJ seçilebilir.");
      if (next.size > MAX_BYTES) return setError("Dosya 100 MB sınırını aşıyor.");
      setError(null);
      setFile(next);
      setSelectedPlateId(null);
      setOutOfPlate(false);
      invalidateQuote();
      setHistory(createTransformHistory());
      setAutoIdx(-1);
      if (opts?.rightsOk) setRights(true);
      setTab("model");
      setFitKey((v) => v + 1);
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

  const geometryError = errorMessage ?? geometryErrorCopy(status);

  async function submitJob() {
    if (!rights) return setError(RIGHTS);
    if (!file) return setError("Önce bir dosya seçin.");
    if (requiresPlateSelection && !selectedPlateId) {
      return setError("Bu Bambu Studio projesinde birden fazla plaka var. Analiz edilecek plakayı seçin.");
    }
    if (!placeOnBed) {
      return setError(
        "Otomatik fiyat için modelin plakaya oturtulması gerekir. “Plakaya oturt” seçeneğini açın.",
      );
    }
    if (submitting) return;
    if (jobId && !quote && !failed) return;
    setSubmitting(true);
    setFailed(false);
    setError(null);
    setQuote(null);
    setEnteredAt(Date.now());
    setTick(Date.now());
    submittedFingerprint.current = fingerprint;
    const gen = ++requestGen.current;
    try {
      let uploadFile = file;
      if (requiresPlateSelection && activePlate) {
        const stl = plateToBinaryStl(activePlate);
        const copy = new ArrayBuffer(stl.byteLength);
        new Uint8Array(copy).set(stl);
        uploadFile = new File(
          [copy],
          file.name.replace(/\.3mf$/i, `-${activePlate.id}.stl`),
          { type: "model/stl" },
        );
      }
      const form = new FormData();
      form.set("file", uploadFile);
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
      form.set(
        "idempotencyKey",
        `studio:${uploadFile.name}:${uploadFile.size}:${file.lastModified}:${serializeTransformForUpload(transform)}:${preset}:${infill}:${supports}:${quantity}:${selectedPlateId ?? "default"}`,
      );
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
      const payload = (await res.json()) as {
        error?: string;
        jobId?: string;
        existing?: boolean;
      };
      if (gen !== requestGen.current) return;
      if (!res.ok) throw new Error(payload.error ?? "Yükleme doğrulanamadı.");
      if (!payload.jobId) throw new Error("İş oluşturulamadı.");
      setJobId(payload.jobId);
      setJobState("uploaded");
      setJobLabel(payload.existing ? "Dilimleme sırasına alındı" : "Güvenli şekilde yükleniyor");
    } catch (e) {
      if (gen !== requestGen.current) return;
      setFailed(true);
      setError(e instanceof Error ? e.message : "Gönderim başarısız.");
    } finally {
      if (gen === requestGen.current) setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!jobId) return;
    const gen = requestGen.current;
    const controller = new AbortController();
    const started = Date.now();
    let timer = 0;
    const poll = async () => {
      try {
        const res = await fetch(`/api/manufacturing/jobs/${jobId}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const p = (await res.json()) as {
          state?: string;
          stateLabel?: string;
          quoteId?: string | null;
          errorCode?: string | null;
          errorMessage?: string | null;
          pollHint?: "queued" | "worker_busy" | "worker_unavailable" | null;
          worker?: { online?: boolean };
        };
        if (gen !== requestGen.current) return;
        setJobState(p.state ?? null);
        setJobLabel(p.stateLabel ?? null);
        if (p.worker?.online !== undefined) setWorkerOnline(Boolean(p.worker.online));
        if (p.stateLabel) announceStatus(p.stateLabel);
        if (p.quoteId) {
          const q = (await (
            await fetch(`/api/manufacturing/quotes/${p.quoteId}`, {
              cache: "no-store",
              signal: controller.signal,
            })
          ).json()) as {
            id: string;
            breakdown: {
              grossMinor: number;
              netMinor: number;
              vatMinor: number;
              productionDurationSeconds: number;
              reviewRequired: boolean;
              shippingStatus: "not_included";
              quoteExpiresAt?: string | null;
            };
            metrics: { filamentWeightGrams: number };
          };
          if (gen !== requestGen.current) return;
          setQuote({
            id: q.id,
            grossMinor: q.breakdown.grossMinor,
            netMinor: q.breakdown.netMinor,
            vatMinor: q.breakdown.vatMinor,
            duration: q.breakdown.productionDurationSeconds,
            grams: q.metrics.filamentWeightGrams,
            reviewRequired: q.breakdown.reviewRequired,
            shippingStatus: q.breakdown.shippingStatus,
            expiresAt: q.breakdown.quoteExpiresAt,
          });
          setQuoteFingerprint(submittedFingerprint.current ?? fingerprint);
          setSubmitting(false);
          setTab("quote");
          return;
        }
        if (p.state === "failed") {
          const m = mapAnalysisError({
            errorCode: p.errorCode,
            errorMessage: p.errorMessage,
            state: p.state,
            workerOnline: p.worker?.online,
          });
          setError(`${m.title}. ${m.message}`);
          setFailed(true);
          setSubmitting(false);
          return;
        }
        if (p.pollHint === "worker_unavailable" || p.errorCode === "worker_unavailable" || p.worker?.online === false) {
          const m = mapWorkerServiceUnavailableError();
          setError(`${m.title}. ${m.message}`);
          setFailed(true);
          setSubmitting(false);
          return;
        }
        if (p.pollHint === "worker_busy") {
          setJobLabel(mapWorkerBusyError().title);
          setError(null);
        }
        if (Date.now() - started > 600_000) {
          const m = mapAnalysisError({ errorCode: "timeout" });
          setError(`${m.title}. ${m.message}`);
          setFailed(true);
          setSubmitting(false);
          return;
        }
        timer = window.setTimeout(() => void poll(), 2000);
      } catch {
        if (controller.signal.aborted || gen !== requestGen.current) return;
        setFailed(true);
        setError("Ağ bağlantısı koptu. Tekrar deneyebilirsin; bu bir zaman aşımı değil.");
        setSubmitting(false);
      }
    };
    void poll();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [jobId]); // eslint-disable-line react-hooks/exhaustive-deps -- fingerprint captured on submit

  useEffect(() => {
    if (!jobId || quote || failed) return;
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [failed, jobId, quote]);

  async function addQuoteToCart() {
    if (!quote || quoteStale) return;
    setAddingToCart(true);
    const res = await fetch(`/api/manufacturing/quotes/${quote.id}/cart`, { method: "POST" });
    const payload = (await res.json()) as {
      error?: string;
      line?: { productId: string; quoteId: string; quantity: number };
    };
    setAddingToCart(false);
    if (!res.ok || !payload.line) return setError(payload.error ?? "Teklif sepete eklenemedi.");
    addLine({
      productId: payload.line.productId,
      quoteId: payload.line.quoteId,
      quantity: payload.line.quantity,
    });
    setCartCompleted(true);
    if (!reducedMotion) {
      await new Promise((resolve) => window.setTimeout(resolve, 420));
    }
    router.push("/sepet");
  }

  const onDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    const next = e.dataTransfer.files[0];
    if (next) acceptFile(next);
  };
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0];
    if (next) acceptFile(next);
  };
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

  const analyzing = Boolean(jobId && !quote && !failed);
  const stage: StudioProgressStage | null = analyzing
    ? stageFromJobState(jobState) ?? "prepare"
    : quote && !quoteStale
      ? "ready"
      : null;
  const elapsed = enteredAt ? Math.max(0, Math.round((Math.max(tick, enteredAt) - enteredAt) / 1000)) : 0;
  const shipTl = COMMERCE_SHIPPING_POLICY.standardShippingMinor / 100;
  const priceHint = quote && !quoteStale ? `${formatMoney(quote.grossMinor)} KDV dahil` : "Fiyat, dilimleme bitince görünür";

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
    <nav aria-label="İnceleyici sekmeleri" className="flex gap-1 overflow-x-auto px-2 py-2 text-xs">
      {TABS.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => setTab(id)}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 font-semibold transition-colors",
            tab === id ? "bg-cyan/20 text-cyan" : "text-muted-light hover:bg-white/8",
          )}
        >
          {label}
        </button>
      ))}
    </nav>
  );

  const quoteCard = quote ? (
    <div
      className={cn(
        "studio-quote-card space-y-3 rounded-2xl border border-cyan/25 bg-white/8 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.28)]",
        quoteStale && "opacity-70",
      )}
    >
      <p className="text-sm font-semibold text-cyan">
        {quoteStale ? "Teklif güncel değil" : quote.reviewRequired ? "Geçici teklif" : "Otomatik fiyat teklifin hazır"}
      </p>
      {quoteStale ? (
        <p className="text-sm text-warm">Ayar veya konum değişti. Yeniden analiz etmen gerekir.</p>
      ) : (
        <>
          <p className="font-heading text-3xl font-bold tracking-tight">{formatMoney(quote.grossMinor)}</p>
          <p className="text-sm text-muted-light">
            KDV dahil toplam · Net {formatMoney(quote.netMinor)} · KDV {formatMoney(quote.vatMinor)}
          </p>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div>Süre<br /><span className="text-sm font-semibold">{fmtDur(quote.duration)}</span></div>
            <div>Filament<br /><span className="text-sm font-semibold">{quote.grams.toFixed(2)} g</span></div>
            <div>Adet<br /><span className="text-sm font-semibold">{quantity}</span></div>
            <div>Malzeme<br /><span className="text-sm font-semibold">PLA</span></div>
            <div>Kalite<br /><span className="text-sm font-semibold">{QUALITY_PROFILES.find((q) => q.id === preset)?.name}</span></div>
            <div>Ölçü<br /><span className="text-sm font-semibold">{dims ? `${dims.x.toFixed(0)}×${dims.y.toFixed(0)}×${dims.z.toFixed(0)} mm` : "—"}</span></div>
          </dl>
          {quote.expiresAt ? (
            <p className="text-xs text-muted-light">Geçerlilik: {new Date(quote.expiresAt).toLocaleString("tr-TR")}</p>
          ) : null}
          <p className="text-xs leading-5 text-muted-light">
            Kargo ürün fiyatına dahil değildir. Sepette sipariş başına yalnızca bir kez {shipTl} TL kargo eklenir.
          </p>
        </>
      )}
    </div>
  ) : null;

  const inspector = (
    <div className="space-y-4 p-4">
      {tab === "model" && (
        <>
          <h2 className="font-heading text-xl font-bold">Model</h2>
          <label
            htmlFor="model-file"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="mt-3 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-cyan/35 bg-white/5 px-4 text-center"
          >
            <UploadCloud className="size-6 text-cyan" aria-hidden="true" />
            <span className="mt-2 text-sm font-semibold">Sürükle veya dosya seç</span>
            <span className="mt-1 text-xs text-muted-light">STL, 3MF · en fazla 100 MB</span>
          </label>
          {file ? <p className="text-sm">{file.name}{triangleCount ? ` · ${triangleCount} üçgen` : ""}</p> : null}
          {requiresPlateSelection ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Plaka seç</p>
              {plates.map((plate) => (
                <button
                  key={plate.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlateId(plate.id);
                    markSettingsChanged();
                    setFitKey((v) => v + 1);
                  }}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2 text-left text-sm",
                    selectedPlateId === plate.id ? "border-cyan bg-cyan/15" : "border-white/12",
                  )}
                >
                  {plate.label} · {plate.triangleCount} üçgen
                </button>
              ))}
            </div>
          ) : null}
          <label className="flex items-start gap-3 text-sm leading-6">
            <input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} className="mt-1" />
            <span>{RIGHTS}</span>
          </label>
        </>
      )}
      {tab === "transform" && (
        <>
          <h2 className="font-heading text-xl font-bold">Boyut ve yön</h2>
          <h3 className="mt-2 text-sm font-semibold">Baskı yönü</h3>
          <p className="text-xs text-muted-light">Modele tıklayıp sürükleyerek tablada taşıyabilirsin.</p>
          {dims ? <p className="text-sm">{fmtMm(dims.x)} × {fmtMm(dims.y)} × {fmtMm(dims.z)}</p> : null}
          <label className="block text-sm font-semibold">Ölçek %{scalePct}
            <input type="range" min={10} max={400} value={scalePct} onChange={(e) => applyTransform(applyUniformScaleFromPercent(transform, Number(e.target.value)))} className="mt-2 w-full" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={placeOnBed} onChange={(e) => { setPlaceOnBed(e.target.checked); applyTransform({ ...transform, placeOnBed: e.target.checked }); }} />
            Plakaya oturt
          </label>
          <div className="flex gap-2">
            <button type="button" disabled={!canUndoTransform(history)} onClick={() => { setHistory((s) => undoTransformHistory(s)); markSettingsChanged(); }} className="min-h-10 flex-1 rounded-md border border-white/15 text-sm disabled:opacity-40">Geri al</button>
            <button type="button" disabled={!canRedoTransform(history)} onClick={() => { setHistory((s) => redoTransformHistory(s)); markSettingsChanged(); }} className="min-h-10 flex-1 rounded-md border border-white/15 text-sm disabled:opacity-40">Yinele</button>
          </div>
        </>
      )}
      {tab === "material" && (
        <>
          <h2 className="font-heading text-xl font-bold">Malzeme</h2>
          <p className="text-sm text-muted-light">PLA · üretim profili sunucuda sabitlenir.</p>
          <div className="grid grid-cols-2 gap-2">{COLOR_OPTIONS.map((c) => (
            <button key={c.id} type="button" onClick={() => { setColorId(c.id); markSettingsChanged(); }} className={cn("min-h-10 rounded-md border text-sm", colorId === c.id ? "border-cyan bg-cyan/20" : "border-white/12")}>{c.label}</button>
          ))}</div>
        </>
      )}
      {tab === "quality" && (
        <>
          <h2 className="font-heading text-xl font-bold">Kalite</h2>
          <div className="grid gap-2">{QUALITY_PROFILES.map((q) => (
            <button key={q.id} type="button" onClick={() => { setPreset(q.id as typeof preset); markSettingsChanged(); }} className={cn("min-h-10 rounded-md border px-3 text-sm font-semibold", preset === q.id ? "border-violet bg-violet/20" : "border-white/12")}>{q.name}</button>
          ))}</div>
          <button type="button" className="text-xs text-muted-light underline" onClick={() => setShowAdvanced((v) => !v)}>
            {showAdvanced ? "İleri ayarları gizle" : "İleri ayarlar"}
          </button>
          {showAdvanced ? (
            <>
              <label className="block text-sm font-semibold">Dolgu %{infill}
                <select value={infill} onChange={(e) => { setInfill(Number(e.target.value)); markSettingsChanged(); }} className="mt-2 h-10 w-full rounded-md border border-white/15 bg-[#1b222c] px-3">{[10, 15, 20, 30, 50, 100].map((v) => <option key={v} value={v}>%{v}</option>)}</select>
              </label>
              <label className="block text-sm font-semibold">Destek
                <select value={supports} onChange={(e) => { setSupports(e.target.value as typeof supports); markSettingsChanged(); }} className="mt-2 h-10 w-full rounded-md border border-white/15 bg-[#1b222c] px-3">
                  <option value="auto">Otomatik</option><option value="on">Açık</option><option value="off">Kapalı</option>
                </select>
              </label>
            </>
          ) : null}
        </>
      )}
      {tab === "quantity" && (
        <>
          <h2 className="font-heading text-xl font-bold">Adet</h2>
          <label className="block text-sm font-semibold">Adet
            <input type="number" min={1} max={20} value={quantity} onChange={(e) => { setQuantity(Math.max(1, Math.min(20, Number(e.target.value) || 1))); markSettingsChanged(); }} className="mt-2 h-10 w-full rounded-md border border-white/15 bg-[#1b222c] px-3" />
          </label>
        </>
      )}
      {tab === "quote" && (
        <>
          <h2 className="font-heading text-xl font-bold">Teklif</h2>
          <h3 className="sr-only">Analiz</h3>
          {fit && !fit.fits ? <p className="text-sm text-warm">Model plakaya sığmıyor.</p> : null}
          {workerOnline === false ? (
            <p className="rounded-md border border-warm/40 bg-warm/10 px-3 py-2 text-sm">
              {mapWorkerServiceUnavailableError().title}. {mapWorkerServiceUnavailableError().message}
            </p>
          ) : null}
          {analyzing ? (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold"><FormSignal spinning className="size-4" />{stage ? STUDIO_STAGE_COPY[stage] : jobLabel}</p>
              <div className="studio-slice-lines h-10 overflow-hidden rounded-md bg-black/30" aria-hidden="true" />
              <p className="text-xs text-muted-light">{file?.name} · {elapsed} sn · sayfayı kapatma</p>
              <ol className="space-y-1 text-xs text-muted-light">
                {(Object.keys(STUDIO_STAGE_COPY) as StudioProgressStage[]).map((key) => (
                  <li key={key} className={stage === key ? "text-cyan" : ""}>{STUDIO_STAGE_COPY[key]}</li>
                ))}
              </ol>
            </div>
          ) : null}
          {quoteCard ?? <p className="rounded-md border border-white/15 px-3 py-2 text-sm">İmzalı teklif sunucudan gelmeden fiyat gösterilmez.</p>}
          <button type="button" disabled={!rights || submitting || !file || analyzing} onClick={() => void submitJob()} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-cobalt text-sm font-semibold text-light-text disabled:opacity-40">{submitting || analyzing ? "Gönderiliyor" : "Analiz et ve fiyatı hesapla"}</button>
          {failed ? <button type="button" onClick={() => { setFailed(false); void submitJob(); }} className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-white/20 text-sm">Yeniden dene</button> : null}
          <button type="button" disabled={!quote || quoteStale || addingToCart} onClick={() => void addQuoteToCart()} className={cn("mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-cyan text-sm font-semibold disabled:opacity-40", cartCompleted && "editor-upload-success")}>{addingToCart ? "Ekleniyor" : cartCompleted ? "Sepete eklendi" : "Teklifi sepete ekle"}</button>
          <p className="text-xs text-muted-light">{siteConfig.name} fiyatı tarayıcıdan kabul etmez.</p>
        </>
      )}
      {error || geometryError ? (
        <p role="alert" className="flex gap-2 text-sm text-error">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {error ?? geometryError}
        </p>
      ) : null}
    </div>
  );

  return (
    <div data-testid="configurator-shell" data-studio-phase={phase} className="flex h-[calc(100svh-4rem)] min-h-[calc(100svh-4rem)] min-w-0 flex-col bg-[#121821] text-light-text lg:grid lg:min-h-[calc(100svh-4rem)] lg:grid-rows-[auto_1fr_auto]">
      {externalContext ? <p className="border-b border-white/10 bg-white/5 px-4 py-2 text-xs text-muted-light lg:col-span-full">Hazır modelden devam ediyorsun: {externalContext.title}</p> : null}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2 lg:col-span-full">
        <p className="flex min-w-0 items-center gap-2 text-sm"><FormSignal className="size-4" />Görüntüleyici · <span className="truncate">{file?.name ?? "Dosya seçilmedi"}</span>{dims ? <span className="shrink-0 text-xs text-muted-light">X {dims.x.toFixed(1)} · Y {dims.y.toFixed(1)} · Z {dims.z.toFixed(1)}</span> : null}</p>
        <div className="flex flex-wrap gap-1">
          <button type="button" className="min-h-10 px-3 text-sm" onClick={() => setFitKey((v) => v + 1)}>Sığdır</button>
          <button type="button" className="min-h-10 px-3 text-sm" onClick={reset}>Sıfırla</button>
          <button type="button" aria-label="Tel kafes" className="min-h-10 px-3 text-sm" onClick={() => setWireframe((v) => !v)}>Tel kafes</button>
          <button type="button" className="min-h-10 rounded-md bg-cobalt px-3 text-sm font-semibold" onClick={() => { setTab("quote"); if (!isDesktop) setMobileOpen(true); }}>Analiz et</button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col lg:col-span-full lg:grid lg:grid-cols-[3.5rem_minmax(0,1fr)_minmax(18rem,22rem)]">
        {isDesktop ? (
          <StudioToolRail
            vertical
            tools={tools}
            activeTool={activeTool}
            wireframe={wireframe}
            onTool={setActiveTool}
          />
        ) : null}
        <section data-testid="mesh-viewer" className={cn("relative min-h-0", isDesktop ? "min-h-[28rem]" : "h-[42svh] shrink-0")}>
          <input id="model-file" type="file" accept=".stl,.obj,.3mf,model/stl,model/3mf" onChange={onChange} className="sr-only" />
          <div className="h-full" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
            {file ? (
              <BuildPlateViewport
                geometry={geometry}
                transform={transform}
                activeTool={activeTool}
                previewColor={previewColorHex(colorId)}
                wireframe={wireframe}
                showBoundingBox={false}
                buildVolumeMm={bed}
                fitKey={fitKey}
                resetCameraKey={resetCameraKey}
                reducedMotion={reducedMotion}
                onTransformCommit={applyTransform}
                onOutOfPlate={setOutOfPlate}
              />
            ) : (
              <div className="grid h-full place-items-center p-8 text-center text-sm text-muted-light">
                STL veya 3MF bırak. Model açık gri metal olarak görünür; fiyat yalnız imzalı tekliften gelir.
              </div>
            )}
          </div>
          {outOfPlate ? <p className="studio-plate-pulse absolute top-3 left-1/2 z-10 -translate-x-1/2 rounded-full border border-warm/40 bg-warm/15 px-3 py-1 text-xs">Model plakanın dışına çıktı</p> : null}
          {status === "parsing" ? <p className="absolute bottom-3 left-3 z-10 text-xs">Model okunuyor</p> : null}
          {geometryError && status !== "ready" ? (
            <p role="alert" className="absolute top-3 left-3 z-10 max-w-[min(100%,20rem)] rounded-md border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">
              {geometryError}
            </p>
          ) : null}
        </section>
        {isDesktop ? <aside className="flex min-w-0 flex-col overflow-hidden border-l border-white/10 bg-[#171e28]/85 backdrop-blur-md">{tabNav}<div className="min-h-0 flex-1 overflow-y-auto">{inspector}</div></aside> : null}
        {!isDesktop ? (
          <div data-testid="config-drawer" data-expanded={mobileOpen ? "true" : "false"} className={cn("z-30 flex flex-col border-t border-white/10 bg-[#171e28] pb-[env(safe-area-inset-bottom)]", mobileOpen ? "min-h-0 max-h-[58%] flex-1" : "shrink-0")}>
            <StudioToolRail
              vertical={false}
              tools={tools}
              activeTool={activeTool}
              wireframe={wireframe}
              onTool={setActiveTool}
            />
            <button type="button" aria-label="İnceleyici panelini sürükle" onClick={() => setMobileOpen((o) => !o)} className="flex min-h-8 items-center justify-center pt-1"><GripHorizontal className="size-5 text-muted-light" aria-hidden="true" /></button>
            <div className="flex items-center justify-between gap-2 px-4 pb-2"><p className="min-w-0 truncate text-sm font-semibold">{file?.name ?? "Dosya seçilmedi"}{dims ? ` · ${fmtMm(dims.x)} × ${fmtMm(dims.y)} × ${fmtMm(dims.z)}` : ""}</p><button type="button" aria-expanded={mobileOpen} onClick={() => setMobileOpen((o) => !o)} className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-md px-3 text-sm font-semibold">{mobileOpen ? "Küçült" : "Genişlet"}<ChevronDown className={cn("size-4 transition-transform", mobileOpen && "rotate-180")} aria-hidden="true" /></button></div>
            <div className="flex items-center justify-between gap-3 px-4 pb-3"><p className="min-w-0 truncate text-xs text-muted-light">{priceHint}</p><button type="button" disabled={!rights || submitting || !file || analyzing} onClick={() => void submitJob()} className="inline-flex min-h-10 shrink-0 items-center rounded-md bg-cobalt px-3 text-sm font-semibold text-light-text disabled:opacity-40">{submitting || analyzing ? "Gönderiliyor" : "Analiz et ve fiyatı hesapla"}</button></div>
            {mobileOpen ? <div className="min-h-0 flex-1 overflow-y-auto">{tabNav}{inspector}</div> : <div className="px-2 pb-2">{tabNav}</div>}
          </div>
        ) : null}
      </div>
      <footer className="flex items-center justify-between gap-3 border-t border-white/10 bg-[#171e28] px-4 py-2 text-xs lg:col-span-full"><p className="truncate">{file?.name ?? "Dosya seçilmedi"}</p><p className="text-muted-light">{priceHint}</p>{fit ? <p className={fit.fits ? "text-lime" : "text-warm"}>{fit.fits ? "Plakaya sığıyor" : "Sığmıyor"}</p> : null}</footer>
    </div>
  );
}
