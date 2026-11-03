import { NextResponse } from "next/server";

import { getJobEvents, getQuoteJob } from "@/domain/manufacturing/repository";
import { maybeApplyMeshQuoteIfWorkerOffline } from "@/domain/manufacturing/quote-service";
import { publicJobPoll } from "@/domain/manufacturing/public-dto";
import { getManufacturingActor, ownsRecord } from "@/lib/manufacturing/session";
import { clientKey, rateLimit } from "@/lib/manufacturing/rate-limit";
import { canViewInternalCost } from "@/lib/catalog/authorization";
import { getWorkerReadiness } from "@/lib/manufacturing/worker-readiness";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const limited = rateLimit({
    key: clientKey(request, "job-status"),
    limit: 120,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json({ error: "Durum sorgusu sınırı." }, { status: 429 });
  }

  const { id } = await context.params;
  let job = await getQuoteJob(id);
  if (!job) {
    return NextResponse.json({ error: "İş bulunamadı." }, { status: 404 });
  }
  if (!job.quoteId) {
    job = (await maybeApplyMeshQuoteIfWorkerOffline(job.id)) ?? job;
  }
  const actor = await getManufacturingActor();
  if (!ownsRecord(actor, job) && !canViewInternalCost(actor.role)) {
    return NextResponse.json({ error: "İş bulunamadı." }, { status: 404 });
  }
  const [events, readiness] = await Promise.all([
    getJobEvents(job.id),
    getWorkerReadiness(),
  ]);
  return NextResponse.json(publicJobPoll(job, events, readiness), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
