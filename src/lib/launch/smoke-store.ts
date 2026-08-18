export interface LaunchSmokeResult {
  at: string;
  ok: boolean;
  checks: Array<{ name: string; ok: boolean; detail: string }>;
}

let lastResult: LaunchSmokeResult | null = null;
const lastRunByActor = new Map<string, number>();
const SMOKE_COOLDOWN_MS = 30_000;

export function getLastSmokeResult() {
  return lastResult;
}

export function rememberSmokeResult(result: LaunchSmokeResult) {
  lastResult = result;
}

export function assertSmokeRateLimit(actorId: string) {
  const previous = lastRunByActor.get(actorId) ?? 0;
  const now = Date.now();
  if (now - previous < SMOKE_COOLDOWN_MS) {
    throw new Error("Duman testi kısa süre önce çalıştı. Lütfen bekleyin.");
  }
  lastRunByActor.set(actorId, now);
}

export function evaluateSmokeChecks(input: {
  homepageStatus: number | null;
  storeStatus: number | null;
  healthOk: boolean;
  catalogSource: string;
  thingiverseConfigured: boolean;
  workerReachable: boolean | null;
  storageConfigured: boolean;
  paymentConfigured: boolean;
  canonical: string;
}): LaunchSmokeResult {
  const checks = [
    {
      name: "Ana sayfa",
      ok: input.homepageStatus === 200,
      detail: input.homepageStatus ? String(input.homepageStatus) : "istek yok",
    },
    {
      name: "Mağaza",
      ok: input.storeStatus === 200,
      detail: input.storeStatus ? String(input.storeStatus) : "istek yok",
    },
    {
      name: "Sağlık",
      ok: input.healthOk,
      detail: input.healthOk ? "ok" : "sağlık olumsuz",
    },
    {
      name: "Katalog kaynağı",
      ok: true,
      detail: input.catalogSource,
    },
    {
      name: "Thingiverse",
      ok: true,
      detail: input.thingiverseConfigured ? "yapılandırıldı" : "yapılandırılmadı",
    },
    {
      name: "İşçi",
      ok: input.workerReachable !== false,
      detail:
        input.workerReachable === true
          ? "erişilebilir"
          : input.workerReachable === false
            ? "erişilemedi"
            : "yapılandırılmadı",
    },
    {
      name: "Depolama",
      ok: true,
      detail: input.storageConfigured ? "yapılandırıldı" : "yapılandırılmadı",
    },
    {
      name: "Ödeme",
      ok: true,
      detail: input.paymentConfigured ? "yapılandırıldı" : "kapalı",
    },
    {
      name: "Canonical",
      ok: input.canonical === "https://baskiciftligi.com",
      detail: input.canonical,
    },
  ];

  return {
    at: new Date().toISOString(),
    ok: checks.every((check) => check.ok),
    checks,
  };
}
