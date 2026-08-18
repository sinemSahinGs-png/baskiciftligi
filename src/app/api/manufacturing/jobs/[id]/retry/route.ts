import { NextResponse } from "next/server";

import { getQuoteJob, transitionQuoteJob } from "@/domain/manufacturing/repository";
import { getManufacturingActor, ownsRecord } from "@/lib/manufacturing/session";
import { clientKey, rateLimit } from "@/lib/manufacturing/rate-limit";
import { JOB_MAX_ATTEMPTS } from "@/domain/manufacturing/types";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const limited = rateLimit({
    key: clientKey(request, "job-retry"),
    limit: 10,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json({ error: "Yeniden deneme sınırı." }, { status: 429 });
  }
  const { id } = await context.params;
  const job = await getQuoteJob(id);
  if (!job) {
    return NextResponse.json({ error: "İş bulunamadı." }, { status: 404 });
  }
  const actor = await getManufacturingActor();
  if (!ownsRecord(actor, job)) {
    return NextResponse.json({ error: "İş bulunamadı." }, { status: 404 });
  }
  if (job.state !== "failed") {
    return NextResponse.json({ error: "Yalnız başarısız işler yenilenir." }, { status: 409 });
  }
  if (job.attemptCount >= JOB_MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Yeniden deneme hakkı doldu." }, { status: 409 });
  }
  await transitionQuoteJob(job.id, "uploaded", {
    errorCode: null,
    errorMessage: null,
    lockedAt: null,
    lockedBy: null,
    quoteId: null,
  });
  return NextResponse.json({ ok: true, jobId: job.id });
}
