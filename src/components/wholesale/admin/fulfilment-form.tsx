"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { fulfilmentStateLabel } from "@/lib/wholesale/labels";
import type { WholesaleOrder } from "@/lib/wholesale/types";
import { WHOLESALE_FULFILMENT_STATES } from "@/lib/wholesale/types";

export function WholesaleFulfilmentForm({ order }: { order: WholesaleOrder }) {
  const router = useRouter();
  const [fulfilmentState, setFulfilmentState] = useState(order.fulfilmentState);
  const [carrier, setCarrier] = useState(order.shipmentCarrier ?? "");
  const [tracking, setTracking] = useState(order.shipmentTrackingNumber ?? "");
  const [trackingUrl, setTrackingUrl] = useState(order.shipmentTrackingUrl ?? "");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mt-6 grid gap-3 rounded-xl border border-white/10 p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const response = await fetch(`/api/admin/wholesale/orders/${order.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            fulfilmentState,
            shipmentCarrier: carrier || null,
            shipmentTrackingNumber: tracking || null,
            shipmentTrackingUrl: trackingUrl || null,
            internalNote: note || null,
          }),
        });
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? (response.ok ? "Kaydedildi." : "Hata"));
        router.refresh();
      }}
    >
      <label className="text-sm">
        Hazırlık durumu
        <select
          className="mt-1 min-h-11 w-full rounded-md border border-white/15 bg-transparent px-3"
          value={fulfilmentState}
          onChange={(event) =>
            setFulfilmentState(event.target.value as typeof fulfilmentState)
          }
        >
          {WHOLESALE_FULFILMENT_STATES.map((state) => (
            <option key={state} value={state}>
              {fulfilmentStateLabel(state)}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        Kargo firması
        <input
          className="mt-1 min-h-11 w-full rounded-md border border-white/15 bg-transparent px-3"
          value={carrier}
          onChange={(event) => setCarrier(event.target.value)}
        />
      </label>
      <label className="text-sm">
        Takip numarası
        <input
          className="mt-1 min-h-11 w-full rounded-md border border-white/15 bg-transparent px-3"
          value={tracking}
          onChange={(event) => setTracking(event.target.value)}
        />
      </label>
      <label className="text-sm">
        Takip URL
        <input
          className="mt-1 min-h-11 w-full rounded-md border border-white/15 bg-transparent px-3"
          value={trackingUrl}
          onChange={(event) => setTrackingUrl(event.target.value)}
        />
      </label>
      <label className="text-sm">
        İç not
        <textarea
          className="mt-1 min-h-24 w-full rounded-md border border-white/15 bg-transparent px-3 py-2"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <button className="min-h-11 max-w-xs rounded-full bg-white text-sm font-semibold text-black">
        Güncelle
      </button>
      {error ? <p className="text-sm">{error}</p> : null}
    </form>
  );
}
