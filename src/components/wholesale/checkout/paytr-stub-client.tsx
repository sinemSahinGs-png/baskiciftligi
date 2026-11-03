"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function StubInner() {
  const params = useSearchParams();
  const oid = params.get("oid") ?? "";
  const [message, setMessage] = useState<string | null>(null);

  async function complete(outcome: "success" | "failed") {
    const response = await fetch("/api/wholesale/paytr-stub", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ merchantOid: oid, outcome }),
    });
    const data = (await response.json()) as {
      ok?: boolean;
      error?: string;
      paymentState?: string;
    };
      setMessage(
        data.error ??
          (data.paymentState === "paid"
            ? "Ödeme onaylandı"
            : data.paymentState === "payment_failed"
              ? "Ödeme alınamadı"
              : "İşlem tamamlandı"),
      );
  }

  return (
    <div className="p-6">
      <h1 className="font-heading text-2xl">Güvenli ödeme (test)</h1>
      <p className="mt-2 text-sm">Bu ekran yalnızca geliştirme içindir.</p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          className="min-h-11 rounded-full bg-emerald-700 px-5 text-sm font-semibold text-white"
          onClick={() => void complete("success")}
        >
          Test ödemesini onayla
        </button>
        <button
          type="button"
          className="min-h-11 rounded-full bg-red-700 px-5 text-sm font-semibold text-white"
          onClick={() => void complete("failed")}
        >
          Test ödemesini reddet
        </button>
      </div>
      {message ? <p className="mt-3 text-sm">{message}</p> : null}
    </div>
  );
}

export function PaytrStubClient() {
  return (
    <Suspense>
      <StubInner />
    </Suspense>
  );
}
