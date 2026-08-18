import "server-only";

import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);
const optionalSecret = z.preprocess(
  emptyToUndefined,
  z.string().min(1).optional(),
);

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(20).optional(),
  ),
  NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: optionalSecret,
  PAYTR_MERCHANT_ID: optionalSecret,
  PAYTR_MERCHANT_KEY: optionalSecret,
  PAYTR_MERCHANT_SALT: optionalSecret,
  RESEND_API_KEY: optionalSecret,
  THINGIVERSE_CLIENT_ID: optionalSecret,
  THINGIVERSE_CLIENT_SECRET: optionalSecret,
  THINGIVERSE_REDIRECT_URI: z.preprocess(emptyToUndefined, z.url().optional()),
  THINGIVERSE_ACCESS_TOKEN: optionalSecret,
  THINGIVERSE_API_BASE_URL: z.preprocess(
    emptyToUndefined,
    z.url().optional(),
  ),
  SLICER_WEBHOOK_SECRET: optionalSecret,
  ALLOW_DEMO_ADMIN_MUTATIONS: z.preprocess(
    emptyToUndefined,
    z.enum(["true", "false"]).optional(),
  ),
});

const parsed = serverEnvSchema.safeParse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_SERVER_ACTIONS_ENCRYPTION_KEY:
    process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY,
  PAYTR_MERCHANT_ID: process.env.PAYTR_MERCHANT_ID,
  PAYTR_MERCHANT_KEY: process.env.PAYTR_MERCHANT_KEY,
  PAYTR_MERCHANT_SALT: process.env.PAYTR_MERCHANT_SALT,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  THINGIVERSE_CLIENT_ID: process.env.THINGIVERSE_CLIENT_ID,
  THINGIVERSE_CLIENT_SECRET: process.env.THINGIVERSE_CLIENT_SECRET,
  THINGIVERSE_REDIRECT_URI: process.env.THINGIVERSE_REDIRECT_URI,
  THINGIVERSE_ACCESS_TOKEN: process.env.THINGIVERSE_ACCESS_TOKEN,
  THINGIVERSE_API_BASE_URL: process.env.THINGIVERSE_API_BASE_URL,
  SLICER_WEBHOOK_SECRET: process.env.SLICER_WEBHOOK_SECRET,
  ALLOW_DEMO_ADMIN_MUTATIONS: process.env.ALLOW_DEMO_ADMIN_MUTATIONS,
});

if (!parsed.success) {
  throw new Error(
    `Sunucu ortam değişkenleri geçersiz: ${JSON.stringify(
      parsed.error.flatten().fieldErrors,
    )}`,
  );
}

export const serverEnv = parsed.data;

export const allowDemoAdminMutations =
  process.env.NODE_ENV === "development" &&
  serverEnv.ALLOW_DEMO_ADMIN_MUTATIONS !== "false";
