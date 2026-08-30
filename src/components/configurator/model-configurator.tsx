"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangeEvent, DragEvent, PointerEvent as ReactPointerEvent } from "react";
import {
  AlertCircle,
  ChevronDown,
  GripHorizontal,
  RotateCcw,
  Ruler,
  UploadCloud,
} from "lucide-react";

import { FormSignal } from "@/components/brand/form-signal";
import { FoundryGrid } from "@/components/brand/foundry-grid";
import { RevealHeading } from "@/components/motion/reveal-words";
import { siteConfig } from "@/config/site";
import { formatMoney } from "@/lib/money";
import {
  takePendingExternalUpload,
  peekPendingExternalUpload,
  type ExternalQuoteModelContext,
} from "@/lib/models/external-quote-context";
import { applyExternalProductionOptions } from "@/lib/models/apply-production-options";
import { announceStatus } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import type { PreviewStatus } from "@/components/configurator/mesh-preview";

const MeshPreview = dynamic(
  () =>
    import("@/components/configurator/mesh-preview").then((mod) => mod.MeshPreview),
  { ssr: false },
);

const maxBytes = 100 * 1024 * 1024;
const allowed = [".stl", ".obj", ".3mf"];
const steps = [
  "Dosya",
  "Geometri",
  "Teknoloji",
  "Malzeme",
  "Kalite",
  "Adet",
  "Özet",
] as const;
const stepTone = [
  "step-file",
  "step-geometry",
  "step-tech",
  "step-material",
  "step-quality",
  "step-qty",
  "step-quote",
] as const;

const RIGHTS_COPY =
  "Bu dosyayı üretme ve çoğaltma hakkına sahip olduğumu ve kaynak modelin lisans koşullarını kontrol ettiğimi onaylıyorum.";

function isAllowed(file: File) {
  const name = file.name.toLocaleLowerCase("tr-TR");
  return allowed.some((extension) => name.endsWith(extension));
}

function formatMm(value: number) {
  return `${value.toFixed(1)} mm`;
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours <= 0) {
    return `${minutes} dk`;
  }
  return `${hours} sa ${minutes} dk`;
}

export function ModelConfigurator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addLine = useCartStore((state) => state.addLine);
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [technology, setTechnology] = useState<"FDM" | "SLA">("FDM");
  const [material, setMaterial] = useState("PLA");
  const [preset, setPreset] = useState<"ekonomik" | "standart" | "detayli">("standart");
  const [infill, setInfill] = useState(20);
  const [supports, setSupports] = useState<"auto" | "on" | "off">("auto");
  const [colorId, setColorId] = useState("black");
  const [quantity, setQuantity] = useState(1);
  const [scalePercent, setScalePercent] = useState(100);
  const [unit, setUnit] = useState<"mm" | "cm" | "m" | "custom">("mm");
  const [advanced, setAdvanced] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [rights, setRights] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [fitKey, setFitKey] = useState(0);
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>("idle");
  const [previewDims, setPreviewDims] = useState<{ x: number; y: number; z: number } | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobLabel, setJobLabel] = useState<string | null>(null);
  const [quote, setQuote] = useState<{
    id: string;
    grossMinor: number;
    netMinor: number;
    vatMinor: number;
    duration: number;
    grams: number;
    expiresAt: string;
    reviewRequired: boolean;
    reviewMessage: string | null;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [workerOnline, setWorkerOnline] = useState<boolean | null>(null);
  const [handoff] = useState(() =>
    typeof window === "undefined" ? null : peekPendingExternalUpload(),
  );
  const [externalContext, setExternalContext] =
    useState<ExternalQuoteModelContext | null>(() => handoff?.context ?? null);
  const thingId = searchParams.get("thing");
  const thingFile = searchParams.get("file");
  const source = searchParams.get("source");
  const sourceModel = searchParams.get("sourceModel");

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    void fetch("/api/manufacturing/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { worker?: { online?: boolean } }) => {
        setWorkerOnline(Boolean(payload.worker?.online));
      })
      .catch(() => setWorkerOnline(false));
  }, []);

  const scaledDims = useMemo(() => {
    if (!previewDims) {
      return null;
    }
    const unitMul = unit === "cm" ? 10 : unit === "m" ? 1000 : 1;
    const scale = (scalePercent / 100) * unitMul;
    return {
      x: previewDims.x * scale,
      y: previewDims.y * scale,
      z: previewDims.z * scale,
    };
  }, [previewDims, scalePercent, unit]);

  const implausible = Boolean(
    scaledDims &&
      (Math.max(scaledDims.x, scaledDims.y, scaledDims.z) < 1 ||
        Math.max(scaledDims.x, scaledDims.y, scaledDims.z) > 1000),
  );

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onPreviewStatus = useCallback((status: PreviewStatus) => {
    setPreviewStatus(status);
    if (status === "corrupt" || status === "unsupported") {
      setError("Bu dosya geçerli bir STL, OBJ veya 3MF değil.");
    }
  }, []);
  const onPreviewDims = useCallback(
    (mm: { x: number; y: number; z: number } | null) => {
      setPreviewDims(mm);
    },
    [],
  );

  function acceptFile(nextFile: File, options?: { rightsAlreadyConfirmed?: boolean }) {
    if (!isAllowed(nextFile)) {
      setError("Yalnızca STL, 3MF veya OBJ seçilebilir.");
      return;
    }
    if (nextFile.size > maxBytes) {
      setError("Dosya 100 MB sınırını aşıyor.");
      return;
    }
    setError(null);
    setFile(nextFile);
    setQuote(null);
    setJobId(null);
    const rightsOk = options?.rightsAlreadyConfirmed || rights;
    setStep(rightsOk ? 1 : 0);
    setMobileOpen(false);
    announceStatus(`${nextFile.name} yerel olarak okunuyor.`);
  }

  const handoffApplied = useRef(false);
  useEffect(() => {
    const root = globalThis as typeof globalThis & {
      __bcHandoffConsumed?: boolean;
    };
    if (handoffApplied.current || root.__bcHandoffConsumed) return;
    const pending = takePendingExternalUpload() ?? handoff;
    if (!pending) return;
    handoffApplied.current = true;
    root.__bcHandoffConsumed = true;
    queueMicrotask(() => {
      setExternalContext(pending.context);
      setRights(true);
      applyExternalProductionOptions({
        material: setMaterial,
        colorId: setColorId,
        scalePercent: setScalePercent,
        quantity: setQuantity,
        options: pending.context.productionOptions,
      });
      acceptFile(pending.file, { rightsAlreadyConfirmed: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot handoff
  }, [handoff]);

  function onDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    const next = event.dataTransfer.files[0];
    if (next) {
      acceptFile(next);
    }
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0];
    if (next) {
      acceptFile(next);
    }
  }

  function goToStep(index: number) {
    setStep(index);
  }

  async function submitJob() {
    if (!rights) {
      setError(RIGHTS_COPY);
      return;
    }
    setSubmitting(true);
    setError(null);
    setQuote(null);
    try {
      if (source === "thingiverse" && thingId && thingFile) {
        const response = await fetch(`/api/models/thingiverse/${thingId}/acquire`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileId: thingFile,
            rightsConfirmed: true,
            idempotencyKey: `tv:${thingId}:${thingFile}:${preset}:${infill}:${quantity}:${scalePercent}`,
            configuration: {
              materialId: "pla",
              colorId,
              qualityId: preset,
              infillPercent: infill,
              supports,
              scalePercent,
              quantity,
              unit,
              customScale: null,
            },
          }),
        });
        const payload = (await response.json()) as {
          error?: string;
          jobId?: string;
          automaticManufacturingAllowed?: boolean;
        };
        if (!response.ok) {
          throw new Error(payload.error ?? "Thingiverse dosyası alınamadı.");
        }
        if (payload.automaticManufacturingAllowed === false) {
          setError(
            "Model incelenebilir ancak ticari üretim otomatik satışa kapalıdır.",
          );
        }
        if (!payload.jobId) {
          throw new Error("İş oluşturulamadı.");
        }
        setJobId(payload.jobId);
        return;
      }

      if (!file) {
        setError("Önce bir dosya seçin.");
        return;
      }
      const form = new FormData();
      form.set("file", file);
      form.set("rightsConfirmed", "true");
      form.set("materialId", "pla");
      form.set("colorId", colorId);
      form.set("qualityId", preset);
      form.set("infillPercent", String(infill));
      form.set("supports", supports);
      form.set("scalePercent", String(scalePercent));
      form.set("quantity", String(quantity));
      form.set("unit", unit);
      if (externalContext) {
        form.set("externalModelId", externalContext.externalModelId);
        form.set("sourceType", externalContext.sourceType);
        form.set("sourceUrl", externalContext.sourceUrl);
        form.set("sourceTitle", externalContext.title);
        if (externalContext.attribution) {
          form.set("attribution", externalContext.attribution);
        }
        if (externalContext.licenseVerified && externalContext.licenseName) {
          form.set("licenseName", externalContext.licenseName);
          form.set("licenseVerified", "true");
        }
      } else if (sourceModel) {
        form.set("sourceType", sourceModel);
      }
      const response = await fetch("/api/manufacturing/uploads", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as { error?: string; jobId?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Yükleme doğrulanamadı.");
      }
      if (!payload.jobId) {
        throw new Error("İş oluşturulamadı.");
      }
      setJobId(payload.jobId);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Gönderim başarısız.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!jobId) {
      return;
    }
    let cancelled = false;
    const started = Date.now();
    let timeoutId = 0;
    const POLL_MS = 2_000;
    const MAX_WAIT_MS = 10 * 60 * 1000;
    async function poll() {
      const response = await fetch(`/api/manufacturing/jobs/${jobId}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        state?: string;
        stateLabel?: string;
        quoteId?: string | null;
        errorMessage?: string | null;
      };
      if (cancelled) {
        return;
      }
      setJobLabel(payload.stateLabel ?? null);
      if (payload.stateLabel) {
        announceStatus(payload.stateLabel);
      }
      if (payload.quoteId) {
        const quoteResponse = await fetch(`/api/manufacturing/quotes/${payload.quoteId}`, {
          cache: "no-store",
        });
        const quotePayload = (await quoteResponse.json()) as {
          id: string;
          breakdown: {
            grossMinor: number;
            netMinor: number;
            vatMinor: number;
            productionDurationSeconds: number;
            quoteExpiresAt: string;
            reviewRequired: boolean;
            reviewMessage: string | null;
          };
          metrics: { filamentWeightGrams: number };
        };
        setQuote({
          id: quotePayload.id,
          grossMinor: quotePayload.breakdown.grossMinor,
          netMinor: quotePayload.breakdown.netMinor,
          vatMinor: quotePayload.breakdown.vatMinor,
          duration: quotePayload.breakdown.productionDurationSeconds,
          grams: quotePayload.metrics.filamentWeightGrams,
          expiresAt: quotePayload.breakdown.quoteExpiresAt,
          reviewRequired: quotePayload.breakdown.reviewRequired,
          reviewMessage: quotePayload.breakdown.reviewMessage,
        });
        return;
      }
      if (payload.state === "failed") {
        setError(payload.errorMessage ?? "Dilimleme tamamlanamadı.");
        return;
      }
      if (Date.now() - started > MAX_WAIT_MS) {
        setError("Dilimleme zaman aşımına uğradı. İşçi günlüğünü kontrol edip yeniden deneyin.");
        return;
      }
      if (Date.now() - started > 20_000 && (payload.state === "uploaded" || payload.state === "created")) {
        setError("Dilimleme işçisi çevrimdışı veya meşgul. Docker Compose ile işçiyi başlatıp yeniden deneyin.");
        return;
      }
      timeoutId = window.setTimeout(() => {
        void poll();
      }, POLL_MS);
    }
    void poll();
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [jobId]);

  async function addQuoteToCart() {
    if (!quote) {
      return;
    }
    const response = await fetch(`/api/manufacturing/quotes/${quote.id}/cart`, {
      method: "POST",
    });
    const payload = (await response.json()) as {
      error?: string;
      line?: { productId: string; quoteId: string; quantity: number };
    };
    if (!response.ok || !payload.line) {
      setError(payload.error ?? "Teklif sepete eklenemedi.");
      return;
    }
    addLine({
      productId: payload.line.productId,
      quoteId: payload.line.quoteId,
      quantity: payload.line.quantity,
    });
    router.push("/sepet");
  }

  const summary = useMemo(
    () => [
      ["Model", file?.name ?? (thingId ? `Thingiverse ${thingId}` : "Dosya seçilmedi")],
      ["Teknoloji", technology],
      ["Malzeme", material],
      ["Kalite", preset],
      ["Dolgu", `%${infill}`],
      ["Adet", String(quantity)],
      ["Ölçek", `%${scalePercent}`],
    ],
    [file, infill, material, preset, quantity, scalePercent, technology, thingId],
  );

  const stepNav = (idPrefix: string, compact = false) => (
    <nav
      aria-label="Yapılandırıcı adımları"
      className={cn(
        "border-b border-white/10 px-3 py-3 text-sm",
        compact ? "grid grid-cols-7 gap-1" : "flex gap-2 overflow-x-auto",
      )}
    >
      {steps.map((label, index) => (
        <button
          key={`${idPrefix}-${label}`}
          type="button"
          onClick={() => goToStep(index)}
          data-active={index === step ? "true" : undefined}
          aria-label={`${index + 1}. ${label}`}
          className={cn(
            "min-h-11 font-semibold text-muted-light",
            compact ? "px-1 text-xs" : "shrink-0 px-2",
            stepTone[index],
          )}
        >
          {compact ? index + 1 : `${index + 1}. ${label}`}
        </button>
      ))}
    </nav>
  );

  const stepContent = (
    <div className="space-y-6">
      {step === 0 ? (
        <div>
          <RevealHeading
            as="h1"
            text="Dosyanı getir"
            className="font-heading text-3xl font-bold tracking-[-0.04em]"
          />
          <p className="mt-2 text-sm leading-6 text-muted-light">
            STL, OBJ veya 3MF dosyası tarayıcıda gerçek geometri olarak açılır.
            Analiz isteği gönderilmeden sunucuya kaydedilmez. Fiyat, gerçek
            dilimleme bitmeden gösterilmez.
          </p>
          <label
            htmlFor="model-file"
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDrop}
            className="mt-5 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-cyan/40 bg-midnight/50 px-4 text-center"
          >
            <UploadCloud aria-hidden="true" className="size-7 text-cyan" />
            <span className="mt-3 text-sm font-semibold">
              Sürükle veya dosya seç
            </span>
            <span className="mt-2 text-xs text-muted-light">
              STL · 3MF · OBJ · 100 MB
            </span>
          </label>
          {isDesktop ? (
          <label className="mt-4 flex items-start gap-3 text-sm leading-6">
            <input
              type="checkbox"
              checked={rights}
              onChange={(event) => setRights(event.target.checked)}
              className="mt-1"
            />
            <span>{RIGHTS_COPY}</span>
          </label>
          ) : null}
        </div>
      ) : null}

      {step === 1 ? (
        <div>
          <h2 className="font-heading text-2xl font-bold">Geometri</h2>
          <p className="mt-2 text-sm text-muted-light">
            Tarayıcı ölçüleri üretim oryantasyonu değildir. Sunucu analizi
            tamamlanınca seçilen yön ayrıca yazılır.
          </p>
          {scaledDims ? (
            <p className="mt-3 text-sm">
              {formatMm(scaledDims.x)} × {formatMm(scaledDims.y)} × {formatMm(scaledDims.z)} · ölçek %{scalePercent}
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted-light">Ölçü, önizleme hazır olunca görünür.</p>
          )}
          {implausible ? (
            <fieldset className="mt-4 space-y-2">
              <legend className="text-sm font-semibold">STL birimi belirsiz. Birim seçin:</legend>
              {(["mm", "cm", "m"] as const).map((item) => (
                <label key={item} className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="unit"
                    checked={unit === item}
                    onChange={() => setUnit(item)}
                  />
                  {item}
                </label>
              ))}
            </fieldset>
          ) : null}
          <label className="mt-4 block text-sm font-semibold">
            Ölçek %{scalePercent}
            <input
              type="range"
              min={10}
              max={400}
              value={scalePercent}
              onChange={(event) => setScalePercent(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </label>
        </div>
      ) : null}

      {step === 2 ? (
        <div>
          <h2 className="font-heading text-2xl font-bold">Üretim teknolojisi</h2>
          <div className="mt-4 grid gap-3">
            <button
              type="button"
              onClick={() => {
                setTechnology("FDM");
                setMaterial("PLA");
              }}
              className={cn(
                "rounded-xl border p-4 text-left",
                technology === "FDM" ? "border-violet bg-violet/20" : "border-white/12",
              )}
            >
              <span className="font-semibold">FDM</span>
              <span className="mt-1 block text-sm text-muted-light">
                Otomatik dilimleme ve teklif bu fazda yalnız FDM / PLA içindir.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTechnology("SLA")}
              className={cn(
                "rounded-xl border p-4 text-left",
                technology === "SLA" ? "border-violet bg-violet/20" : "border-white/12",
              )}
            >
              <span className="font-semibold">SLA</span>
              <span className="mt-1 block text-sm text-muted-light">
                Reçine otomatik fiyatı bu fazda yok; seçilirse teknik inceleme gerekir.
              </span>
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div>
          <h2 className="font-heading text-2xl font-bold">Malzeme ve renk</h2>
          <button
            type="button"
            onClick={() => setMaterial("PLA")}
            className="mt-4 min-h-12 w-full rounded-md border border-coral bg-coral text-sm font-semibold"
          >
            PLA
          </button>
          <p className="mt-3 text-sm text-muted-light">
            PETG, TPU, ABS/ASA ve reçine şema olarak hazır; otomatik teklif
            henüz yalnız PLA.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              ["black", "Siyah"],
              ["white", "Beyaz"],
              ["gray", "Gri"],
              ["orange", "Turuncu"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setColorId(id)}
                className={cn(
                  "min-h-11 rounded-md border text-sm",
                  colorId === id ? "border-cyan bg-cyan/20" : "border-white/12",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div>
          <h2 className="font-heading text-2xl font-bold">Kalite</h2>
          <div className="mt-4 grid gap-2">
            {([
              ["ekonomik", "Ekonomik", "0,28 mm"],
              ["standart", "Standart", "0,20 mm"],
              ["detayli", "Detaylı", "0,12 mm"],
            ] as const).map(([id, label, note]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPreset(id)}
                className={cn(
                  "min-h-12 rounded-md border px-3 text-sm font-semibold",
                  preset === id ? "border-info bg-info text-light-text" : "border-white/12",
                )}
              >
                {label} · {note}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="mt-4 text-sm font-semibold underline"
            onClick={() => setAdvanced((value) => !value)}
          >
            {advanced ? "Gelişmiş ayarları gizle" : "Gelişmiş ayarlar"}
          </button>
          {advanced ? (
            <div className="mt-3 space-y-3 text-sm">
              <label className="block font-semibold">
                Dolgu %{infill}
                <select
                  value={infill}
                  onChange={(event) => setInfill(Number(event.target.value))}
                  className="mt-2 h-11 w-full rounded-md border border-white/15 bg-midnight px-3"
                >
                  {[10, 15, 20, 30, 50, 100].map((value) => (
                    <option key={value} value={value}>
                      %{value}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block font-semibold">
                Destek
                <select
                  value={supports}
                  onChange={(event) =>
                    setSupports(event.target.value as "auto" | "on" | "off")
                  }
                  className="mt-2 h-11 w-full rounded-md border border-white/15 bg-midnight px-3"
                >
                  <option value="auto">Otomatik</option>
                  <option value="on">Açık</option>
                  <option value="off">Kapalı</option>
                </select>
              </label>
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 5 ? (
        <div>
          <h2 className="font-heading text-2xl font-bold">Adet ve son işlem</h2>
          <label className="mt-4 block text-sm font-semibold">
            Adet
            <input
              type="number"
              min={1}
              max={20}
              value={quantity}
              onChange={(event) =>
                setQuantity(Math.max(1, Math.min(20, Number(event.target.value) || 1)))
              }
              className="mt-2 h-11 w-full rounded-md border border-white/15 bg-midnight px-3"
            />
          </label>
          <p className="mt-3 text-sm text-muted-light">
            İlk sürüm bir parçayı dilimler ve adedi tutarlı biçimde çarpar.
            Çok tablalı yerleştirme yok; yüksek adet teknik incelemeye düşebilir.
          </p>
        </div>
      ) : null}

      {step === 6 ? (
        <div>
          <h2 className="font-heading text-2xl font-bold">Özet</h2>
          <dl className="mt-4 space-y-3 text-sm">
            {summary.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-muted-light">{label}</dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          {workerOnline === false ? (
            <p className="mt-4 rounded-md border border-warm/40 bg-warm/10 px-4 py-3 text-sm">
              Dilimleme işçisi çevrimdışı. Yerel Docker Compose başlatılmadan
              otomatik fiyat üretilemez.
            </p>
          ) : null}
          {jobLabel && !quote ? (
            <p className="mt-4 flex items-center gap-2 text-sm">
              <FormSignal spinning className="size-4" />
              {jobLabel}
            </p>
          ) : null}
          {quote ? (
            <div className="mt-4 space-y-2 rounded-md border border-lime/30 bg-lime/10 px-4 py-3 text-sm">
              <p className="font-semibold">
                {quote.reviewRequired ? "Geçici teklif" : "Otomatik teklif hazır"}
              </p>
              <p>{formatMoney(quote.grossMinor)} KDV dahil</p>
              <p>
                {quote.grams.toFixed(2)} g filament · {formatDuration(quote.duration)}
              </p>
              <p>Net {formatMoney(quote.netMinor)} · KDV {formatMoney(quote.vatMinor)}</p>
              <p>Kargo dahil değil · son {new Date(quote.expiresAt).toLocaleString("tr-TR")}</p>
              {quote.reviewMessage ? <p>{quote.reviewMessage}</p> : null}
            </div>
          ) : (
            <p className="mt-6 rounded-md border border-white/15 px-4 py-3 text-sm leading-6">
              Fiyat, PrusaSlicer çıktısı ve sunucu formülü olmadan gösterilmez.
            </p>
          )}
          <button
            type="button"
            disabled={!rights || submitting || technology === "SLA"}
            onClick={() => void submitJob()}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-cobalt text-sm font-semibold text-light-text disabled:opacity-40"
          >
            {submitting ? "Gönderiliyor" : "Analiz ve dilimlemeyi başlat"}
          </button>
          <button
            type="button"
            disabled={!quote}
            onClick={() => void addQuoteToCart()}
            className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-md border border-cyan px-3 text-sm font-semibold disabled:opacity-40"
          >
            Teklifi sepete ekle
          </button>
          <p className="mt-2 text-xs text-muted-light">
            {siteConfig.name} fiyatı tarayıcıdan kabul etmez. PayTR bu fazda kapalıdır.
          </p>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="flex gap-2 text-sm text-error">
          <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((value) => Math.max(0, value - 1))}
          className="min-h-11 flex-1 rounded-md border border-white/15 text-sm font-semibold disabled:opacity-40"
        >
          Geri
        </button>
        <button
          type="button"
          disabled={
            step === steps.length - 1 ||
            (step === 0 &&
              ((!file && source !== "thingiverse") || !rights))
          }
          onClick={() =>
            setStep((value) => Math.min(steps.length - 1, value + 1))
          }
          className="min-h-11 flex-1 rounded-md bg-cobalt text-sm font-semibold text-light-text disabled:opacity-40"
        >
          İleri
        </button>
      </div>
    </div>
  );

  const priceHint = quote
    ? `${formatMoney(quote.grossMinor)} KDV dahil`
    : jobLabel ?? "Fiyat, dilimleme bitince görünür";
  const drawerDragStart = useRef<number | null>(null);

  function onDrawerHandlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    drawerDragStart.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onDrawerHandlePointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const start = drawerDragStart.current;
    drawerDragStart.current = null;
    if (start === null) {
      return;
    }
    const delta = start - event.clientY;
    if (Math.abs(delta) < 24) {
      setMobileOpen((open) => !open);
      return;
    }
    setMobileOpen(delta > 0);
  }

  const collapsedPrimaryAction =
    step === 6 ? (
      quote ? (
        <button
          type="button"
          disabled={!quote}
          onClick={() => void addQuoteToCart()}
          className="inline-flex min-h-11 shrink-0 items-center rounded-md border border-cyan px-3 text-sm font-semibold disabled:opacity-40"
        >
          Teklifi sepete ekle
        </button>
      ) : (
        <button
          type="button"
          disabled={!rights || submitting || technology === "SLA"}
          onClick={() => void submitJob()}
          className="inline-flex min-h-11 shrink-0 items-center rounded-md bg-cobalt px-3 text-sm font-semibold text-light-text disabled:opacity-40"
        >
          {submitting ? "Gönderiliyor" : "Analiz ve dilimlemeyi başlat"}
        </button>
      )
    ) : (
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="inline-flex min-h-11 shrink-0 items-center rounded-md bg-cobalt px-4 text-sm font-semibold text-light-text"
      >
        Yapılandır
      </button>
    );

  return (
    <div
      data-testid="configurator-shell"
      className="flex h-[calc(100svh-4rem)] min-h-[calc(100svh-4rem)] min-w-0 flex-col bg-midnight text-light-text lg:grid lg:h-auto lg:min-h-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]"
    >
      {externalContext ? (
        <p
          data-external-model-context=""
          className="col-span-full border-b border-white/10 bg-white/5 px-4 py-2 text-xs text-muted-light"
        >
          Harici model bağlamı: {externalContext.title} ·{" "}
          {externalContext.platformLabel}. Kaynak lisansı kontrol edilmeden
          otomatik üretim izni varsayılmaz.
        </p>
      ) : null}
      <section
        data-testid="mesh-viewer"
        className={cn(
          "relative min-h-0 overflow-hidden lg:min-h-[calc(100svh-4rem)]",
          !isDesktop && mobileOpen
            ? "h-[38%] min-h-[38%] shrink-0"
            : !isDesktop
              ? "min-h-[42%] flex-1"
              : "min-h-[28rem]",
        )}
      >
        <FoundryGrid variant="measure" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3 text-sm">
          <p className="flex items-center gap-2">
            <FormSignal className="size-4" />
            Görüntüleyici
          </p>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setWireframe((value) => !value)}
              className="min-h-11 px-3 text-sm"
            >
              Tel kafes
            </button>
            <button type="button" className="min-h-11 px-3 text-sm" onClick={() => setFitKey((value) => value + 1)}>
              <Ruler aria-hidden="true" className="mr-2 inline size-3.5" />
              Sığdır
            </button>
            <button
              type="button"
              className="min-h-11 px-3 text-sm"
              onClick={() => setResetKey((value) => value + 1)}
            >
              Sıfırla
              <RotateCcw aria-hidden="true" className="ml-2 inline size-3.5" />
            </button>
          </div>
        </div>
        <input
          id="model-file"
          type="file"
          accept=".stl,.obj,.3mf"
          onChange={onChange}
          className="sr-only"
        />
        <div
          className={cn(
            "relative lg:min-h-[calc(100svh-8rem)]",
            !isDesktop ? "h-[calc(100%-3.25rem)] min-h-[12rem]" : "min-h-[24rem]",
          )}
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
        >
          {file ? (
            <div className="absolute inset-0">
              <MeshPreview
                file={file}
                scalePercent={scalePercent}
                wireframe={wireframe}
                resetKey={resetKey}
                fitKey={fitKey}
                reducedMotion={reducedMotion}
                onStatus={onPreviewStatus}
                onDimensions={onPreviewDims}
              />
            </div>
          ) : (
            <div className="grid min-h-[24rem] place-items-center p-8">
              <p className="max-w-sm text-center text-sm text-muted-light">
                Dosya seçildiğinde gerçek mesh, ızgara ve eksenler burada açılır.
                Sahte geometri gösterilmez.
              </p>
            </div>
          )}
          {scaledDims ? (
            <>
              <span className="pointer-events-none absolute top-16 left-12 z-10 text-xs tracking-wide text-cyan/80">
                X {scaledDims.x.toFixed(1)}
              </span>
              <span className="pointer-events-none absolute top-16 right-12 z-10 text-xs tracking-wide text-cyan/80">
                Y {scaledDims.y.toFixed(1)}
              </span>
              <span className="pointer-events-none absolute right-12 bottom-16 z-10 text-xs tracking-wide text-cyan/80">
                Z {scaledDims.z.toFixed(1)}
              </span>
            </>
          ) : null}
          {previewStatus === "parsing" ? (
            <p className="absolute bottom-4 left-4 z-10 text-xs">Model okunuyor</p>
          ) : null}
          {previewStatus === "too_complex" || previewStatus === "corrupt" || previewStatus === "unavailable" ? (
            <p className="absolute bottom-4 left-4 z-10 max-w-xs text-xs text-muted-light">
              Tarayıcı önizlemesi hazır değil. Sunucu analizi yine de çalışabilir.
            </p>
          ) : null}
        </div>
      </section>

      {isDesktop ? (
        <aside className="flex min-w-0 flex-col border-l border-white/10 bg-carbon">
          {stepNav("desktop")}
          <div className="flex-1 space-y-6 overflow-y-auto p-5 pb-8">{stepContent}</div>
          <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-white/10 bg-carbon px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {file?.name ?? "Dosya seçilmedi"}
              </p>
              <p className="text-xs text-muted-light">{priceHint}</p>
            </div>
          </div>
        </aside>
      ) : null}

      {!isDesktop ? (
      <div
        data-testid="config-drawer"
        data-expanded={mobileOpen ? "true" : "false"}
        className={cn(
          "z-30 flex flex-col border-t border-white/10 bg-carbon pb-[env(safe-area-inset-bottom)] lg:hidden",
          mobileOpen ? "min-h-0 max-h-[62%] flex-1" : "shrink-0",
        )}
      >
        <button
          type="button"
          aria-label="Yapılandırma panelini sürükle"
          onPointerDown={onDrawerHandlePointerDown}
          onPointerUp={onDrawerHandlePointerUp}
          className="flex min-h-8 touch-none items-center justify-center pt-2"
        >
          <GripHorizontal className="size-5 text-muted-light" aria-hidden="true" />
        </button>
        <div className="flex items-center justify-between gap-2 px-4 pb-2">
          <p className="min-w-0 truncate text-sm font-semibold">
            {file?.name ?? "Dosya seçilmedi"}
            {scaledDims
              ? ` · ${formatMm(scaledDims.x)} × ${formatMm(scaledDims.y)} × ${formatMm(scaledDims.z)}`
              : ""}
          </p>
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="config-drawer-panel"
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-md px-3 text-sm font-semibold"
          >
            {mobileOpen ? "Küçült" : "Genişlet"}
            <ChevronDown
              aria-hidden="true"
              className={cn("size-4 transition-transform", mobileOpen && "rotate-180 motion-reduce:transition-none")}
            />
          </button>
        </div>
        <label className="flex items-start gap-3 px-4 pb-2 text-xs leading-5">
          <input
            type="checkbox"
            checked={rights}
            onChange={(event) => setRights(event.target.checked)}
            className="mt-1"
          />
          <span>{RIGHTS_COPY}</span>
        </label>
        <div className="flex items-center justify-between gap-3 px-4 pb-3">
          <p className="min-w-0 truncate text-xs text-muted-light">{priceHint}</p>
          {collapsedPrimaryAction}
        </div>
        {error ? (
          <p role="alert" className="flex gap-2 px-4 pb-3 text-sm text-error">
            <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
            {error}
          </p>
        ) : null}
        {mobileOpen ? (
          <div
            id="config-drawer-panel"
            className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
          >
            {stepNav("mobile-sheet", true)}
            <div className="space-y-6 p-5 pb-8">{stepContent}</div>
          </div>
        ) : (
          <div className="px-3 pb-3">{stepNav("mobile", true)}</div>
        )}
      </div>
      ) : null}
    </div>
  );
}
