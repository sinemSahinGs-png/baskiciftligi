import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  defaultSiteContent,
  mergeSiteContent,
  type SiteContent,
} from "@/domain/site/content";
import { allowDemoAdminMutations } from "@/lib/env.server";

const dataDirectory = path.join(process.cwd(), ".octo-data");
const contentFile = path.join(dataDirectory, "site-content.json");

export async function loadDemoSiteContent(): Promise<SiteContent> {
  if (process.env.NODE_ENV !== "development") {
    return defaultSiteContent();
  }

  try {
    const contents = await readFile(contentFile, "utf8");
    return mergeSiteContent(JSON.parse(contents) as Partial<SiteContent>);
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "";
    if (code !== "ENOENT") {
      console.warn(
        "[Baskı Çiftliği] Yerel vitrin metinleri okunamadı, varsayılan kopya kullanılıyor.",
      );
    }
    return defaultSiteContent();
  }
}

export async function saveDemoSiteContent(content: SiteContent): Promise<void> {
  if (!allowDemoAdminMutations) {
    throw new Error(
      "Yerel demo mutasyonları kapalı. Supabase yapılandırın veya geliştirme ortamında ALLOW_DEMO_ADMIN_MUTATIONS=true kullanın.",
    );
  }

  await mkdir(dataDirectory, { recursive: true });
  await writeFile(
    contentFile,
    `${JSON.stringify(
      { ...content, updatedAt: new Date().toISOString() },
      null,
      2,
    )}\n`,
    "utf8",
  );
}
