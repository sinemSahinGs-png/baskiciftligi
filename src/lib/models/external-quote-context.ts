import {
  platformLabel,
  validateCuratedSourceUrl,
  type CuratedPlatform,
} from "@/domain/curated-models/types";

export type ExternalQuoteSourceType =
  | "curated_external"
  | "thingiverse"
  | "printables"
  | "myminifactory"
  | "other";

export interface ExternalProductionOptions {
  material: string;
  color: string;
  sizePreset: string;
  quantity: number;
}

export interface ExternalQuoteModelContext {
  externalModelId: string;
  sourceType: ExternalQuoteSourceType;
  sourceUrl: string;
  title: string;
  categoryLabel: string | null;
  previewImageUrl: string | null;
  imageAlt: string | null;
  attribution: string | null;
  licenseName: string | null;
  licenseVerified: boolean;
  platformLabel: string;
  slug?: string | null;
  productionOptions?: ExternalProductionOptions | null;
}

const SESSION_KEY = "bc-external-quote-modal-v1";

export function sourceTypeFromPlatform(
  platform: CuratedPlatform | string,
): ExternalQuoteSourceType {
  if (
    platform === "thingiverse" ||
    platform === "printables" ||
    platform === "myminifactory"
  ) {
    return platform;
  }
  if (platform === "studio") {
    return "other";
  }
  return "other";
}

export function labelForSourceType(sourceType: ExternalQuoteSourceType) {
  switch (sourceType) {
    case "thingiverse":
      return platformLabel("thingiverse");
    case "printables":
      return platformLabel("printables");
    case "myminifactory":
      return platformLabel("myminifactory");
    case "curated_external":
      return "Küratörlü kaynak";
    default:
      return "Harici kaynak";
  }
}

export function persistExternalQuoteContext(context: ExternalQuoteModelContext) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(context));
  } catch {
    // ignore quota / private mode
  }
}

export function readExternalQuoteContext(): ExternalQuoteModelContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExternalQuoteModelContext;
    if (
      !parsed?.externalModelId ||
      !parsed?.sourceUrl ||
      !parsed?.title ||
      !parsed?.sourceType
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearExternalQuoteContext() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

/**
 * Defense-in-depth allowlist before navigating to a source page.
 * Canonical URL must still come from server-stored model data.
 */
export function isSafeExternalSourceOpenUrl(
  rawUrl: string,
  platformHint?: CuratedPlatform | "other",
): boolean {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host === "127.0.0.1" ||
    host === "::1" ||
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)
  ) {
    return false;
  }
  if (platformHint === "other" || platformHint === "studio") {
    return true;
  }
  const allowed = [
    "www.printables.com",
    "printables.com",
    "www.thingiverse.com",
    "thingiverse.com",
    "www.myminifactory.com",
    "myminifactory.com",
  ];
  return allowed.includes(host);
}

export function assertSafeExternalSourceOpenUrl(
  rawUrl: string,
  platformHint?: CuratedPlatform,
): { ok: true; canonicalUrl: string } | { ok: false; error: string } {
  const platform =
    platformHint ??
    (rawUrl.includes("printables.com")
      ? "printables"
      : rawUrl.includes("thingiverse.com")
        ? "thingiverse"
        : rawUrl.includes("myminifactory.com")
          ? "myminifactory"
          : "other");
  const curated = validateCuratedSourceUrl(rawUrl, platform);
  if (!curated.ok) {
    return curated;
  }
  if (!isSafeExternalSourceOpenUrl(curated.canonicalUrl, platform)) {
    return { ok: false, error: "Kaynak host izin listesinde değil." };
  }
  return curated;
}

type PendingHandoff = {
  file: File;
  context: ExternalQuoteModelContext;
  rightsConfirmed: true;
};

const HANDOFF_KEY = "__bcPendingExternalUpload";

function handoffStore(): {
  current: PendingHandoff | null;
} {
  const root = globalThis as typeof globalThis & {
    [HANDOFF_KEY]?: { current: PendingHandoff | null };
  };
  if (!root[HANDOFF_KEY]) {
    root[HANDOFF_KEY] = { current: null };
  }
  return root[HANDOFF_KEY];
}

export function setPendingExternalUpload(handoff: PendingHandoff) {
  handoffStore().current = handoff;
  const root = globalThis as typeof globalThis & {
    __bcHandoffConsumed?: boolean;
  };
  root.__bcHandoffConsumed = false;
}

export function takePendingExternalUpload(): PendingHandoff | null {
  const store = handoffStore();
  const next = store.current;
  store.current = null;
  return next;
}

export function peekPendingExternalUpload(): PendingHandoff | null {
  return handoffStore().current;
}
