"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, ReactNode } from "react";
import {
  AlertCircle,
  Box,
  RotateCcw,
  Ruler,
  UploadCloud,
  X,
} from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";

import { FormSignal } from "@/components/brand/form-signal";
import { FoundryGrid } from "@/components/brand/foundry-grid";
import { GridDrift } from "@/components/motion/parallax-media";
import { RevealHeading } from "@/components/motion/reveal-words";
import { siteConfig } from "@/config/site";
import { announceStatus, foundryEase } from "@/lib/motion";
import { cn } from "@/lib/utils";

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

function isAllowed(file: File) {
  const name = file.name.toLocaleLowerCase("tr-TR");
  return allowed.some((extension) => name.endsWith(extension));
}

export function ModelConfigurator() {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [technology, setTechnology] = useState<"FDM" | "SLA">("FDM");
  const [material, setMaterial] = useState("PLA");
  const [preset, setPreset] = useState("Dengeli");
  const [quantity, setQuantity] = useState(1);
  const [advanced, setAdvanced] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [reviewPulse, setReviewPulse] = useState(false);
  const firstSummary = useRef(true);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (progress === 100 && file) {
      announceStatus(`${file.name} yerel olarak hazır. Dilimleme bağlı değil.`);
    }
  }, [file, progress]);

  useEffect(() => {
    if (step !== 6) {
      firstSummary.current = true;
      return;
    }
    if (firstSummary.current) {
      firstSummary.current = false;
      announceStatus("Özet adımına geçildi. Kesin fiyat onaydan sonra bildirilir.");
      return;
    }
    setReviewPulse(true);
    announceStatus("Seçimler güncellendi. Anlık fiyat hesaplanmaz.");
    const timer = window.setTimeout(() => setReviewPulse(false), 800);
    return () => window.clearTimeout(timer);
  }, [file?.name, material, preset, quantity, step, technology]);

  const materials =
    technology === "FDM"
      ? ["PLA", "PETG", "TPU", "ASA"]
      : ["Standart reçine", "ABS-like", "Tough", "Clear"];

  function acceptFile(nextFile: File) {
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
    setProgress(0);
    const timer = window.setInterval(() => {
      setProgress((value) => {
        if (value >= 100) {
          window.clearInterval(timer);
          return 100;
        }
        return value + 20;
      });
    }, 80);
    setStep(1);
    setMobileOpen(true);
  }

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
    if (!isDesktop) {
      setMobileOpen(true);
    }
  }

  const summary = useMemo(
    () => [
      ["Model", file?.name ?? "Dosya seçilmedi"],
      ["Teknoloji", technology],
      ["Malzeme", material],
      ["Kalite", preset],
      ["Adet", String(quantity)],
    ],
    [file, material, preset, quantity, technology],
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
            Dosya bu tarayıcı oturumunda kalır; sunucuya yüklenmez. Dilimleme
            ve anlık fiyat yok.
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
          <p className="mt-3 text-xs text-muted-light">
            Dosyalar üretim değerlendirmesi sonrası silinmek üzere saklanır;
            şu an depolama bağlı değil.
          </p>
        </div>
      ) : null}

      {step === 1 ? (
        <div>
          <h2 className="font-heading text-2xl font-bold">Geometri</h2>
          <p className="mt-2 text-sm text-muted-light">
            Ölçüler, oryantasyon ve yazdırılabilir hacim dilimleyici
            bağlanınca doğrulanır.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>Otomatik oryantasyon: henüz yok</li>
            <li>Non-manifold uyarısı: tarama bağlı değil</li>
            <li>Birden fazla kabuk: tarama bağlı değil</li>
          </ul>
        </div>
      ) : null}

      {step === 2 ? (
        <div>
          <h2 className="font-heading text-2xl font-bold">Üretim teknolojisi</h2>
          <div className="mt-4 grid gap-3">
            {(
              [
                ["FDM", "Katmanlı yüzey, dayanıklı ev ve işlevsel parçalar."],
                ["SLA", "İnce detay ve pürüzsüz prototip yüzeyleri."],
              ] as const
            ).map(([value, note]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setTechnology(value);
                  setMaterial(value === "FDM" ? "PLA" : "Standart reçine");
                }}
                className={cn(
                  "rounded-xl border p-4 text-left transition-colors duration-300",
                  technology === value
                    ? "border-violet bg-violet/20"
                    : "border-white/12",
                )}
              >
                <span className="font-semibold">{value}</span>
                <span className="mt-1 block text-sm text-muted-light">
                  {note}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div>
          <h2 className="font-heading text-2xl font-bold">Malzeme ve renk</h2>
          <div className="mt-4 grid gap-2">
            {materials.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMaterial(item)}
                className={cn(
                  "min-h-12 rounded-md border px-3 text-sm font-semibold transition-colors duration-300",
                  material === item
                    ? "border-coral bg-coral text-light-text"
                    : "border-white/12",
                )}
              >
                {item}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-light">
            Renk paleti ve stok, malzeme kaydı yayınlandığında burada görünür.
          </p>
        </div>
      ) : null}

      {step === 4 ? (
        <div>
          <h2 className="font-heading text-2xl font-bold">Kalite</h2>
          <div className="mt-4 grid gap-2">
            {["Ekonomik", "Dengeli", "Detaylı", "Dayanıklı"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPreset(item)}
                className={cn(
                  "min-h-12 rounded-md border px-3 text-sm font-semibold transition-colors duration-300",
                  preset === item
                    ? "border-info bg-info text-light-text"
                    : "border-white/12",
                )}
              >
                {item}
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
            <p className="mt-3 text-sm text-muted-light">
              Katman yüksekliği, dolgu, duvar ve destek dilimleyici bağlı
              olunca düzenlenir. Şimdi yalnızca preset saklanır.
            </p>
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
              max={99}
              value={quantity}
              onChange={(event) =>
                setQuantity(Math.max(1, Number(event.target.value) || 1))
              }
              className="mt-2 h-11 w-full rounded-md border border-white/15 bg-midnight px-3"
            />
          </label>
          <ul className="mt-4 space-y-2 text-sm text-muted-light">
            <li>Destek alma, zımpara, astar ve boya teklifte ayrıca yazılır.</li>
            <li>Hacim indirimi adet incelendikten sonra uygulanır.</li>
          </ul>
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
          <p className="mt-6 rounded-md border border-lime/30 bg-lime/10 px-4 py-3 text-sm leading-6 text-light-text">
            Modeliniz üretim değerlendirmesine gönderilecek. Kesin fiyat
            onaydan sonra bildirilecektir. Anlık fiyat gösterilmez.
          </p>
          {reviewPulse ? (
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-light">
              <FormSignal spinning className="size-4" />
              Seçimler güncellendi. Anlık fiyat hesaplanmaz.
            </p>
          ) : null}
          <button
            type="button"
            disabled={!file}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-cobalt text-sm font-semibold text-light-text disabled:opacity-40"
          >
            Değerlendirmeye gönder
          </button>
          <p className="mt-2 text-xs text-muted-light">
            Gönderim uç noktası Phase 3’te açılır. {siteConfig.name} şu an
            dosyayı kaydetmez.
          </p>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="flex gap-2 text-sm text-error">
          <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      {progress > 0 && progress < 100 ? (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Dosya hazırlanıyor"
          className="h-1 overflow-hidden rounded-full bg-white/10"
        >
          <div
            className="h-full origin-left bg-cyan transition-transform duration-150"
            style={{ transform: `scaleX(${progress / 100})` }}
          />
        </div>
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
          disabled={step === steps.length - 1 || (step === 0 && !file)}
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

  return (
    <div className="grid bg-midnight text-light-text lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]">
      <section className="relative min-h-[28rem] overflow-hidden lg:min-h-[calc(100svh-4rem)]">
        <GridDrift>
          <FoundryGrid variant="measure" />
          <FoundryGrid variant="fade" className="opacity-50" />
        </GridDrift>
        <div className="relative flex items-center justify-between border-b border-white/10 px-4 py-3 text-sm">
          <p className="flex items-center gap-2">
            <FormSignal className="size-4" />
            Görüntüleyici
          </p>
          <div className="flex gap-1">
            <button type="button" className="min-h-11 px-3 text-sm">
              Tel kafes
            </button>
            <button type="button" className="min-h-11 px-3 text-sm">
              <Ruler aria-hidden="true" className="mr-2 inline size-3.5" />
              Ölç
            </button>
            <button type="button" className="min-h-11 px-3 text-sm">
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
          className="relative grid min-h-[24rem] place-items-center p-8 lg:min-h-[calc(100svh-8rem)]"
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
        >
          <div
            aria-hidden="true"
            className="absolute inset-10 border border-dashed border-cyan/35"
          />
          <MeasurementFrame active={Boolean(file)} reduced={reduceMotion !== false} />
          <span
            aria-hidden="true"
            className="absolute top-16 left-12 text-xs tracking-wide text-cyan/70"
          >
            X 000
          </span>
          <span
            aria-hidden="true"
            className="absolute top-16 right-12 text-xs tracking-wide text-cyan/70"
          >
            Y 000
          </span>
          <span
            aria-hidden="true"
            className="absolute right-12 bottom-16 text-xs tracking-wide text-cyan/70"
          >
            Z 000
          </span>
          {file ? (
            <div className="text-center">
              {progress > 0 && progress < 100 ? (
                <FormSignal spinning className="mx-auto size-10" />
              ) : (
                <Box aria-hidden="true" className="mx-auto size-10 text-cyan" />
              )}
              <p className="mt-4 font-medium">{file.name}</p>
              <p className="mt-1 text-sm text-muted-light">
                {(file.size / (1024 * 1024)).toFixed(1)} MB · yerel önizleme
              </p>
              <p className="mt-6 text-xs text-muted-light">
                X 120 mm · Y 80 mm · Z 140 mm · ölçü tahmini henüz doğrulanmadı
              </p>
            </div>
          ) : (
            <p className="max-w-sm text-center text-sm text-muted-light">
              Dosya seçildiğinde burada yörünge, yakınlaştırma ve sınır kutusu
              yer alır. Dilimleme bağlı değil.
            </p>
          )}
        </div>
      </section>

      {isDesktop ? (
        <aside className="flex flex-col border-l border-white/10 bg-carbon">
          {stepNav("desktop")}
          <div className="flex-1 space-y-6 overflow-y-auto p-5 pb-8">
            <StepPanel step={step} reduced={reduceMotion !== false}>
              {stepContent}
            </StepPanel>
          </div>
          <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-white/10 bg-carbon px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {file?.name ?? "Dosya seçilmedi"}
              </p>
              <p className="text-xs text-muted-light">Anlık fiyat yok</p>
            </div>
          </div>
        </aside>
      ) : null}

      <div className="sticky bottom-0 z-30 border-t border-white/10 bg-carbon lg:hidden">
        {stepNav("mobile", true)}
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {file?.name ?? "Dosya seçilmedi"}
            </p>
            <p className="text-xs text-muted-light">Anlık fiyat yok</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex min-h-11 items-center rounded-md bg-cobalt px-4 text-sm font-semibold text-light-text"
          >
            Yapılandır
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && !isDesktop ? (
          <m.div
            initial={reduceMotion ? false : { opacity: 0.92, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.28, ease: foundryEase }}
            className="fixed inset-0 z-40 flex flex-col bg-carbon text-light-text lg:hidden"
          >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="font-heading text-xl font-bold">
              {step + 1}. {steps[step]}
            </p>
            <button
              type="button"
              aria-label="Kapat"
              onClick={() => setMobileOpen(false)}
              className="grid size-11 place-items-center"
            >
              <X />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 pb-8">
            <StepPanel step={step} reduced={reduceMotion !== false}>
              {stepContent}
            </StepPanel>
          </div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function StepPanel({
  step,
  reduced,
  children,
}: {
  step: number;
  reduced: boolean;
  children: ReactNode;
}) {
  return (
    <AnimatePresence mode="wait">
      <m.div
        key={step}
        initial={reduced ? false : { opacity: 0.78, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduced ? undefined : { opacity: 0, y: -6 }}
        transition={{ duration: 0.2, ease: foundryEase }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}

function MeasurementFrame({
  active,
  reduced,
}: {
  active: boolean;
  reduced: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-10 text-cyan/55"
    >
      <m.path
        d="M0 0 H100"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.4"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: active || reduced ? 1 : 0 }}
        transition={{ duration: 0.7, ease: foundryEase }}
      />
      <m.path
        d="M100 0 V100"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.4"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: active || reduced ? 1 : 0 }}
        transition={{ duration: 0.7, delay: 0.08, ease: foundryEase }}
      />
      <m.path
        d="M100 100 H0"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.4"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: active || reduced ? 1 : 0 }}
        transition={{ duration: 0.7, delay: 0.16, ease: foundryEase }}
      />
    </svg>
  );
}
