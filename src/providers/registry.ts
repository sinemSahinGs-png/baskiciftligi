import "server-only";

import type {
  BrowsableExternalModelProvider,
  ExternalModelProvider,
} from "@/providers/contracts";
import { thingiverseProvider } from "@/providers/thingiverse/provider";
import { getThingiverseConfigStatus } from "@/providers/thingiverse/provider";
import { printablesUnconfiguredProvider } from "@/providers/printables/unconfigured";
import { myMiniFactoryUnconfiguredProvider } from "@/providers/myminifactory/unconfigured";

export type ProviderConnectionStatus =
  | "connected"
  | "unconfigured"
  | "partnership_required"
  | "redirect_search"
  | "rate_limited"
  | "unavailable"
  | "degraded";

export interface ProviderStatusSnapshot {
  source: string;
  displayName: string;
  status: ProviderConnectionStatus;
  integrationMethod: string;
  configured: boolean;
  partnershipRequired: boolean;
  documentationUrl: string;
  legalNotes: string;
  credentialNames: string[];
  statusMessage?: string;
  pricingNote?: string;
  capabilities: ExternalModelProviderCapabilities;
}

export interface ExternalModelProviderCapabilities {
  discovery: boolean;
  images: boolean;
  licenseMetadata: boolean;
  fileListing: boolean;
  authorizedDownload: boolean;
  automaticManufacturing: boolean;
  configured: boolean;
  partnershipRequired: boolean;
}

export interface RegisteredExternalModelProvider {
  provider: ExternalModelProvider | BrowsableExternalModelProvider;
  capabilities: ExternalModelProviderCapabilities;
  displayName: string;
  statusMessage?: string;
}

export function listExternalModelProviders(): RegisteredExternalModelProvider[] {
  const thingiverseStatus = getThingiverseConfigStatus();
  const thingiverseConfigured = thingiverseStatus === "connected";

  return [
    {
      provider: thingiverseProvider,
      displayName: "Thingiverse",
      capabilities: {
        discovery: true,
        images: true,
        licenseMetadata: true,
        fileListing: true,
        authorizedDownload: thingiverseConfigured,
        automaticManufacturing: thingiverseConfigured,
        configured: thingiverseConfigured,
        partnershipRequired: false,
      },
      statusMessage:
        thingiverseConfigured
          ? undefined
          : "Resmi Thingiverse API erişimi yapılandırılmadı.",
    },
    {
      provider: printablesUnconfiguredProvider,
      displayName: "Printables",
      capabilities: {
        discovery: false,
        images: false,
        licenseMetadata: false,
        fileListing: false,
        authorizedDownload: false,
        automaticManufacturing: false,
        configured: false,
        partnershipRequired: false,
      },
      statusMessage:
        "Yönlendirmeli arama. Sonuçlar Printables üzerinde açılır; API bağlantısı yok.",
    },
    {
      provider: myMiniFactoryUnconfiguredProvider,
      displayName: "MyMiniFactory",
      capabilities: {
        discovery: false,
        images: false,
        licenseMetadata: false,
        fileListing: false,
        authorizedDownload: false,
        automaticManufacturing: false,
        configured: false,
        partnershipRequired: true,
      },
      statusMessage:
        "MyMiniFactory OAuth uygulaması ve manufacturers@myminifactory.com onayı gerekir.",
    },
  ];
}

export function listProviderStatusSnapshots(): ProviderStatusSnapshot[] {
  return listExternalModelProviders().map((entry) => {
    const isPrintables = entry.provider.source === "printables";
    return {
      source: entry.provider.source,
      displayName: entry.displayName,
      status: entry.capabilities.configured
        ? "connected"
        : isPrintables
          ? "redirect_search"
          : entry.capabilities.partnershipRequired
            ? "partnership_required"
            : "unconfigured",
      integrationMethod: isPrintables
        ? "Yönlendirmeli arama (ücretsiz, API yok)"
        : entry.provider.source === "thingiverse"
          ? "Resmî REST API + OAuth/access token"
          : entry.provider.source === "myminifactory"
            ? "OAuth 2.0 — uygulama kaydı gerekli"
            : "Depo / kürasyon",
      configured: entry.capabilities.configured,
      partnershipRequired: entry.capabilities.partnershipRequired,
      documentationUrl: isPrintables
        ? "https://www.printables.com/search/models"
        : entry.provider.source === "thingiverse"
          ? "https://www.thingiverse.com/developers"
          : entry.provider.source === "myminifactory"
            ? "https://www.myminifactory.com/pages/for-developers"
            : "https://baskiciftligi.com/hazir-modeller",
      legalNotes: isPrintables
        ? "Scrape / özel GraphQL yok. Sonuçlar Printables üzerinde açılır."
        : entry.provider.source === "thingiverse"
          ? "CC lisansları ayrı değerlendirilir; atıf ve ticari izin zorunludur."
          : entry.provider.source === "myminifactory"
            ? "Ticari üretim izni API metadata ile doğrulanmalıdır."
            : "Sahiplik/lisans kanıtı olmadan yayınlanmaz.",
      credentialNames:
        entry.provider.source === "thingiverse"
          ? [
              "THINGIVERSE_ACCESS_TOKEN",
              "THINGIVERSE_CLIENT_ID",
              "THINGIVERSE_CLIENT_SECRET",
            ]
          : entry.provider.source === "myminifactory"
            ? ["MYMINIFACTORY_CLIENT_ID", "MYMINIFACTORY_CLIENT_SECRET"]
            : [],
      statusMessage: entry.statusMessage,
      pricingNote: isPrintables ? "Ücretsiz" : undefined,
      capabilities: entry.capabilities,
    };
  });
}

export function getExternalModelProvider(source: string) {
  return listExternalModelProviders().find((entry) => entry.provider.source === source);
}
