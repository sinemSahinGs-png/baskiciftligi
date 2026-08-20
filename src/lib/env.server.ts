import "server-only";

import { z } from "zod";

import { parseStrictEnvBoolean } from "@/lib/env-boolean";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);
const optionalSecret = z.preprocess(
  emptyToUndefined,
  z.string().min(1).optional(),
);

const serverEnvSchema = z.object({
  SUPABASE_SECRET_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(20).optional(),
  ),
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(20).optional(),
  ),
  NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: optionalSecret,
  PAYTR_MERCHANT_ID: optionalSecret,
  PAYTR_MERCHANT_KEY: optionalSecret,
  PAYTR_MERCHANT_SALT: optionalSecret,
  PAYTR_CALLBACK_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  RESEND_API_KEY: optionalSecret,
  EMAIL_FROM: optionalSecret,
  THINGIVERSE_CLIENT_ID: optionalSecret,
  THINGIVERSE_CLIENT_SECRET: optionalSecret,
  THINGIVERSE_REDIRECT_URI: z.preprocess(emptyToUndefined, z.url().optional()),
  THINGIVERSE_ACCESS_TOKEN: optionalSecret,
  THINGIVERSE_API_BASE_URL: z.preprocess(
    emptyToUndefined,
    z.url().optional(),
  ),
  SLICER_WEBHOOK_SECRET: optionalSecret,
  SLICER_WORKER_SECRET: optionalSecret,
  SLICER_WORKER_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  SLICER_QUEUE_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  MANUFACTURING_QUOTE_HMAC_SECRET: optionalSecret,
  MANUFACTURING_MAX_UPLOAD_BYTES: z.preprocess(emptyToUndefined, z.string().optional()),
  THINGIVERSE_FIXTURE_MODE: z.preprocess(
    emptyToUndefined,
    z.string().optional(),
  ),
  ALLOW_DEMO_ADMIN_MUTATIONS: z.preprocess(
    emptyToUndefined,
    z.string().optional(),
  ),
  ALLOW_PRODUCTION_DEMO_IMPORT: z.preprocess(
    emptyToUndefined,
    z.string().optional(),
  ),
  ADMIN_PANEL_PASSWORD: optionalSecret,
});

const parsed = serverEnvSchema.safeParse({
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_SERVER_ACTIONS_ENCRYPTION_KEY:
    process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY,
  PAYTR_MERCHANT_ID: process.env.PAYTR_MERCHANT_ID,
  PAYTR_MERCHANT_KEY: process.env.PAYTR_MERCHANT_KEY,
  PAYTR_MERCHANT_SALT: process.env.PAYTR_MERCHANT_SALT,
  PAYTR_CALLBACK_URL: process.env.PAYTR_CALLBACK_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  THINGIVERSE_CLIENT_ID: process.env.THINGIVERSE_CLIENT_ID,
  THINGIVERSE_CLIENT_SECRET: process.env.THINGIVERSE_CLIENT_SECRET,
  THINGIVERSE_REDIRECT_URI: process.env.THINGIVERSE_REDIRECT_URI,
  THINGIVERSE_ACCESS_TOKEN: process.env.THINGIVERSE_ACCESS_TOKEN,
  THINGIVERSE_API_BASE_URL: process.env.THINGIVERSE_API_BASE_URL,
  SLICER_WEBHOOK_SECRET: process.env.SLICER_WEBHOOK_SECRET,
  SLICER_WORKER_SECRET: process.env.SLICER_WORKER_SECRET,
  SLICER_WORKER_URL: process.env.SLICER_WORKER_URL,
  SLICER_QUEUE_URL: process.env.SLICER_QUEUE_URL,
  MANUFACTURING_QUOTE_HMAC_SECRET: process.env.MANUFACTURING_QUOTE_HMAC_SECRET,
  MANUFACTURING_MAX_UPLOAD_BYTES: process.env.MANUFACTURING_MAX_UPLOAD_BYTES,
  THINGIVERSE_FIXTURE_MODE: process.env.THINGIVERSE_FIXTURE_MODE,
  ALLOW_DEMO_ADMIN_MUTATIONS: process.env.ALLOW_DEMO_ADMIN_MUTATIONS,
  ALLOW_PRODUCTION_DEMO_IMPORT: process.env.ALLOW_PRODUCTION_DEMO_IMPORT,
  ADMIN_PANEL_PASSWORD: process.env.ADMIN_PANEL_PASSWORD,
});

if (!parsed.success) {
  throw new Error(
    `Sunucu ortam değişkenleri geçersiz: ${JSON.stringify(
      parsed.error.flatten().fieldErrors,
    )}`,
  );
}

export const serverEnv = parsed.data;

/** Server-only secret key — prefers SUPABASE_SECRET_KEY. */
export const supabaseSecretKey =
  serverEnv.SUPABASE_SECRET_KEY ?? serverEnv.SUPABASE_SERVICE_ROLE_KEY;

export const allowDemoAdminMutations =
  process.env.NODE_ENV === "development" &&
  parseStrictEnvBoolean(serverEnv.ALLOW_DEMO_ADMIN_MUTATIONS);

export const thingiverseFixtureEnabled = parseStrictEnvBoolean(
  serverEnv.THINGIVERSE_FIXTURE_MODE,
);
