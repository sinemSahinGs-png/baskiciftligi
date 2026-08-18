import "server-only";

import { cache } from "react";

import { defaultSiteContent, type SiteContent } from "@/domain/site/content";
import { isDevelopmentDemoMode } from "@/lib/env";
import {
  loadDemoSiteContent,
  saveDemoSiteContent,
} from "@/lib/demo/site-content-store";

export const getSiteContent = cache(async (): Promise<SiteContent> => {
  if (isDevelopmentDemoMode) {
    return loadDemoSiteContent();
  }
  return defaultSiteContent();
});

export async function saveSiteContent(content: SiteContent): Promise<void> {
  if (!isDevelopmentDemoMode) {
    throw new Error(
      "Vitrin metinleri henüz kalıcı veritabanına bağlı değil. Yerel geliştirmede kaydedilir.",
    );
  }
  await saveDemoSiteContent(content);
}
