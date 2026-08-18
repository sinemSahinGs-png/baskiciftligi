import { NextResponse } from "next/server";

import { getManufacturingFile } from "@/domain/manufacturing/repository";
import { readPrivateObject } from "@/lib/manufacturing/paths";
import { getManufacturingActor, ownsRecord } from "@/lib/manufacturing/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const file = await getManufacturingFile(id);
  if (!file) {
    return NextResponse.json({ error: "Dosya yok." }, { status: 404 });
  }
  const actor = await getManufacturingActor();
  if (!ownsRecord(actor, file)) {
    return NextResponse.json({ error: "Dosya yok." }, { status: 404 });
  }
  const bytes = await readPrivateObject(file.storageKey);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "private, max-age=30",
    },
  });
}
