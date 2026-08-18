"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";

export function QuoteJobStatus({ quoteId }: { quoteId: string }) {
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const jobResponse = await fetch(`/api/manufacturing/jobs/${quoteId}`, {
        cache: "no-store",
      });
      if (jobResponse.ok) {
        const job = (await jobResponse.json()) as Record<string, unknown>;
        if (!cancelled) {
          setPayload({ kind: "job", ...job });
        }
        return;
      }
      const quoteResponse = await fetch(`/api/manufacturing/quotes/${quoteId}`, {
        cache: "no-store",
      });
      if (quoteResponse.ok) {
        const quote = (await quoteResponse.json()) as Record<string, unknown>;
        if (!cancelled) {
          setPayload({ kind: "quote", ...quote });
        }
        return;
      }
      if (!cancelled) {
        setMissing(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [quoteId]);

  if (missing) {
    return (
      <p className="text-sm">
        Bu referans sizin oturumunuzda bulunamadı. Sahte teklif üretilmez.
      </p>
    );
  }
  if (!payload) {
    return <p className="text-sm">Teklif durumu okunuyor.</p>;
  }

  return (
    <div className="space-y-3 text-sm">
      <p>Durum: {String(payload.state ?? payload.status)}</p>
      {"stateLabel" in payload ? <p>{String(payload.stateLabel)}</p> : null}
      <Link href={"/model-yukle" as Route} className="underline">
        Yapılandırıcıya dön
      </Link>
    </div>
  );
}
