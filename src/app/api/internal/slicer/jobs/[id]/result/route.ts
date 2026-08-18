import { NextResponse } from "next/server";
import { z } from "zod";

import { finalizePricedJob } from "@/domain/manufacturing/quote-service";
import { duplicateWorkerResultAction } from "@/domain/manufacturing/job-lifecycle";
import { getQuoteJob, transitionQuoteJob } from "@/domain/manufacturing/repository";
import type { ReviewFlag, SlicingMetrics } from "@/domain/manufacturing/types";
import { assertSlicerWorker } from "@/lib/manufacturing/worker-auth";

const resultSchema = z.object({
  ok: z.boolean(),
  errorCode: z.string().max(80).optional(),
  errorMessage: z.string().max(500).optional(),
  logsSanitized: z.string().max(8000).optional(),
  flags: z.array(z.string()).optional(),
  metrics: z
    .object({
      dimensionsMm: z.object({ x: z.number(), y: z.number(), z: z.number() }),
      filamentLengthMm: z.number().positive(),
      filamentWeightGrams: z.number().positive(),
      estimatedDurationSeconds: z.number().positive(),
      layerCount: z.number().int().nullable(),
      supportUsed: z.boolean(),
      materialId: z.literal("pla"),
      qualityId: z.enum(["ekonomik", "standart", "detayli"]),
      quantity: z.int().min(1),
      orientation: z.object({
        rotateX: z.number(),
        rotateY: z.number(),
        rotateZ: z.number(),
      }),
      engine: z.object({ name: z.string(), version: z.string() }),
      profileChecksum: z.string().min(32).max(64),
      warnings: z.array(z.string()),
    })
    .optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = assertSlicerWorker(request);
  if (denied) {
    return denied;
  }
  const { id } = await context.params;
  const job = await getQuoteJob(id);
  if (!job) {
    return NextResponse.json({ error: "İş yok." }, { status: 404 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }
  const parsed = resultSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "İşçi sonucu doğrulanamadı." }, { status: 422 });
  }

  const action = duplicateWorkerResultAction(job.state, parsed.data.ok && Boolean(parsed.data.metrics));
  if (action === "idempotent-success") {
    return NextResponse.json({ ok: true, quoteId: job.quoteId, status: job.state, idempotent: true });
  }
  if (action === "idempotent-failure") {
    return NextResponse.json({ ok: true, state: "failed", idempotent: true });
  }
  if (action === "conflict") {
    return NextResponse.json({ error: "İş bu durumda sonuç kabul etmez." }, { status: 409 });
  }

  if (!parsed.data.ok || !parsed.data.metrics) {
    await transitionQuoteJob(job.id, "failed", {
      errorCode: parsed.data.errorCode ?? "slicer_failure",
      errorMessage: parsed.data.errorMessage ?? "Dilimleme tamamlanamadı.",
      lockedAt: null,
      lockedBy: null,
      reviewFlags: ["slicer_failure"],
    });
    return NextResponse.json({ ok: true, state: "failed" });
  }

  const metrics = parsed.data.metrics as SlicingMetrics;
  const flags = (parsed.data.flags ?? []) as ReviewFlag[];
  await transitionQuoteJob(job.id, "pricing", { metrics, reviewFlags: flags });
  const quote = await finalizePricedJob({ job: { ...job, metrics }, metrics, flags });
  return NextResponse.json({ ok: true, quoteId: quote.id, status: quote.status });
}
