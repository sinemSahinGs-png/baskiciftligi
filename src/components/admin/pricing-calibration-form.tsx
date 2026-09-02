"use client";

import { useMemo, useState, type ReactNode } from "react";

import { formatMoney } from "@/lib/money";
import { liraInputFromMinorUnits, liraStringToMinorUnits } from "@/lib/catalog/money-input";
import {
  CALIBRATION_FIELDS,
  CUBE_CALIBRATION_METRICS,
  calibrationIssues,
  cubeCalibrationPreview,
  isCompleteCalibration,
  LEGACY_FORMULA_WARNING,
  type CalibratedQuote,
} from "@/domain/manufacturing/pricing-calibration";
import {
  LAUNCH_ACTIVATION_CONFIRM_PHRASE,
  LAUNCH_OWNER_CALIBRATION,
  OWNER_PRODUCTION_PRESET_NAME,
} from "@/domain/manufacturing/launch-calibration";
import type { PricingCalibrationInputs } from "@/domain/manufacturing/types";

interface FormState {
  filamentSpoolPrice: string;
  spoolWeightGrams: string;
  wastePercent: string;
  printerPurchasePrice: string;
  depreciationHours: string;
  maintenanceBasis: "" | "hourly" | "annual";
  maintenanceAmount: string;
  expectedAnnualPrintHours: string;
  electricityPrice: string;
  printerPowerWatts: string;
  laborHourly: string;
  setupMinutesPerOrder: string;
  postProcessingMinutesPerUnit: string;
  supportRemovalMinutesPerJob: string;
  packagingCost: string;
  packagingBasis: "" | "unit" | "shipment";
  failedPrintPercent: string;
  targetMarginPercent: string;
  minimumOrderNet: string;
  vatPercent: string;
  shippingDisplay: string;
  shippingFreeThreshold: string;
  quoteLifetimeHours: string;
}

function formStateFromOwnerCalibration(): FormState {
  const input = LAUNCH_OWNER_CALIBRATION;
  return {
    filamentSpoolPrice: liraInputFromMinorUnits(input.filamentSpoolPriceMinor),
    spoolWeightGrams: String(input.spoolWeightGrams),
    wastePercent: String(input.wastePercent),
    printerPurchasePrice: liraInputFromMinorUnits(input.printerPurchasePriceMinor),
    depreciationHours: String(input.depreciationHours),
    maintenanceBasis: input.maintenanceBasis,
    maintenanceAmount: liraInputFromMinorUnits(input.maintenanceMinor),
    expectedAnnualPrintHours:
      input.expectedAnnualPrintHours > 0 ? String(input.expectedAnnualPrintHours) : "",
    electricityPrice: liraInputFromMinorUnits(input.electricityPricePerKwhMinor),
    printerPowerWatts: String(input.printerPowerWatts),
    laborHourly: liraInputFromMinorUnits(input.laborHourlyMinor),
    setupMinutesPerOrder: String(input.setupMinutesPerOrder),
    postProcessingMinutesPerUnit: String(input.postProcessingMinutesPerUnit),
    supportRemovalMinutesPerJob: String(input.supportRemovalMinutesPerJob),
    packagingCost: liraInputFromMinorUnits(input.packagingMinor),
    packagingBasis: input.packagingBasis,
    failedPrintPercent: String(input.failedPrintPercent),
    targetMarginPercent: String(Math.round(input.targetMarginRate * 100)),
    minimumOrderNet: liraInputFromMinorUnits(input.minimumOrderNetMinor),
    vatPercent: String(Math.round(input.vatRate * 100)),
    shippingDisplay: liraInputFromMinorUnits(input.shippingDisplayMinor),
    shippingFreeThreshold:
      input.shippingFreeThresholdMinor === null || input.shippingFreeThresholdMinor === undefined
        ? ""
        : liraInputFromMinorUnits(input.shippingFreeThresholdMinor),
    quoteLifetimeHours: String(input.quoteLifetimeHours),
  };
}

function parseLira(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }
  try {
    return liraStringToMinorUnits(value);
  } catch {
    return undefined;
  }
}

function parseNumber(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }
  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function helpFor(key: keyof PricingCalibrationInputs) {
  return CALIBRATION_FIELDS.find((field) => field.key === key)?.help ?? "";
}

function Field({
  id,
  label,
  help,
  children,
}: {
  id: string;
  label: string;
  help: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      <p className="text-xs leading-5 text-muted-foreground">{help}</p>
    </div>
  );
}

const inputClass =
  "min-h-11 w-full rounded-md border border-white/15 bg-black/20 px-3 text-sm";

export function PricingCalibrationForm({ canCalibrate }: { canCalibrate: boolean }) {
  const [form, setForm] = useState<FormState>(formStateFromOwnerCalibration);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [activateMessage, setActivateMessage] = useState<string | null>(null);
  const [confirmPhrase, setConfirmPhrase] = useState("");

  const parsed = useMemo((): Partial<PricingCalibrationInputs> => {
    const threshold = form.shippingFreeThreshold.trim();
    return {
      filamentSpoolPriceMinor: parseLira(form.filamentSpoolPrice),
      spoolWeightGrams: parseNumber(form.spoolWeightGrams),
      wastePercent: parseNumber(form.wastePercent),
      printerPurchasePriceMinor: parseLira(form.printerPurchasePrice),
      depreciationHours: parseNumber(form.depreciationHours),
      maintenanceBasis: form.maintenanceBasis || undefined,
      maintenanceMinor: parseLira(form.maintenanceAmount),
      expectedAnnualPrintHours: parseNumber(form.expectedAnnualPrintHours) ?? 0,
      electricityPricePerKwhMinor: parseLira(form.electricityPrice),
      printerPowerWatts: parseNumber(form.printerPowerWatts),
      laborHourlyMinor: parseLira(form.laborHourly),
      setupMinutesPerOrder: parseNumber(form.setupMinutesPerOrder),
      postProcessingMinutesPerUnit: parseNumber(form.postProcessingMinutesPerUnit),
      supportRemovalMinutesPerJob: parseNumber(form.supportRemovalMinutesPerJob),
      packagingMinor: parseLira(form.packagingCost),
      packagingBasis: form.packagingBasis || undefined,
      failedPrintPercent: parseNumber(form.failedPrintPercent),
      targetMarginRate:
        parseNumber(form.targetMarginPercent) === undefined
          ? undefined
          : (parseNumber(form.targetMarginPercent) ?? 0) / 100,
      minimumOrderNetMinor: parseLira(form.minimumOrderNet),
      vatRate:
        parseNumber(form.vatPercent) === undefined
          ? undefined
          : (parseNumber(form.vatPercent) ?? 0) / 100,
      shippingDisplayMinor: parseLira(form.shippingDisplay),
      shippingFreeThresholdMinor: threshold ? parseLira(threshold) ?? null : null,
      quoteLifetimeHours: parseNumber(form.quoteLifetimeHours),
    };
  }, [form]);

  const issues = calibrationIssues(parsed);
  const complete = isCompleteCalibration(parsed);
  const previews: CalibratedQuote[] = complete ? cubeCalibrationPreview(parsed) : [];
  const primary = previews[0];

  async function activateProduction() {
    if (!complete) {
      setActivateError("Önce tüm sahip girdilerini doldurun ve taslağı kaydedin.");
      return;
    }
    if (confirmPhrase !== LAUNCH_ACTIVATION_CONFIRM_PHRASE) {
      setActivateError(`Onay için tam olarak "${LAUNCH_ACTIVATION_CONFIRM_PHRASE}" yazın.`);
      return;
    }
    setActivating(true);
    setActivateError(null);
    setActivateMessage(null);
    try {
      const response = await fetch("/api/admin/manufacturing/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmPhrase: LAUNCH_ACTIVATION_CONFIRM_PHRASE,
          calibration: { ...parsed, presetName: OWNER_PRODUCTION_PRESET_NAME },
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        version?: number;
        checksum?: string;
        cubeGrossMinor?: number;
      };
      if (!response.ok) {
        setActivateError(payload.error ?? "Etkinleştirme başarısız.");
        return;
      }
      setActivateMessage(
        `bc-quote-v2 v${payload.version} etkin. Checksum ${payload.checksum?.slice(0, 12)}… · küp brüt ${payload.cubeGrossMinor} kuruş. Yedek alındı; denetim kaydı yazıldı.`,
      );
      setConfirmPhrase("");
    } catch {
      setActivateError("Etkinleştirme başarısız.");
    } finally {
      setActivating(false);
    }
  }

  async function saveDraft(): Promise<number | null> {
    if (!complete) {
      setSaveError("Önce tüm sahip girdilerini doldurun.");
      return null;
    }
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    try {
      const response = await fetch("/api/admin/manufacturing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calibration: { ...parsed, presetName: OWNER_PRODUCTION_PRESET_NAME },
          activate: false,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        version?: number;
        status?: string;
      };
      if (!response.ok) {
        setSaveError(payload.error ?? "Taslak kaydedilemedi.");
        return null;
      }
      setSaveMessage(
        `v${payload.version} taslak kaydedildi (${payload.status ?? "inactive"}). Mevcut imzalı teklifler değişmez.`,
      );
      return payload.version ?? null;
    } catch {
      setSaveError("Taslak kaydedilemedi.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  if (!canCalibrate) {
    return (
      <p className="mt-8 text-sm text-muted-foreground">
        Kalibrasyon formu yalnızca sahip içindir. İç maliyet ve marj kamu teklifinde
        gösterilmez.
      </p>
    );
  }

  return (
    <div className="mt-10 space-y-8">
      <section className="rounded-3xl border border-warm/30 bg-warm/5 p-6">
        <h2 className="font-heading text-xl">Sahip kalibrasyonu (etkin değil)</h2>
        <p className="mt-2 text-sm font-semibold" data-owner-calibration-preset>
          {OWNER_PRODUCTION_PRESET_NAME}
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {LEGACY_FORMULA_WARNING}
        </p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Aşağıdaki sayılar canlı PrusaSlicer küp ölçüleridir ve değiştirilmez:{" "}
          {CUBE_CALIBRATION_METRICS.grams} g · {CUBE_CALIBRATION_METRICS.seconds} sn
          (20 mm). Form boş açıldığında Bambu Lab A1 Combo işletme değerleri doldurulur.
          Taslak Supabase’e kaydedilir; üretim tarifesi siz {LAUNCH_ACTIVATION_CONFIRM_PHRASE}{" "}
          yazana kadar değişmez.
        </p>
      </section>

      <section className="grid gap-8 xl:grid-cols-2">
        <div className="space-y-8">
          <fieldset className="space-y-4">
            <legend className="font-heading text-lg">Malzeme</legend>
            <Field id="spool-price" label="Filament rulo fiyatı (₺)" help={helpFor("filamentSpoolPriceMinor")}>
              <input id="spool-price" className={inputClass} inputMode="decimal" value={form.filamentSpoolPrice} onChange={(event) => set("filamentSpoolPrice", event.target.value)} />
            </Field>
            <Field id="spool-weight" label="Rulo ağırlığı (g)" help={helpFor("spoolWeightGrams")}>
              <input id="spool-weight" className={inputClass} inputMode="decimal" value={form.spoolWeightGrams} onChange={(event) => set("spoolWeightGrams", event.target.value)} />
            </Field>
            <Field id="waste" label="Fire yüzdesi" help={helpFor("wastePercent")}>
              <input id="waste" className={inputClass} inputMode="decimal" value={form.wastePercent} onChange={(event) => set("wastePercent", event.target.value)} />
            </Field>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="font-heading text-lg">Yazıcı, bakım, elektrik</legend>
            <Field id="printer-price" label="Yazıcı alış fiyatı (₺)" help={helpFor("printerPurchasePriceMinor")}>
              <input id="printer-price" className={inputClass} inputMode="decimal" value={form.printerPurchasePrice} onChange={(event) => set("printerPurchasePrice", event.target.value)} />
            </Field>
            <Field id="dep-hours" label="Beklenen yıpranma saati" help={helpFor("depreciationHours")}>
              <input id="dep-hours" className={inputClass} inputMode="decimal" value={form.depreciationHours} onChange={(event) => set("depreciationHours", event.target.value)} />
            </Field>
            <Field id="maint-basis" label="Bakım birimi" help={helpFor("maintenanceBasis")}>
              <select id="maint-basis" className={inputClass} value={form.maintenanceBasis} onChange={(event) => set("maintenanceBasis", event.target.value as FormState["maintenanceBasis"])}>
                <option value="">Seçin</option>
                <option value="hourly">Saatlik</option>
                <option value="annual">Yıllık</option>
              </select>
            </Field>
            <Field id="maint-amount" label="Bakım ödeneği (₺)" help={helpFor("maintenanceMinor")}>
              <input id="maint-amount" className={inputClass} inputMode="decimal" value={form.maintenanceAmount} onChange={(event) => set("maintenanceAmount", event.target.value)} />
            </Field>
            {form.maintenanceBasis === "annual" ? (
              <Field id="annual-hours" label="Yıllık baskı saati" help={helpFor("expectedAnnualPrintHours")}>
                <input id="annual-hours" className={inputClass} inputMode="decimal" value={form.expectedAnnualPrintHours} onChange={(event) => set("expectedAnnualPrintHours", event.target.value)} />
              </Field>
            ) : null}
            <Field id="kwh" label="Elektrik ₺ / kWh" help={helpFor("electricityPricePerKwhMinor")}>
              <input id="kwh" className={inputClass} inputMode="decimal" value={form.electricityPrice} onChange={(event) => set("electricityPrice", event.target.value)} />
            </Field>
            <Field id="watts" label="Ortalama güç (watt)" help={helpFor("printerPowerWatts")}>
              <input id="watts" className={inputClass} inputMode="decimal" value={form.printerPowerWatts} onChange={(event) => set("printerPowerWatts", event.target.value)} />
            </Field>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="font-heading text-lg">Emek</legend>
            <Field id="labor" label="Emek saati değeri (₺)" help={helpFor("laborHourlyMinor")}>
              <input id="labor" className={inputClass} inputMode="decimal" value={form.laborHourly} onChange={(event) => set("laborHourly", event.target.value)} />
            </Field>
            <Field id="setup-min" label="Kurulum dakikası / sipariş" help={helpFor("setupMinutesPerOrder")}>
              <input id="setup-min" className={inputClass} inputMode="decimal" value={form.setupMinutesPerOrder} onChange={(event) => set("setupMinutesPerOrder", event.target.value)} />
            </Field>
            <Field id="post-min" label="Son işlem dakikası / birim" help={helpFor("postProcessingMinutesPerUnit")}>
              <input id="post-min" className={inputClass} inputMode="decimal" value={form.postProcessingMinutesPerUnit} onChange={(event) => set("postProcessingMinutesPerUnit", event.target.value)} />
            </Field>
            <Field id="support-min" label="Destek söküm dakikası / iş" help={helpFor("supportRemovalMinutesPerJob")}>
              <input id="support-min" className={inputClass} inputMode="decimal" value={form.supportRemovalMinutesPerJob} onChange={(event) => set("supportRemovalMinutesPerJob", event.target.value)} />
            </Field>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="font-heading text-lg">Paketleme ve kargo</legend>
            <Field id="pack-cost" label="Paketleme maliyeti (₺)" help={helpFor("packagingMinor")}>
              <input id="pack-cost" className={inputClass} inputMode="decimal" value={form.packagingCost} onChange={(event) => set("packagingCost", event.target.value)} />
            </Field>
            <Field id="pack-basis" label="Paketleme tahsisi" help={helpFor("packagingBasis")}>
              <select id="pack-basis" className={inputClass} value={form.packagingBasis} onChange={(event) => set("packagingBasis", event.target.value as FormState["packagingBasis"])}>
                <option value="">Seçin</option>
                <option value="shipment">Gönderi başına (sabit)</option>
                <option value="unit">Birim başına</option>
              </select>
            </Field>
            <Field id="ship" label="Kargo gösterim tutarı (₺)" help={helpFor("shippingDisplayMinor")}>
              <input id="ship" className={inputClass} inputMode="decimal" value={form.shippingDisplay} onChange={(event) => set("shippingDisplay", event.target.value)} />
            </Field>
            <Field id="ship-free" label="Ücretsiz kargo eşiği (₺, boş bırakılabilir)" help={helpFor("shippingFreeThresholdMinor")}>
              <input id="ship-free" className={inputClass} inputMode="decimal" value={form.shippingFreeThreshold} onChange={(event) => set("shippingFreeThreshold", event.target.value)} />
            </Field>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="font-heading text-lg">Fire, kâr, vergi</legend>
            <Field id="fail" label="Başarısız baskı payı (%)" help={helpFor("failedPrintPercent")}>
              <input id="fail" className={inputClass} inputMode="decimal" value={form.failedPrintPercent} onChange={(event) => set("failedPrintPercent", event.target.value)} />
            </Field>
            <Field id="margin" label="Hedef net kâr (%)" help={helpFor("targetMarginRate")}>
              <input id="margin" className={inputClass} inputMode="decimal" value={form.targetMarginPercent} onChange={(event) => set("targetMarginPercent", event.target.value)} />
            </Field>
            <Field id="min-net" label="Asgari net sipariş (₺)" help={helpFor("minimumOrderNetMinor")}>
              <input id="min-net" className={inputClass} inputMode="decimal" value={form.minimumOrderNet} onChange={(event) => set("minimumOrderNet", event.target.value)} />
            </Field>
            <Field id="vat" label="KDV (%)" help={helpFor("vatRate")}>
              <input id="vat" className={inputClass} inputMode="decimal" value={form.vatPercent} onChange={(event) => set("vatPercent", event.target.value)} />
            </Field>
            <Field id="ttl" label="Teklif süresi (saat)" help={helpFor("quoteLifetimeHours")}>
              <input id="ttl" className={inputClass} inputMode="decimal" value={form.quoteLifetimeHours} onChange={(event) => set("quoteLifetimeHours", event.target.value)} />
            </Field>
          </fieldset>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 p-6">
            <h3 className="font-heading text-lg">Eksik sahip girdileri</h3>
            {complete ? (
              <p className="mt-2 text-sm">Tüm kalibrasyon alanları dolu. Bu bir önizlemedir, tarife etkin değildir.</p>
            ) : (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {issues.map((issue) => (
                  <li key={`${issue.key}:${issue.message}`}>{issue.message}</li>
                ))}
              </ul>
            )}
          </section>

          {primary ? (
            <>
              <section className="rounded-3xl border border-white/10 p-6">
                <h3 className="font-heading text-lg">Canlı küp hesabı</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sabit sipariş {formatMoney(primary.fixedOrderMinor)} · birime bağlı {formatMoney(primary.variableMinor)}
                </p>
                <ol className="mt-4 space-y-3 text-sm">
                  {primary.steps.map((step) => (
                    <li key={step.id}>
                      <p className="font-semibold">
                        {step.title}: {formatMoney(step.minor)}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {step.kind === "fixed" ? "sabit" : step.kind === "unit" ? "birim" : step.kind}
                        </span>
                      </p>
                      <p className="text-xs leading-5 text-muted-foreground">{step.detail}</p>
                    </li>
                  ))}
                </ol>
              </section>
              <section className="overflow-x-auto rounded-3xl border border-white/10 p-6">
                <h3 className="font-heading text-lg">Adet 1 / 5 / 10</h3>
                <table className="mt-3 min-w-[36rem] text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-2 pr-3">Adet</th>
                      <th className="py-2 pr-3">Sabit</th>
                      <th className="py-2 pr-3">Değişken</th>
                      <th className="py-2 pr-3">Net</th>
                      <th className="py-2 pr-3">KDV</th>
                      <th className="py-2 pr-3">Brüt</th>
                      <th className="py-2 pr-3">Kargo</th>
                      <th className="py-2 pr-3">Birim brüt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previews.map((row) => (
                      <tr key={row.quantity} className="border-b border-white/5">
                        <td className="py-2 pr-3">{row.quantity}</td>
                        <td className="py-2 pr-3">{formatMoney(row.fixedOrderMinor)}</td>
                        <td className="py-2 pr-3">{formatMoney(row.variableMinor)}</td>
                        <td className="py-2 pr-3">{formatMoney(row.netMinor)}</td>
                        <td className="py-2 pr-3">{formatMoney(row.vatMinor)}</td>
                        <td className="py-2 pr-3">{formatMoney(row.grossMinor)}</td>
                        <td className="py-2 pr-3">{formatMoney(row.shippingMinor)}</td>
                        <td className="py-2 pr-3">{formatMoney(row.unitGrossMinor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Önizleme, tüm gerçek iş girdileri girildikten sonra 20 mm küp için hesaplanır.
              Varsayılan kâr uydurulmaz.
            </p>
          )}

          <div className="flex flex-col gap-3">
            <button
              type="button"
              disabled={!complete || saving}
              onClick={() => void saveDraft()}
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-cobalt px-4 text-sm font-semibold text-light-text disabled:opacity-40"
            >
              {saving ? "Kaydediliyor" : "Taslak kaydet (etkinleştirilmez)"}
            </button>
            <div className="space-y-2 rounded-2xl border border-warm/30 bg-warm/5 p-4">
              <p className="text-xs leading-5 text-muted-foreground">
                Üretim tarifesini etkinleştirmek için onay ifadesini yazın:{" "}
                <span className="font-mono text-light-text">{LAUNCH_ACTIVATION_CONFIRM_PHRASE}</span>
              </p>
              <input
                aria-label="Etkinleştirme onay ifadesi"
                className={inputClass}
                value={confirmPhrase}
                onChange={(event) => setConfirmPhrase(event.target.value)}
                placeholder={LAUNCH_ACTIVATION_CONFIRM_PHRASE}
              />
              <button
                type="button"
                disabled={!complete || activating || confirmPhrase !== LAUNCH_ACTIVATION_CONFIRM_PHRASE}
                onClick={() => void activateProduction()}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-warm/40 bg-warm/10 px-4 text-sm font-semibold disabled:opacity-40"
              >
                {activating ? "Etkinleştiriliyor" : "bc-quote-v2 üretim tarifesini etkinleştir"}
              </button>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Etkinleştirme önce aktif tarifeyi yedekler, dokuz senaryoyu doğrular ve denetim kaydı yazar.
              Mevcut v1 imzalı teklifler değişmez.
            </p>
            {activateMessage ? <p className="text-sm text-lime">{activateMessage}</p> : null}
            {activateError ? <p className="text-sm text-error">{activateError}</p> : null}
            {saveMessage ? <p className="text-sm text-lime">{saveMessage}</p> : null}
            {saveError ? <p className="text-sm text-error">{saveError}</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
