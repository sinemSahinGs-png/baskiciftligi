import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { assertNoSecretLikePayload } from "@/lib/launch/sanitize";

export async function recordLaunchAudit(
  action: string,
  metadata: Record<string, unknown> = {},
) {
  assertNoSecretLikePayload({ action, metadata });
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return;
  }

  const result = await supabase.rpc("write_catalog_audit", {
    audit_action: action,
    audit_product_id: null,
    audit_metadata: metadata,
  });

  if (result.error) {
    console.error("[launch audit]", result.error.message);
  }
}
