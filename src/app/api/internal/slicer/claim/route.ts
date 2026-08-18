import { NextResponse } from "next/server";

import { claimQuoteJob, getManufacturingFile, touchIntegration } from "@/domain/manufacturing/repository";
import { assertSlicerWorker } from "@/lib/manufacturing/worker-auth";

export async function POST(request: Request) {
  const denied = assertSlicerWorker(request);
  if (denied) {
    return denied;
  }
  const workerId = request.headers.get("x-slicer-worker-id") ?? "worker";
  const workerVersion = request.headers.get("x-slicer-worker-version");
  const prusaVersion = request.headers.get("x-prusa-slicer-version");
  await touchIntegration({
    workerLastSeenAt: new Date().toISOString(),
    workerVersion: workerVersion ?? undefined,
    prusaSlicerVersion: prusaVersion ?? undefined,
  });
  const job = await claimQuoteJob(workerId);
  if (!job) {
    return NextResponse.json({ job: null });
  }
  const file = await getManufacturingFile(job.fileId);
  if (!file) {
    return NextResponse.json({ error: "Dosya yok." }, { status: 409 });
  }
  return NextResponse.json({
    job: {
      id: job.id,
      fileId: file.id,
      originalFilename: file.originalFilename,
      format: file.format,
      checksumSha256: file.checksumSha256,
      configuration: job.configuration,
      analysis: job.analysis,
      downloadPath: `/api/internal/slicer/jobs/${job.id}/file`,
    },
  });
}
