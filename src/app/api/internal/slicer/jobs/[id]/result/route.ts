import { NextResponse } from "next/server";
import { z } from "zod";

import { finalizePricedJob } from "@/domain/manufacturing/quote-service";
import { duplicateWorkerResultAction } from "@/domain/manufacturing/job-lifecycle";
import { actualSupportGenerated, GCODE_PARSER_VERSION } from "@/domain/manufacturing/gcode";
import {
  computeExpectedSlicedDimensions,
  rawDimensionsFromAnalysis,
} from "@/domain/manufacturing/transform-pipeline";
import { dimensionsWithinTolerance } from "@/domain/manufacturing/transform";
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
      supportUsed: z.boolean().optional(),
      supportGenerated: z.boolean().optional(),
      supportMaterialMm: z.number().min(0).optional(),
      supportMaterialGrams: z.number().min(0).optional(),
      supportLayerCount: z.number().int().min(0).optional(),
      gcodeParserVersion: z.string().max(40).optional(),
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
    const errorCode = parsed.data.errorCode ?? "slicer_failure";
    const reviewFlags: ReviewFlag[] =
      errorCode === "transform_unsupported"
        ? ["ambiguous_orientation", "slicer_failure"]
        : ["slicer_failure"];
    await transitionQuoteJob(job.id, errorCode === "transform_unsupported" ? "needs_review" : "failed", {
      errorCode,
      errorMessage: parsed.data.errorMessage ?? "Dilimleme tamamlanamadı.",
      lockedAt: null,
      lockedBy: null,
      reviewFlags,
    });
    return NextResponse.json({
      ok: true,
      state: errorCode === "transform_unsupported" ? "needs_review" : "failed",
    });
  }

  const incoming = parsed.data.metrics;
  const supportGenerated = actualSupportGenerated(incoming);
  const metrics = {
    ...incoming,
    supportGenerated,
    supportUsed: supportGenerated,
    supportMaterialMm: incoming.supportMaterialMm ?? 0,
    supportMaterialGrams: incoming.supportMaterialGrams ?? 0,
    supportLayerCount: incoming.supportLayerCount ?? 0,
    gcodeParserVersion: incoming.gcodeParserVersion ?? GCODE_PARSER_VERSION,
  } as SlicingMetrics;
  const flags = (parsed.data.flags ?? []) as ReviewFlag[];
  if (
    job.configuration.manufacturingTransform &&
    job.analysis?.dimensionsMm
  ) {
    const rawDimensionsMm = rawDimensionsFromAnalysis(
      job.analysis.dimensionsMm,
      job.analysis.scalePercent,
    );
    const expected = computeExpectedSlicedDimensions(
      rawDimensionsMm,
      job.configuration.manufacturingTransform,
    );
    if (!dimensionsWithinTolerance(expected, metrics.dimensionsMm)) {
      await transitionQuoteJob(job.id, "needs_review", {
        metrics,
        reviewFlags: [...flags, "slicer_warning"],
        errorCode: "transform_mismatch",
        errorMessage: "Önizleme boyutları ile dilimleme sonucu uyuşmadı.",
        lockedAt: null,
        lockedBy: null,
      });
      return NextResponse.json({
        ok: true,
        status: "needs_review",
        code: "transform_mismatch",
      });
    }
  }
  await transitionQuoteJob(job.id, "pricing", { metrics, reviewFlags: flags });
  const quote = await finalizePricedJob({ job: { ...job, metrics }, metrics, flags });
  return NextResponse.json({ ok: true, quoteId: quote.id, status: quote.status });
}
