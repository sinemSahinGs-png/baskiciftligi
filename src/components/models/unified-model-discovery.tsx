"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ModelCard } from "@/components/models/model-card";
import type { ModelCardData } from "@/components/models/model-card";
import { StaggerGrid, StaggerItem } from "@/components/motion/stagger-grid";
import { cn } from "@/lib/utils";

interface DiscoverItem {
  source: string;
  externalId: string;
  title: string;
  creatorName: string;
  thumbnailUrl?: string;
  licenseLabel?: string;
  permissionStatus: string;
  isPurchasable: boolean;
  automaticManufacturingAllowed?: boolean;
}

interface DiscoverResponse {
  query: string;
  expansion?: { normalized?: string; category?: string | null; blocked?: boolean };
  items: DiscoverItem[];
  providers: Array<{
    source: string;
    displayName: string;
    configured: boolean;
    statusMessage?: string;
    error?: string;
  }>;
  hasMore: boolean;
}

function toCard(item: DiscoverItem): ModelCardData {
  const reviewState: ModelCardData["permission"] =
    item.permissionStatus === "permission_verified"
      ? "verified"
      : item.permissionStatus === "license_review"
        ? "license-review"
        : item.isPurchasable
          ? "verified"
          : "unverified";

  return {
    id: `${item.source}-${item.externalId}`,
    href: `/hazir-modeller/${item.source}/${item.externalId}` as Route,
    name: item.title,
    creator: item.creatorName,
    category: item.automaticManufacturingAllowed ? "Dosya hazır" : "Baskıya uygunluk inceleniyor",
    source: item.source === "thingiverse" ? "thingiverse" : "licensed",
    license: item.licenseLabel ?? "Lisans bilgisi bekleniyor",
    permission: reviewState,
    thumbnailUrl: item.thumbnailUrl,
  };
}

export function UnifiedModelDiscovery({ query }: { query: string }) {
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [providers, setProviders] = useState<DiscoverResponse["providers"]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const cards = useMemo(() => items.map(toCard), [items]);

  const load = useCallback(async (term: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (!term.trim()) {
      setItems([]);
      setProviders([]);
      setBlocked(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/models/discover?q=${encodeURIComponent(term.trim())}`,
        { signal: controller.signal },
      );
      if (!response.ok) {
        throw new Error("Arama tamamlanamadı.");
      }
      const payload = (await response.json()) as DiscoverResponse;
      setItems(payload.items ?? []);
      setProviders(payload.providers ?? []);
      setBlocked(Boolean(payload.expansion?.blocked));
    } catch (fetchError) {
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
        return;
      }
      setError(fetchError instanceof Error ? fetchError.message : "Arama hatası");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void load(query);
    }, 280);
    return () => window.clearTimeout(handle);
  }, [load, query]);

  if (!query.trim()) {
    return (
      <EmptyState
        compact
        icon={<Search aria-hidden="true" className="size-5" />}
        title="Türkçe model araması"
        description="Vazo, telefon tutucu veya masaüstü düzenleyici gibi bir terim yazın. Sonuçlar Baskı Çiftliği içinde açılır; harici siteye yönlendirilmezsiniz."
      />
    );
  }

  if (blocked) {
    return (
      <EmptyState
        compact
        icon={<Search aria-hidden="true" className="size-5" />}
        title="Bu arama desteklenmiyor"
        description="Güvenlik ve kullanım politikası gereği bu arama için sonuç gösterilmiyor."
      />
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="mt-10 flex items-center gap-3 text-sm text-muted-light">
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        Modeller aranıyor…
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        compact
        icon={<Search aria-hidden="true" className="size-5" />}
        title="Arama şu an tamamlanamadı"
        description={error}
      />
    );
  }

  const configuredProviders = providers.filter((provider) => provider.configured);
  const unconfigured = providers.filter((provider) => !provider.configured);

  if (items.length === 0) {
    return (
      <div className="mt-10 space-y-4">
        <EmptyState
          compact
          icon={<Search aria-hidden="true" className="size-5" />}
          title="Eşleşen model bulunamadı"
          description={
            configuredProviders.length === 0
              ? "Yapılandırılmış bir model sağlayıcısı yok. Thingiverse erişimi onaylandığında sonuçlar burada görünür."
              : "Farklı bir Türkçe terim deneyin veya yazımı kontrol edin."
          }
        />
        {unconfigured.length > 0 ? (
          <ul className="space-y-2 text-sm text-muted-light">
            {unconfigured.map((provider) => (
              <li key={provider.source}>
                {provider.displayName}: {provider.statusMessage ?? "Yapılandırılmadı"}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {configuredProviders.length === 0 ? (
        <p className="text-sm text-muted-light">
          Canlı sağlayıcı yapılandırılmadı; test modunda sonuç gösterilmiyor.
        </p>
      ) : null}
      <StaggerGrid
        as="ul"
        data-model-results=""
        className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 xl:grid-cols-4"
      >
        {cards.map((model) => (
          <StaggerItem as="li" key={model.id}>
            <ModelCard model={model} />
          </StaggerItem>
        ))}
      </StaggerGrid>
      <p className="text-sm text-muted-light">
        Harici modeller Baskı Çiftliği tarafından tasarlanmış değildir. Detay sayfasında
        model bilgileri ve lisans yer alır.
      </p>
      {unconfigured.length > 0 ? (
        <details className="rounded-md border border-white/10 p-4 text-sm text-muted-light">
          <summary className="cursor-pointer font-medium text-light-text">
            Diğer sağlayıcı durumları
          </summary>
          <ul className="mt-3 space-y-2">
            {unconfigured.map((provider) => (
              <li key={provider.source}>
                {provider.displayName}: {provider.statusMessage}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      <Link href="/model-yukle" className={cn("text-sm underline underline-offset-4")}>
        Kendi dosyanı yükle
      </Link>
    </div>
  );
}
