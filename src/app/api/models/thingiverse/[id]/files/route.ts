import { NextResponse } from "next/server";

import { getThingFiles, ThingiverseApiError } from "@/providers/thingiverse/client";
import { getThingiverseConfigStatus, printableFiles } from "@/providers/thingiverse/provider";
import { clientKey, rateLimit } from "@/lib/manufacturing/rate-limit";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const limited = rateLimit({
    key: clientKey(request, "tv-files"),
    limit: 40,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json({ error: "İstek sınırı." }, { status: 429 });
  }

  const { id } = await context.params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Geçersiz model kimliği." }, { status: 422 });
  }
  if (getThingiverseConfigStatus() !== "connected") {
    return NextResponse.json({ status: getThingiverseConfigStatus(), files: [] });
  }
  try {
    const files = printableFiles(await getThingFiles(id)).map((file) => ({
      id: String(file.id ?? ""),
      name: file.name ?? "adsız",
      size: file.size ?? null,
      formattedSize: file.formatted_size ?? null,
      format: (file.name ?? "").split(".").pop()?.toLowerCase() ?? null,
      downloadUrl: file.download_url ?? file.direct_url ?? file.url ?? null,
    }));
    return NextResponse.json({ status: "connected", files });
  } catch (error) {
    if (error instanceof ThingiverseApiError) {
      return NextResponse.json(
        { status: "error", error: error.message, files: [] },
        { status: error.status === 404 ? 404 : 200 },
      );
    }
    throw error;
  }
}
