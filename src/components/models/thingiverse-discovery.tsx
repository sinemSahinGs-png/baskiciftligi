"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { FormSignal } from "@/components/brand/form-signal";
import { EmptyState } from "@/components/feedback/empty-state";
import { ModelCard } from "@/components/models/model-card";
import type { ModelCardData } from "@/components/models/model-card";
import type { PermissionState } from "@/components/models/permission-status";
import { siteConfig } from "@/config/site";
import type { ExternalModelSummary } from "@/providers/contracts";
import {
  thingiverseStatusCopy,
  type ThingiverseIntegrationStatus,
} from "@/providers/thingiverse/status";

function toPermission(status: ExternalModelSummary["permissionStatus"]): PermissionState {
  if (status === "permission_verified") {
    return "verified";
  }
  if (status === "permission_requested") {
    return "permission-requested";
  }
  if (status === "license_review") {
    return "license-review";
  }
  if (status === "rejected" || status === "revoked") {
    return "not-permitted";
  }
  if (status === "unavailable") {
    return "unavailable";
  }
  return "discovery";
}

function toCard(item: ExternalModelSummary): ModelCardData {
  return {
    id: item.externalId,
    href: `/hazir-modeller/thingiverse/${item.externalId}` as Route,
    name: item.title,
    creator: item.creatorName,
    category: "Thingiverse",
    source: "thingiverse",
    license: item.licenseLabel ?? "Lisans belirtilmedi",
    permission: toPermission(item.permissionStatus),
    thumbnailUrl: item.thumbnailUrl,
    sourceUrl: item.sourceUrl,
    popularityLabel:
      typeof item.likeCount === "number"
        ? `${item.likeCount} beğeni (API)`
        : undefined,
    verified: item.isPurchasable,
  };
}

export function ThingiverseDiscovery() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ThingiverseIntegrationStatus | "loading">(
    "loading",
  );
  const [items, setItems] = useState<ModelCardData[]>([]);
  const [hasMore, setHasMore] = useState(false);

  async function load(nextPage: number, nextQuery: string) {
    setStatus("loading");
    try {
      const params = new URLSearchParams({ page: String(nextPage) });
      if (nextQuery.trim()) {
        params.set("q", nextQuery.trim());
      }
      const response = await fetch(`/api/models/thingiverse?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        status: ThingiverseIntegrationStatus;
        items: ExternalModelSummary[];
        hasMore: boolean;
      };
      setStatus(payload.status);
      setItems((payload.items ?? []).map(toCard));
      setHasMore(Boolean(payload.hasMore));
    } catch {
      setStatus("api_unavailable");
      setItems([]);
      setHasMore(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: "1" });
    void fetch(`/api/models/thingiverse?${params.toString()}`, {
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((payload: {
        status: ThingiverseIntegrationStatus;
        items: ExternalModelSummary[];
        hasMore: boolean;
      }) => {
        if (cancelled) {
          return;
        }
        setStatus(payload.status);
        setItems((payload.items ?? []).map(toCard));
        setHasMore(Boolean(payload.hasMore));
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("api_unavailable");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const copy =
    status !== "loading"
      ? thingiverseStatusCopy[status]
      : { title: "Thingiverse sorgulanıyor", body: "Resmî API bekleniyor." };

  return (
    <section className="mt-10 space-y-6 rounded-xl border border-neutral/40 bg-neutral/8 p-5 sm:p-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.12em] text-muted-light uppercase">
          Ayrı kaynak · Thingiverse
        </p>
        <h2 className="mt-2 font-heading text-2xl font-bold">
          Thingiverse keşfi
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-light">
          Resmî API ile popüler Things listelenir. Web arayüzündeki
          <code className="mx-1">posted_after</code> ve
          <code className="mx-1">license=public</code> süzgeçleri belgelenmiş
          API parametresi değildir; bu yüzden kullanılmaz. {siteConfig.name}{" "}
          bu modelleri otomatik satmaz.
        </p>
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          void load(1, query);
        }}
      >
        <label className="sr-only" htmlFor="thingiverse-q">
          Thingiverse ara
        </label>
        <input
          id="thingiverse-q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Resmî arama terimi"
          className="h-12 flex-1 rounded-md border border-white/15 bg-white/8 px-3"
        />
        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-cobalt px-4 text-sm font-semibold text-light-text"
        >
          Ara
        </button>
      </form>

      {status === "loading" ? (
        <div className="flex min-h-40 items-center justify-center">
          <FormSignal spinning className="size-8" />
        </div>
      ) : status !== "connected" ? (
        <EmptyState
          icon={<FormSignal className="size-5" />}
          title={copy.title}
          description={copy.body}
          action={{
            href: "/hazir-modeller/thingiverse/durum" as Route,
            label: "Entegrasyon durumunu gör",
          }}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<FormSignal className="size-5" />}
          title="Bu sayfada Thingiverse sonucu yok"
          description="Başka bir sayfayı deneyin veya aramayı sadeleştirin."
        />
      ) : (
        <ul className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((model) => (
            <li key={model.id}>
              <ModelCard model={model} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-light">Sayfa {page}</p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || status === "loading"}
            onClick={() => {
              const next = Math.max(1, page - 1);
              setPage(next);
              void load(next, query);
            }}
            className="min-h-11 rounded-md border border-white/15 px-3 text-sm font-semibold disabled:opacity-40"
          >
            Önceki
          </button>
          <button
            type="button"
            disabled={!hasMore || status === "loading"}
            onClick={() => {
              const next = page + 1;
              setPage(next);
              void load(next, query);
            }}
            className="min-h-11 rounded-md border border-white/15 px-3 text-sm font-semibold disabled:opacity-40"
          >
            Sonraki
          </button>
          <button
            type="button"
            onClick={() => void load(page, query)}
            className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold"
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            Yeniden dene
          </button>
        </div>
      </div>
      <Link
        href={"/hazir-modeller/thingiverse/durum" as Route}
        className="inline-flex min-h-11 items-center text-sm font-semibold underline"
      >
        Entegrasyon durumunu gör
      </Link>
    </section>
  );
}
