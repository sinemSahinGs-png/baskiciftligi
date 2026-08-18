"use client";

import { useEffect, useState } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page";
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
  pricing: Array<{ version: number; activatedAt: string | null; isDevelopmentSeed: boolean }>;
  active: {
    version: number;
    isDevelopmentSeed: boolean;
    rates: {
      materialPricePerGramMinor: number;
      machineHourlyRateMinor: number;
      vatRate: number;
      minimumOrderNetMinor: number;
    };
  } | null;
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
          {data.active ? (
            <p className="mt-2 text-sm">
              PLA {formatMoney(data.active.rates.materialPricePerGramMinor)}/g · makine{" "}
              {formatMoney(data.active.rates.machineHourlyRateMinor)}/sa · min{" "}
              {formatMoney(data.active.rates.minimumOrderNetMinor)} · KDV %{" "}
              {Math.round(data.active.rates.vatRate * 100)}
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
              </li>
            ))}
          </ul>
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
