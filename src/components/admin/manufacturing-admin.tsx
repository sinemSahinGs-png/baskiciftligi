"use client";

import { useEffect, useState } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page";
import { PricingCalibrationForm } from "@/components/admin/pricing-calibration-form";
import { formatMoney } from "@/lib/money";

interface AdminPayload {
  thingiverse: string;
  workerOnline: boolean;
  printer: { name: string; buildVolumeMm: { x: number; y: number; z: number }; nozzleDiameterMm: number; notes: string };
  jobs: Array<{
    id: string;
    state: string;
    quoteId: string | null;
    errorMessage: string | null;
    updatedAt: string;
    flags: string[];
    metrics: { grams: number; seconds: number } | null;
  }>;
  pricing: Array<{
    version: number;
    formulaId?: string;
    activatedAt: string | null;
    isDevelopmentSeed: boolean;
    status?: string;
  }>;
  active: {
    version: number;
    isDevelopmentSeed: boolean;
    formulaId?: string;
    rates?: {
      materialPricePerGramMinor: number;
      machineHourlyRateMinor: number;
      vatRate: number;
      minimumOrderNetMinor: number;
    };
  } | null;
  pricingAudit?: {
    notes: string[];
    scenarios: Array<{
      id: string;
      label: string;
      quantity: number;
      grams: number;
      seconds: number;
      materialMinor: number;
      machineMinor: number;
      energyMinor: number;
      setupMinor: number;
      postMinor: number;
      packagingMinor: number;
      supportMinor: number;
      directMinor: number;
      riskAdjustedMinor: number;
      netMinor: number;
      vatMinor: number;
      grossMinor: number;
      shippingMinor: number;
      cartTotalMinor: number;
      unitGrossMinor: number;
    }>;
    inactiveOptions: Array<{
      id: string;
      label: string;
      status: "inactive";
      summary: string;
      materialPricePerGramMinor: number;
      machineHourlyRateMinor: number;
      targetMarginRate: number;
      setupFeeMinor: number;
    }>;
  } | null;
  canCalibrate?: boolean;
  showInternal?: boolean;
}

export function ManufacturingAdmin({
  title,
  mode,
}: {
  title: string;
  mode: "pricing" | "jobs" | "integrations" | "printers";
}) {
  const [data, setData] = useState<AdminPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/manufacturing", { cache: "no-store" })
      .then((response) => response.json())
      .then(setData)
      .catch(() => setError("Yönetim verisi alınamadı."));
  }, []);

  if (error) {
    return <p className="text-sm text-error">{error}</p>;
  }
  if (!data) {
    return <p className="text-sm text-muted-foreground">Yükleniyor.</p>;
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Üretim"
        title={title}
        description="Sunucu tarafı üretim teklifi, işçi ve fiyatlandırma. Sırlar gösterilmez."
      />
      {mode === "integrations" ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          <li className="rounded-2xl border border-white/10 p-4">
            Thingiverse: {data.thingiverse}
          </li>
          <li className="rounded-2xl border border-white/10 p-4">
            Dilimleme işçisi: {data.workerOnline ? "çevrimiçi" : "çevrimdışı"}
          </li>
          <li className="rounded-2xl border border-white/10 p-4">
            PrusaSlicer hedefi: 2.8.1
          </li>
          <li className="rounded-2xl border border-white/10 p-4">
            Fiyatlandırma: {data.active ? `v${data.active.version}` : "etkin değil"}
            {data.active?.isDevelopmentSeed ? " · geliştirme tohumu" : ""}
          </li>
        </ul>
      ) : null}
      {mode === "printers" ? (
        <section className="rounded-3xl border border-white/10 p-6">
          <h2 className="font-heading text-2xl">{data.printer.name}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{data.printer.notes}</p>
          <p className="mt-4 text-sm">
            Hacim {data.printer.buildVolumeMm.x}×{data.printer.buildVolumeMm.y}×
            {data.printer.buildVolumeMm.z} mm · nozul {data.printer.nozzleDiameterMm} mm
          </p>
        </section>
      ) : null}
      {mode === "pricing" ? (
        <section className="rounded-3xl border border-white/10 p-6">
          <p className="text-sm">
            Aktif sürüm: {data.active ? `v${data.active.version}` : "yok"}
          </p>
          {data.active?.rates ? (
            <p className="mt-2 text-sm">
              PLA {formatMoney(data.active.rates.materialPricePerGramMinor)}/g · makine{" "}
              {formatMoney(data.active.rates.machineHourlyRateMinor)}/sa · min{" "}
              {formatMoney(data.active.rates.minimumOrderNetMinor)} · KDV %{" "}
              {Math.round(data.active.rates.vatRate * 100)}
              <span className="block text-muted-foreground">
                Bu satır geliştirme tohumudur (bc-quote-v1). Üretim kalibrasyonu değildir.
              </span>
            </p>
          ) : null}
          <p className="mt-4 text-sm text-muted-foreground">
            Geliştirme tohum oranları üretimde sessizce kullanılmaz. Üretimde
            sahip oranları girip sürümü etkinleştirmelidir.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {data.pricing.map((item) => (
              <li key={item.version}>
                v{item.version} {item.activatedAt ? "etkin" : "taslak"}
                {item.isDevelopmentSeed ? " · tohum" : ""}
                {item.formulaId ? ` · ${item.formulaId}` : ""}
              </li>
            ))}
          </ul>
          {data.pricingAudit ? (
            <div className="mt-8 space-y-6">
              <section>
                <h2 className="font-heading text-xl">Canlı küp dönüşümü</h2>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {data.pricingAudit.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </section>
              <section className="overflow-x-auto">
                <h2 className="font-heading text-xl">Senaryo tablosu</h2>
                <table className="mt-3 min-w-[64rem] text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-2 pr-3">Senaryo</th>
                      <th className="py-2 pr-3">Malzeme</th>
                      <th className="py-2 pr-3">Makine</th>
                      <th className="py-2 pr-3">Enerji</th>
                      <th className="py-2 pr-3">Kurulum</th>
                      <th className="py-2 pr-3">Son işlem</th>
                      <th className="py-2 pr-3">Paket</th>
                      <th className="py-2 pr-3">Destek</th>
                      <th className="py-2 pr-3">Net</th>
                      <th className="py-2 pr-3">KDV</th>
                      <th className="py-2 pr-3">Brüt</th>
                      <th className="py-2 pr-3">Kargo</th>
                      <th className="py-2 pr-3">Birim</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.pricingAudit.scenarios.map((row) => (
                      <tr key={row.id} className="border-b border-white/5">
                        <td className="py-2 pr-3">{row.label}</td>
                        <td className="py-2 pr-3">{formatMoney(row.materialMinor)}</td>
                        <td className="py-2 pr-3">{formatMoney(row.machineMinor)}</td>
                        <td className="py-2 pr-3">{formatMoney(row.energyMinor)}</td>
                        <td className="py-2 pr-3">{formatMoney(row.setupMinor)}</td>
                        <td className="py-2 pr-3">{formatMoney(row.postMinor)}</td>
                        <td className="py-2 pr-3">{formatMoney(row.packagingMinor)}</td>
                        <td className="py-2 pr-3">{formatMoney(row.supportMinor)}</td>
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
              <section>
                <h2 className="font-heading text-xl">Etkin olmayan tarif önerileri</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Bu seçenekler kaydedilmez ve aktif oranı değiştirmez. Sahip açıkça
                  seçene kadar hepsi inactive kalır.
                </p>
                <ul className="mt-4 grid gap-3 md:grid-cols-3">
                  {data.pricingAudit.inactiveOptions.map((option) => (
                    <li key={option.id} className="rounded-2xl border border-dashed border-white/15 p-4">
                      <p className="text-xs font-bold tracking-[0.14em] text-warm uppercase">
                        {option.status}
                      </p>
                      <p className="mt-2 font-heading text-lg">{option.label}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{option.summary}</p>
                      <p className="mt-3 text-xs">
                        {formatMoney(option.materialPricePerGramMinor)}/g ·{" "}
                        {formatMoney(option.machineHourlyRateMinor)}/sa · marj %{" "}
                        {Math.round(option.targetMarginRate * 100)} · kurulum{" "}
                        {formatMoney(option.setupFeeMinor)}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          ) : null}
          <PricingCalibrationForm canCalibrate={Boolean(data.canCalibrate)} />
        </section>
      ) : null}
      {mode === "jobs" ? (
        <ul className="space-y-3">
          {data.jobs.length === 0 ? (
            <li className="text-sm text-muted-foreground">Kuyruk boş.</li>
          ) : (
            data.jobs.map((job) => (
              <li key={job.id} className="rounded-2xl border border-white/10 p-4 text-sm">
                <p className="font-semibold">{job.state}</p>
                <p className="mt-1 font-mono text-xs">{job.id}</p>
                {job.metrics ? (
                  <p className="mt-2">
                    {job.metrics.grams.toFixed(2)} g · {Math.round(job.metrics.seconds / 60)} dk
                  </p>
                ) : null}
                {job.errorMessage ? <p className="mt-2 text-error">{job.errorMessage}</p> : null}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </>
  );
}
