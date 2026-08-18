import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { isDevelopmentDemoMode } from "@/lib/env";

export const runtime = "nodejs";

function contentTypeFor(filename: string): string {
  const extension = filename.toLocaleLowerCase("en-US").split(".").pop();
  switch (extension) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    default:
      return "application/octet-stream";
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!isDevelopmentDemoMode) {
    return NextResponse.json(
      { error: "Yerel katalog medyası yalnızca geliştirme modunda sunulur." },
      { status: 404 },
    );
  }

  const { path: segments } = await context.params;
  if (!segments?.length || segments.some((part) => part.includes("..") || part.includes("\\"))) {
    return NextResponse.json({ error: "Geçersiz medya yolu." }, { status: 400 });
  }

  const relative = segments.join("/");
  const absolute = path.join(process.cwd(), ".octo-data", "media", relative);
  const root = path.join(process.cwd(), ".octo-data", "media");
  if (!absolute.startsWith(root)) {
    return NextResponse.json({ error: "Geçersiz medya yolu." }, { status: 400 });
  }

  try {
    const bytes = await readFile(absolute);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": contentTypeFor(relative),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Medya bulunamadı." }, { status: 404 });
  }
}
