import { createClient } from "@supabase/supabase-js";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const i = line.indexOf("=");
  if (i > 0) env[line.slice(0, i)] = line.slice(i + 1).replace(/^["']|["']$/g, "");
}
const service = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const fileId = randomUUID();
const jobId = randomUUID();
await service.from("manufacturing_files").insert({
  id: fileId,
  owner_user_id: null,
  session_id: randomUUID(),
  source: "upload",
  storage_key: `probe/${fileId}.stl`,
  original_filename: "probe.stl",
  format: "stl",
  size_bytes: 64,
  checksum_sha256: randomBytes(32).toString("hex"),
  mime_type: "model/stl",
  rights_confirmed_at: new Date().toISOString(),
});
const ins = await service.from("quote_jobs").insert({
  id: jobId,
  owner_user_id: null,
  file_id: fileId,
  session_id: randomUUID(),
  state: "uploaded",
  idempotency_key: `probe-${jobId}`,
  configuration: {},
});
console.log("insert", ins.error?.message ?? "ok");
const claim = await service.rpc("claim_quote_job", { worker_id: "probe-worker", lease_ms: 60000 });
console.log(JSON.stringify({ claimError: claim.error?.message, claimData: claim.data }, null, 2));
await service.from("quote_jobs").delete().eq("id", jobId);
await service.from("manufacturing_files").delete().eq("id", fileId);
