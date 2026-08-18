import { z } from "zod";

import { parseStrictEnvBoolean } from "@/lib/env-boolean";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const publicMediaUrl = z.union([
  z.url(),
  z.string().regex(/^\/[A-Za-z0-9._~:/?#@!$&'()*+,;=%-]+$/),
]);

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(20).optional(),
  ),
  NEXT_PUBLIC_CONTACT_EMAIL: z.preprocess(
    emptyToUndefined,
    z.email().optional(),
  ),
  NEXT_PUBLIC_CONTACT_PHONE: z.preprocess(
    emptyToUndefined,
    z.string().optional(),
  ),
  NEXT_PUBLIC_INSTAGRAM_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  NEXT_PUBLIC_YOUTUBE_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  NEXT_PUBLIC_HOME_HERO_VIDEO_URL: z.preprocess(
    emptyToUndefined,
    publicMediaUrl.optional(),
  ),
  NEXT_PUBLIC_HOME_HERO_POSTER_URL: z.preprocess(
    emptyToUndefined,
    publicMediaUrl.optional(),
  ),
  NEXT_PUBLIC_HOME_HERO_WEBM_URL: z.preprocess(
    emptyToUndefined,
    publicMediaUrl.optional(),
  ),
});

const parsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
  NEXT_PUBLIC_CONTACT_PHONE: process.env.NEXT_PUBLIC_CONTACT_PHONE,
  NEXT_PUBLIC_INSTAGRAM_URL: process.env.NEXT_PUBLIC_INSTAGRAM_URL,
  NEXT_PUBLIC_YOUTUBE_URL: process.env.NEXT_PUBLIC_YOUTUBE_URL,
  NEXT_PUBLIC_HOME_HERO_VIDEO_URL: process.env.NEXT_PUBLIC_HOME_HERO_VIDEO_URL,
  NEXT_PUBLIC_HOME_HERO_POSTER_URL:
    process.env.NEXT_PUBLIC_HOME_HERO_POSTER_URL,
  NEXT_PUBLIC_HOME_HERO_WEBM_URL: process.env.NEXT_PUBLIC_HOME_HERO_WEBM_URL,
});

if (!parsed.success && process.env.NODE_ENV !== "test") {
  console.warn(
    "[Baskı Çiftliği] Public environment configuration is invalid:",
    parsed.error.flatten().fieldErrors,
  );
}

export const publicEnv = parsed.success ? parsed.data : {};

export const isSupabaseConfigured = Boolean(
  publicEnv.NEXT_PUBLIC_SUPABASE_URL && publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export const isDevelopmentDemoMode =
  process.env.NODE_ENV === "development" && !isSupabaseConfigured;

export const catalogPersistenceConfigured = isSupabaseConfigured;

export const allowProductionDemoImport = parseStrictEnvBoolean(
  process.env.ALLOW_PRODUCTION_DEMO_IMPORT,
);
