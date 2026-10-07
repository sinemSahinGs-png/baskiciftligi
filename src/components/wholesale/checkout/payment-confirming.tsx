"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Route } from "next";

import { formatMoney } from "@/lib/money";
import {
  fulfilmentStateLabel,
  paymentStateLabel,
} from "@/lib/wholesale/labels";
import type {
  WholesaleFulfilmentState,
  WholesalePaymentState,
} from "@/lib/wholesale/types";

interface StatusPayload {
  orderNumber: string;
  paymentState: WholesalePaymentState;
  fulfilmentState: WholesaleFulfilmentState;
  paymentLabel?: string;
  fulfilmentLabel?: string;
  grandTotalMinor: number;
  shipmentTrackingUrl: string | null;
}

export function PaymentConfirming({
  orderNumber,
  token,
  tone,
}: {
  orderNumber: string;
  token: string;
  tone: "success" | "fail";
}) {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const resolvedToken =
    token ||
    (typeof window !== "undefined" && orderNumber
      ? sessionStorage.getItem(`ws-track-${orderNumber}`) ?? ""
      : "");

  useEffect(() => {
    if (!orderNumber || !resolvedToken) {
      return;
    }
    let cancelled = false;
    let attempts = 0;
    const poll = async () => {
      attempts += 1;
      const response = await fetch(
        `/api/wholesale/orders/${encodeURIComponent(orderNumber)}/status?token=${encodeURIComponent(resolvedToken)}`,
      );
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as { status: StatusPayload };
      if (!cancelled) {
        setStatus(data.status);
      }
      if (data.status.paymentState === "payment_pending" && attempts < 12) {
        window.setTimeout(poll, 2500);
      }
    };
    void poll();
    return () => {
      cancelled = true;
    };
  }, [orderNumber, resolvedToken]);

  const paid = status?.paymentState === "paid";
  const failed = status?.paymentState === "payment_failed" || tone === "fail";
  const paymentLabel = status
    ? (status.paymentLabel ?? paymentStateLabel(status.paymentState))
    : null;
  const fulfilmentLabel = status
    ? (status.fulfilmentLabel ?? fulfilmentStateLabel(status.fulfilmentState))
    : null;

  return (
    <div className="shell max-w-lg py-16">
      <p className="eyebrow">Ödeme</p>
      <h1 className="mt-3 font-heading text-4xl">
        {paid
          ? "Ödeme onaylandı."
          : failed && !paid
            ? "Ödeme alınamadı."
            : "Ödeme onaylanıyor."}
      </h1>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        {paid
          ? "Siparişiniz alındı. Hazırlık sürecini sipariş numaranızla takip edebilirsiniz."
          : "Ödeme henüz onaylanmadı. Bu sayfaya dönmek tek başına ödeme kanıtı değildir. Lütfen birkaç dakika bekleyip sipariş durumunu kontrol edin."}
      </p>
      {orderNumber ? (
        <p className="mt-4 text-sm font-semibold">Sipariş no: {orderNumber}</p>
      ) : null}
      {status ? (
        <p className="mt-2 text-sm">
          Tutar: {formatMoney(status.grandTotalMinor)} · {paymentLabel}
          {fulfilmentLabel ? ` · ${fulfilmentLabel}` : ""}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={"/toptan" as Route} className="min-h-11 rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white">
          Toptan sayfasına dön
        </Link>
        {orderNumber && resolvedToken ? (
          <Link
            href={`/siparis-takip?order=${encodeURIComponent(orderNumber)}&token=${encodeURIComponent(resolvedToken)}` as Route}
            className="min-h-11 rounded-full border px-5 py-3 text-sm font-semibold"
          >
            Siparişi takip et
          </Link>
        ) : (
          <Link href={"/siparis-takip" as Route} className="min-h-11 rounded-full border px-5 py-3 text-sm font-semibold">
            Sipariş takip
          </Link>
        )}
      </div>
    </div>
  );
}
