"use client";

import { useEffect, useState } from "react";

interface ProviderSnapshot {
  source: string;
  displayName: string;
  status: string;
  integrationMethod: string;
  configured: boolean;
  partnershipRequired: boolean;
  documentationUrl: string;
  legalNotes: string;
  credentialNames: string[];
  statusMessage?: string;
  pricingNote?: string;
}

const statusLabel: Record<string, string> = {
  connected: "Bağlı",
  unconfigured: "Yapılandırılmadı",
  partnership_required: "Partnerlik gerekli",
  redirect_search: "Yönlendirmeli arama",
  rate_limited: "Hız sınırı",
  unavailable: "Erişilemiyor",
  degraded: "Kısıtlı",
};

export function ProviderIntegrationsPanel() {
  const [providers, setProviders] = useState<ProviderSnapshot[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/providers", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setProviders(payload.providers ?? []))
      .catch(() => setError("Sağlayıcı durumu alınamadı."));
  }, []);

  if (error) {
    return <p className="text-sm text-error">{error}</p>;
  }

  return (
    <section className="mt-8 space-y-4">
      <h2 className="font-heading text-2xl">Model sağlayıcıları</h2>
      <ul className="grid gap-4 lg:grid-cols-2">
        {providers.map((provider) => (
          <li key={provider.source} className="rounded-2xl border border-white/10 p-5 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{provider.displayName}</p>
              <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs">
                {statusLabel[provider.status] ?? provider.status}
              </span>
            </div>
            <p className="mt-2 text-muted-foreground">{provider.integrationMethod}</p>
            {provider.pricingNote ? (
              <p className="mt-2 text-xs font-semibold text-muted-foreground">
                {provider.pricingNote}
              </p>
            ) : null}
            {provider.statusMessage ? (
              <p className="mt-2 text-muted-foreground">{provider.statusMessage}</p>
            ) : null}
            <p className="mt-3 text-xs text-muted-foreground">{provider.legalNotes}</p>
            {provider.credentialNames.length > 0 ? (
              <p className="mt-3 font-mono text-xs text-muted-foreground">
                {provider.credentialNames.join(" · ")}
              </p>
            ) : null}
            <a
              href={provider.documentationUrl}
              rel="noreferrer"
              target="_blank"
              className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
            >
              Resmî dokümantasyon
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
