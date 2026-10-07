"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { formatMinorAsTryInput, formatMoney } from "@/lib/money";
import type { WholesaleReadiness } from "@/lib/wholesale/readiness";
import type { WholesaleSettings } from "@/lib/wholesale/types";

export function WholesaleSettingsPanel({
  settings,
  readiness,
}: {
  settings: WholesaleSettings;
  readiness: WholesaleReadiness;
}) {
  const router = useRouter();
  const [shippingTry, setShippingTry] = useState(
    settings.shippingGrossMinor == null
      ? "100,00"
      : formatMinorAsTryInput(settings.shippingGrossMinor),
  );
  const [checkoutOpen, setCheckoutOpen] = useState(readiness.checkoutOpen);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <section className="mb-8 rounded-2xl border border-white/10 p-5">
      <h2 className="font-heading text-2xl">Toptan satış ayarları</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Kargo ücretini Türk lirası olarak yazın. Müşteri toplamı sunucuda hesaplanır.
      </p>

      <form
        className="mt-5 grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const response = await fetch("/api/admin/wholesale/shipping", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ shippingTry, checkoutOpen }),
          });
          const data = (await response.json()) as { error?: string };
          setMessage(data.error ?? (response.ok ? "Ayarlar kaydedildi." : "Kaydedilemedi."));
          router.refresh();
        }}
      >
        <label className="text-sm">
          Kargo ücreti (₺)
          <input
            className="mt-1 min-h-11 w-full max-w-xs rounded-md border border-white/15 bg-transparent px-3"
            value={shippingTry}
            onChange={(event) => setShippingTry(event.target.value)}
            inputMode="decimal"
            placeholder="100,00"
          />
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={checkoutOpen}
            onChange={(event) => setCheckoutOpen(event.target.checked)}
          />
          Toptan satışı aç
        </label>
        <button className="min-h-11 max-w-xs rounded-full bg-white px-5 text-sm font-semibold text-black">
          Ayarları kaydet
        </button>
        {message ? <p className="text-sm">{message}</p> : null}
      </form>

      <dl className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Toptan satış</dt>
          <dd className="font-semibold">{readiness.checkoutOpen ? "Açık" : "Kapalı"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Ödeme ortamı</dt>
          <dd className="font-semibold">
            {readiness.paytrMode === "test" ? "Test" : "Canlı"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Sipariş e-postası</dt>
          <dd className="font-semibold">
            {readiness.emailConfigured ? "Hazır" : "Tanımlı değil"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Firma bilgileri</dt>
          <dd className="font-semibold">
            {readiness.companyComplete ? "Tamam" : "Eksik"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Güncel kargo</dt>
          <dd className="font-semibold">
            {settings.shippingGrossMinor == null
              ? "Yok"
              : formatMoney(settings.shippingGrossMinor)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Canlı satış</dt>
          <dd className="font-semibold">
            {readiness.liveReady ? "Kontrol listesi tamam" : "Henüz açılamaz"}
          </dd>
        </div>
      </dl>

      <h3 className="mt-6 text-sm font-semibold tracking-[0.12em] uppercase">
        Canlı satış kontrol listesi
      </h3>
      <ul className="mt-3 space-y-2 text-sm">
        {readiness.items.map((item) => (
          <li key={item.id}>
            {item.ready ? "●" : "○"} {item.label}
            <span className="block text-xs text-muted-foreground">{item.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
