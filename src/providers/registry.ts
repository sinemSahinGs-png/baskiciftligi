import "server-only";

import type {
  BrowsableExternalModelProvider,
  ExternalModelProvider,
} from "@/providers/contracts";
import { thingiverseProvider } from "@/providers/thingiverse/provider";
import { getThingiverseConfigStatus } from "@/providers/thingiverse/provider";
import { printablesUnconfiguredProvider } from "@/providers/printables/unconfigured";

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
        partnershipRequired: true,
      },
      statusMessage:
        "Printables için belgelenmiş halka açık arama/indirme API’si yok; entegrasyon beklemede.",
    },
  ];
}

export function getExternalModelProvider(source: string) {
  return listExternalModelProviders().find((entry) => entry.provider.source === source);
}
