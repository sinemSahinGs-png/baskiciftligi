"use client";

import { useState } from "react";

import type { ThingiverseIntegrationStatus } from "@/providers/thingiverse/status";
import { thingiverseStatusCopy } from "@/providers/thingiverse/status";
import { cn } from "@/lib/utils";

const SETUP_STEPS = [
  {
    title: "1. Thingiverse hesabı ve Apps sayfası",
    body: "Thingiverse’e giriş yapın. Geliştirici uygulama oluşturma sayfası:",
    link: {
      href: "https://www.thingiverse.com/apps/create",
      label: "www.thingiverse.com/apps/create",
    },
  },
  {
    title: "2. Uygulama türü",
    body: "“Select A Platform” altında Web App seçin. (Masaüstü/mobile alternatifleri bu mağaza akışı için gerekli değil.)",
  },
  {
    title: "3. Uygulama adı",
    body: "Uygulama adı: Baskı Çiftliği. Kısa bir açıklama yazıp MakerBot/Thingiverse API koşullarını kabul edin.",
  },
  {
    title: "4. Production callback URL",
    body: "Yalnızca okuma (popular / search) için App Token yeterlidir. Thingiverse formunda Callback URL boş bırakılabilir.",
    note: "İleride kullanıcı OAuth’u eklenecekse redirect URI olarak https://baskiciftligi.com/api/auth/thingiverse/callback planlanır ve Vercel’de THINGIVERSE_REDIRECT_URI ile eşlenir. Şu an OAuth callback route yok; production bağlantısı App Token ile kurulur.",
  },
  {
    title: "5. Gerekli credential",
    body: "Uygulama kaydından Client ID, Client Secret ve App Token (Access Token) değerlerini kopyalayın. Tarayıcıya veya sohbete yapıştırmayın.",
  },
  {
    title: "6. Vercel environment variables",
    body: "Vercel → baskiciftligi projesi → Settings → Environment Variables → Production’a ekleyin:",
    env: [
      "THINGIVERSE_CLIENT_ID",
      "THINGIVERSE_CLIENT_SECRET",
      "THINGIVERSE_ACCESS_TOKEN",
      "THINGIVERSE_REDIRECT_URI (opsiyonel; OAuth için)",
      "THINGIVERSE_API_BASE_URL=https://api.thingiverse.com",
      "THINGIVERSE_FIXTURE_MODE=false",
    ],
    note: "Güvenli secret vault yok; token’ı veritabanına yazmayın. Yalnızca Vercel env kullanın. Değişiklikten sonra Redeploy gerekir.",
  },
] as const;

type ProbeResult = {
  ok: boolean;
  configStatus: ThingiverseIntegrationStatus | string;
  message: string;
  envPresence: Record<string, boolean | string>;
  probe: {
    endpoint: string;
    httpOk: boolean;
    latencyMs: number;
    resultCount: number;
    sample: Array<{
      id: number | null;
      name: string | null;
      hasThumbnail: boolean;
      license: string | null;
    }>;
    errorStatus?: number | null;
    errorMessage?: string;
  } | null;
};

export function ThingiverseStatusPanel({
  initialStatus,
  envFlags,
}: {
  initialStatus: ThingiverseIntegrationStatus;
  envFlags: {
    clientId: boolean;
    clientSecret: boolean;
    accessToken: boolean;
    redirectUri: boolean;
  };
}) {
  const [status, setStatus] = useState(initialStatus);
  const [testing, setTesting] = useState(false);
  const [probe, setProbe] = useState<ProbeResult | null>(null);
  const copy = thingiverseStatusCopy[status] ?? thingiverseStatusCopy.not_configured;

  async function runProbe() {
    setTesting(true);
    try {
      const response = await fetch("/api/admin/thingiverse/test", {
        method: "POST",
      });
      const payload = (await response.json()) as ProbeResult & { error?: string };
      if (!response.ok) {
        setProbe({
          ok: false,
          configStatus: status,
          message: payload.error ?? "Test başarısız.",
          envPresence: {},
          probe: null,
        });
        return;
      }
      setProbe(payload);
      if (payload.configStatus) {
        setStatus(payload.configStatus as ThingiverseIntegrationStatus);
      }
    } catch {
      setProbe({
        ok: false,
        configStatus: "api_unavailable",
        message: "Test isteği gönderilemedi.",
        envPresence: {},
        probe: null,
      });
    } finally {
      setTesting(false);
    }
  }

  const flagRows = [
    ["THINGIVERSE_CLIENT_ID", envFlags.clientId],
    ["THINGIVERSE_CLIENT_SECRET", envFlags.clientSecret],
    ["THINGIVERSE_ACCESS_TOKEN", envFlags.accessToken],
    ["THINGIVERSE_REDIRECT_URI", envFlags.redirectUri],
  ] as const;

  return (
    <section className="mt-8 space-y-6 rounded-3xl border border-white/10 bg-card p-6">
      <div>
        <p className="text-[0.65rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
          Thingiverse · resmi API
        </p>
        <h2 className="mt-3 font-heading text-2xl font-medium">{copy.title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {copy.body} Durum: <code className="text-foreground">{status}</code>. Token
          değerleri tarayıcıya veya istemci bundle’a yazılmaz. Production’da fixture
          kullanılmaz.
        </p>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {flagRows.map(([name, present]) => (
          <li
            key={name}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm",
              present ? "border-emerald-400/30" : "border-white/10",
            )}
          >
            {name}: {present ? "tanımlı" : "yok"}
          </li>
        ))}
      </ul>

      {!envFlags.accessToken ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm leading-6">
          <p className="font-semibold text-amber-100">
            Awaiting owner credential
          </p>
          <p className="mt-2 text-muted-foreground">
            Canlı Thingiverse sonuçları için Vercel Production’a{" "}
            <code>THINGIVERSE_ACCESS_TOKEN</code> (App Token) eklenmeli. Token yokken
            müşteri sayfasında sahte kart gösterilmez.
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        <h3 className="font-heading text-lg font-semibold">Kurulum rehberi</h3>
        <ol className="space-y-4">
          {SETUP_STEPS.map((step) => (
            <li
              key={step.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm"
            >
              <p className="font-semibold">{step.title}</p>
              <p className="mt-2 text-muted-foreground">{step.body}</p>
              {"link" in step && step.link ? (
                <a
                  href={step.link.href}
                  className="mt-2 inline-block text-cyan underline underline-offset-4"
                  rel="noreferrer"
                >
                  {step.link.label}
                </a>
              ) : null}
              {"env" in step && step.env ? (
                <ul className="mt-2 list-inside list-disc text-muted-foreground">
                  {step.env.map((item) => (
                    <li key={item}>
                      <code>{item}</code>
                    </li>
                  ))}
                </ul>
              ) : null}
              {"note" in step && typeof step.note === "string" ? (
                <p className="mt-2 text-xs text-muted-foreground">{step.note}</p>
              ) : null}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void runProbe()}
          disabled={testing}
          className="inline-flex min-h-11 items-center rounded-xl bg-cyan px-4 text-sm font-semibold text-ink disabled:opacity-50"
        >
          {testing ? "Test ediliyor…" : "Bağlantıyı test et"}
        </button>
        <p className="text-xs text-muted-foreground">
          Canlı <code>GET /popular?page=1</code> çağrısı; yanıt sanitize edilir.
        </p>
      </div>

      {probe ? (
        <div
          className={cn(
            "rounded-2xl border p-4 text-sm",
            probe.ok ? "border-emerald-400/30" : "border-coral/40",
          )}
        >
          <p className="font-semibold">{probe.message}</p>
          {probe.probe ? (
            <dl className="mt-3 grid gap-2 text-muted-foreground sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide">Uç nokta</dt>
                <dd>{probe.probe.endpoint}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide">Gecikme</dt>
                <dd>{probe.probe.latencyMs} ms</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide">Kayıt</dt>
                <dd>{probe.probe.resultCount}</dd>
              </div>
              {probe.probe.errorMessage ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide">Hata</dt>
                  <dd>
                    {probe.probe.errorStatus ? `${probe.probe.errorStatus}: ` : ""}
                    {probe.probe.errorMessage}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}
          {probe.probe?.sample?.length ? (
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              {probe.probe.sample.map((item) => (
                <li key={String(item.id)}>
                  #{item.id} · {item.name ?? "—"} · lisans: {item.license ?? "—"} ·
                  thumbnail: {item.hasThumbnail ? "var" : "yok"}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Referans:{" "}
        <a
          href="https://www.thingiverse.com/developers/rest-api-reference"
          className="underline underline-offset-4"
          rel="noreferrer"
        >
          REST API Reference
        </a>{" "}
        ·{" "}
        <a
          href="https://www.thingiverse.com/legal/api"
          className="underline underline-offset-4"
          rel="noreferrer"
        >
          API Terms
        </a>
      </p>
    </section>
  );
}
