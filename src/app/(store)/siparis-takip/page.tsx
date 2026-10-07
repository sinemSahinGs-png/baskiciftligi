"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { formatMoney } from "@/lib/money";
import {
  fulfilmentStateLabel,
  paymentStateLabel,
} from "@/lib/wholesale/labels";
import type {
  WholesaleFulfilmentState,
  WholesalePaymentState,
} from "@/lib/wholesale/types";

interface TrackStatus {
  orderNumber: string;
  paymentState: WholesalePaymentState;
  fulfilmentState: WholesaleFulfilmentState;
  paymentLabel?: string;
  fulfilmentLabel?: string;
  packageTitle?: string;
  grandTotalMinor: number;
  shipmentCarrier: string | null;
  shipmentTrackingNumber: string | null;
  shipmentTrackingUrl: string | null;
}

const STEPS = [
  { id: "received", label: "Sipariş alındı", match: () => true },
  {
    id: "paid",
    label: "Ödeme onaylandı",
    match: (s: TrackStatus) =>
      s.paymentState === "paid" || s.paymentState === "refunded",
  },
  {
    id: "preparing",
    label: "Hazırlanıyor",
    match: (s: TrackStatus) =>
      ["preparing", "ready_to_ship", "shipped", "delivered"].includes(
        s.fulfilmentState,
      ),
  },
  {
    id: "shipped",
    label: "Kargoya verildi",
    match: (s: TrackStatus) =>
      s.fulfilmentState === "shipped" || s.fulfilmentState === "delivered",
  },
  {
    id: "delivered",
    label: "Teslim edildi",
    match: (s: TrackStatus) => s.fulfilmentState === "delivered",
  },
] as const;

function TrackForm() {
  const params = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(params.get("order") ?? "");
  const [token, setToken] = useState(params.get("token") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<TrackStatus | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);

  useEffect(() => {
    if (params.get("order") && params.get("token")) {
      void submit(params.get("order") ?? "", params.get("token") ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(nextOrder = orderNumber, nextToken = token) {
    setError(null);
    const response = await fetch("/api/wholesale/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderNumber: nextOrder.trim().toUpperCase(),
        token: nextToken.trim(),
      }),
    });
    const data = (await response.json()) as {
      error?: string;
      status?: TrackStatus;
      customerName?: string;
    };
    if (!response.ok || !data.status) {
      setStatus(null);
      setError(data.error ?? "Sipariş bulunamadı.");
      return;
    }
    setStatus(data.status);
    setCustomerName(data.customerName ?? null);
  }

  const visibleSteps = useMemo(() => {
    if (!status) {
      return [];
    }
    return STEPS.filter((step, index) => {
      if (index === 0) {
        return true;
      }
      return step.match(status) || STEPS.slice(0, index + 1).some((s) => s.match(status));
    });
  }, [status]);

  return (
    <div className="shell max-w-xl py-12">
      <p className="eyebrow">Takip</p>
      <h1 className="mt-3 font-heading text-4xl">Sipariş takip</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Sipariş numarası tek başına yeterli değildir. Size verilen takip
        anahtarını girin.
      </p>
      <form
        className="mt-6 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <label className="block text-sm font-semibold">
          Sipariş numarası
          <input
            className="mt-1 min-h-11 w-full rounded-md border px-3"
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value)}
            autoComplete="off"
          />
        </label>
        <label className="block text-sm font-semibold">
          Takip anahtarı
          <input
            className="mt-1 min-h-11 w-full rounded-md border px-3"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            autoComplete="off"
          />
        </label>
        <button className="min-h-11 rounded-full bg-coral px-5 text-sm font-semibold text-white" type="submit">
          Sorgula
        </button>
      </form>
      {error ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {status ? (
        <div className="mt-8 rounded-2xl border bg-white p-5">
          <p className="text-sm">{customerName}</p>
          <p className="font-heading text-2xl">{status.orderNumber}</p>
          <p className="mt-1 text-sm">{status.packageTitle}</p>
          <p className="text-sm">{formatMoney(status.grandTotalMinor)}</p>
          <p className="mt-1 text-sm">
            {status.paymentLabel ?? paymentStateLabel(status.paymentState)} ·{" "}
            {status.fulfilmentLabel ?? fulfilmentStateLabel(status.fulfilmentState)}
          </p>
          <ol className="mt-5 space-y-2">
            {visibleSteps.map((step) => {
              const done = step.match(status);
              return (
                <li key={step.id} className={done ? "font-semibold" : "text-muted-foreground"}>
                  {done ? "●" : "○"} {step.label}
                </li>
              );
            })}
          </ol>
          {status.shipmentTrackingUrl ? (
            <a
              className="mt-4 inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-white"
              href={status.shipmentTrackingUrl}
              rel="noreferrer"
              target="_blank"
            >
              Kargoyu takip et
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense>
      <TrackForm />
    </Suspense>
  );
}
