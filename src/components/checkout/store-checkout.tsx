"use client";

import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";

import { formatMoney } from "@/lib/money";
import { useCartStore } from "@/stores/cart-store";
import { useTranslations } from "next-intl";

type PricePayload = {
  totalMinor?: number;
  subtotalMinor?: number;
  estimatedShippingMinor?: number;
  hasUnavailableItems?: boolean;
};

export function StoreCheckout({
  email,
  displayName,
}: {
  email: string;
  displayName: string;
}) {
  const t = useTranslations();
  const lines = useCartStore((s) => s.lines);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [totals, setTotals] = useState<PricePayload | null>(null);

  const payloadLines = useMemo(
    () =>
      lines.map((line) => ({
        productId: line.productId,
        variantId: line.variantId ?? null,
        quantity: line.quantity,
        quoteId: line.quoteId,
      })),
    [lines],
  );

  async function refreshPrice() {
    const response = await fetch("/api/cart/price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines: payloadLines }),
    });
    const json = (await response.json()) as PricePayload;
    setTotals(json);
    return json;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSending(true);
    const form = new FormData(event.currentTarget);
    try {
      const priced = await refreshPrice();
      if (priced.hasUnavailableItems) {
        setError(t("checkout.unavailable"));
        setSending(false);
        return;
      }
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: payloadLines,
          fullName: String(form.get("fullName") ?? ""),
          email: String(form.get("email") ?? ""),
          phone: String(form.get("phone") ?? ""),
          city: String(form.get("city") ?? ""),
          district: String(form.get("district") ?? ""),
          line: String(form.get("line") ?? ""),
          note: String(form.get("note") ?? ""),
          acceptPreliminary: form.get("preliminary") === "on",
          acceptDistance: form.get("distance") === "on",
          acceptPrivacy: form.get("privacy") === "on",
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        iframeSrc?: string;
        orderNumber?: string;
      };
      if (!response.ok || !payload.iframeSrc) {
        setError(payload.error ?? t("checkout.startFailed"));
        setSending(false);
        return;
      }
      setIframeSrc(payload.iframeSrc);
      setOrderNumber(payload.orderNumber ?? null);
    } catch {
      setError(t("checkout.connection"));
    } finally {
      setSending(false);
    }
  }

  if (lines.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("commerce.emptyCart")}{" "}
        <Link href={"/sepet" as Route} className="underline">
          {t("commerce.backToCart")}
        </Link>
      </p>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
      <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
        <label className="block text-sm font-semibold">
          {t("checkout.fullName")}
          <input
            required
            name="fullName"
            defaultValue={displayName}
            className="mt-2 h-11 w-full rounded-xl border border-white/15 bg-midnight px-3"
          />
        </label>
        <label className="block text-sm font-semibold">
          {t("checkout.email")}
          <input
            required
            type="email"
            name="email"
            defaultValue={email}
            className="mt-2 h-11 w-full rounded-xl border border-white/15 bg-midnight px-3"
          />
        </label>
        <label className="block text-sm font-semibold">
          {t("checkout.phone")}
          <input
            required
            name="phone"
            className="mt-2 h-11 w-full rounded-xl border border-white/15 bg-midnight px-3"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            {t("checkout.city")}
            <input
              required
              name="city"
              className="mt-2 h-11 w-full rounded-xl border border-white/15 bg-midnight px-3"
            />
          </label>
          <label className="block text-sm font-semibold">
            {t("checkout.district")}
            <input
              required
              name="district"
              className="mt-2 h-11 w-full rounded-xl border border-white/15 bg-midnight px-3"
            />
          </label>
        </div>
        <label className="block text-sm font-semibold">
          {t("checkout.address")}
          <textarea
            required
            name="line"
            rows={3}
            className="mt-2 w-full rounded-xl border border-white/15 bg-midnight px-3 py-2"
          />
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input required type="checkbox" name="preliminary" className="mt-1" />
          <span>
            <Link href={"/yasal/mesafeli-satis" as Route} className="underline">
              {t("checkout.acceptPreliminary")}
            </Link>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input required type="checkbox" name="distance" className="mt-1" />
          <span>
            <Link href={"/yasal/mesafeli-satis" as Route} className="underline">
              {t("checkout.acceptDistance")}
            </Link>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input required type="checkbox" name="privacy" className="mt-1" />
          <span>
            <Link href={"/yasal/kvkk" as Route} className="underline">
              {t("checkout.privacyLink")}
            </Link>{" "}
            {t("checkout.privacyAnd")}{" "}
            <Link href={"/yasal/gizlilik" as Route} className="underline">
              {t("checkout.privacyLink2")}
            </Link>
            {". "}
            {t("checkout.acceptPrivacy")}
          </span>
        </label>
        {error ? <p className="text-sm text-error">{error}</p> : null}
        <button
          type="submit"
          disabled={sending || Boolean(iframeSrc)}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-coral px-4 text-sm font-semibold text-ink disabled:opacity-50"
        >
          {sending ? t("checkout.preparing") : t("checkout.pay")}
        </button>
      </form>
      <aside className="space-y-3 rounded-2xl border border-white/10 p-4 text-sm">
        <p className="font-semibold">{t("checkout.summary")}</p>
        {totals ? (
          <dl className="space-y-1 text-muted-foreground">
            <div className="flex justify-between">
              <dt>{t("commerce.subtotal")}</dt>
              <dd>{formatMoney(totals.subtotalMinor ?? 0)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t("commerce.shipping")}</dt>
              <dd>{formatMoney(totals.estimatedShippingMinor ?? 0)}</dd>
            </div>
            <div className="flex justify-between font-semibold text-foreground">
              <dt>{t("commerce.total")}</dt>
              <dd>{formatMoney(totals.totalMinor ?? 0)}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-muted-foreground">{t("checkout.totalComputed")}</p>
        )}
        {orderNumber ? (
          <p>
            {t("checkout.orderNo")}: {orderNumber}. {t("common.track")}:{" "}
            <Link href={"/siparis-takip" as Route} className="underline">
              {t("checkout.track")}
            </Link>
          </p>
        ) : null}
        {iframeSrc ? (
          <iframe
            title={t("checkout.paytrTitle")}
            src={iframeSrc}
            className="h-[28rem] w-full rounded-xl border-0 bg-white"
          />
        ) : null}
      </aside>
    </div>
  );
}
