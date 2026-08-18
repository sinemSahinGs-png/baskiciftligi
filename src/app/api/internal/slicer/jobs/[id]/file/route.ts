import { NextResponse } from "next/server";

import { getManufacturingFile, getQuoteJob } from "@/domain/manufacturing/repository";
import { readPrivateObject } from "@/lib/manufacturing/paths";
import { assertSlicerWorker } from "@/lib/manufacturing/worker-auth";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = assertSlicerWorker(request);
  if (denied) {
    return denied;
  }
  const { id } = await context.params;
  const job = await getQuoteJob(id);
  if (!job || !job.lockedBy) {
    return NextResponse.json({ error: "İş kilitli değil." }, { status: 409 });
  }
  const file = await getManufacturingFile(job.fileId);
  if (!file) {
    return NextResponse.json({ error: "Dosya yok." }, { status: 404 });
  }
  const bytes = await readPrivateObject(file.storageKey);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${file.id}.${file.format}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
