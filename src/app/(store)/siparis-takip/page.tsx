"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { formatMoney } from "@/lib/money";
import { useTranslations } from "next-intl";
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
  paymentState: WholesalePaymentState | string;
  fulfilmentState: WholesaleFulfilmentState | string;
  paymentLabel?: string;
  fulfilmentLabel?: string;
  packageTitle?: string;
  grandTotalMinor: number;
  shipmentCarrier: string | null;
  shipmentTrackingNumber: string | null;
  shipmentTrackingUrl: string | null;
}

function TrackForm() {
  const t = useTranslations();
  const STEPS = [
    { id: "received", label: t("track.received"), match: () => true },
    {
      id: "paid",
      label: t("track.paid"),
      match: (s: TrackStatus) =>
        s.paymentState === "paid" ||
        s.paymentState === "refunded" ||
        s.paymentState === "payment_pending",
    },
    {
      id: "preparing",
      label: t("track.preparing"),
      match: (s: TrackStatus) =>
        ["preparing", "ready_to_ship", "shipped", "delivered", "unfulfilled", "fulfilled"].includes(
          s.fulfilmentState,
        ),
    },
    {
      id: "shipped",
      label: t("track.shipped"),
      match: (s: TrackStatus) =>
        s.fulfilmentState === "shipped" || s.fulfilmentState === "delivered",
    },
    {
      id: "delivered",
      label: t("track.delivered"),
      match: (s: TrackStatus) => s.fulfilmentState === "delivered",
    },
  ] as const;
  const params = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(params.get("order") ?? "");
  const [token, setToken] = useState(params.get("token") ?? "");
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<TrackStatus | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);

  useEffect(() => {
    if (params.get("order") && params.get("token")) {
      void submit(params.get("order") ?? "", params.get("token") ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(nextOrder = orderNumber, nextToken = token, nextEmail = email) {
    setError(null);
    const order = nextOrder.trim();
    if (nextEmail.trim()) {
      const storeRes = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderNumber: order,
          email: nextEmail.trim(),
        }),
      });
      const storeData = (await storeRes.json()) as {
        error?: string;
        status?: TrackStatus;
        customerName?: string;
      };
      if (storeRes.ok && storeData.status) {
        setStatus(storeData.status);
        setCustomerName(storeData.customerName ?? null);
        return;
      }
    }
    const response = await fetch("/api/wholesale/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderNumber: order.toUpperCase(),
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
      setError(data.error ?? t("track.notFound"));
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
      <p className="eyebrow">{t("track.kicker")}</p>
      <h1 className="mt-3 font-heading text-4xl">{t("track.title")}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {t("track.lede")}
      </p>
      <form
        className="mt-6 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <label className="block text-sm font-semibold">
          {t("track.orderNumber")}
          <input
            className="mt-1 min-h-11 w-full rounded-md border px-3"
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value)}
            autoComplete="off"
          />
        </label>
        <label className="block text-sm font-semibold">
          {t("track.email")}
          <input
            className="mt-1 min-h-11 w-full rounded-md border px-3"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </label>
        <label className="block text-sm font-semibold">
          {t("track.token")}
          <input
            className="mt-1 min-h-11 w-full rounded-md border px-3"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            autoComplete="off"
          />
        </label>
        <button className="min-h-11 rounded-full bg-coral px-5 text-sm font-semibold text-white" type="submit">
          {t("track.submit")}
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
            {status.paymentLabel ??
              paymentStateLabel(status.paymentState as WholesalePaymentState)}{" "}
            ·{" "}
            {status.fulfilmentLabel ??
              fulfilmentStateLabel(status.fulfilmentState as WholesaleFulfilmentState)}
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
              {t("track.followCargo")}
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
