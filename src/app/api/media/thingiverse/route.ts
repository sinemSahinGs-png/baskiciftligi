import {
  isAllowedThingiverseImageHost,
  normalizeThingiverseImageUrl,
} from "@/domain/external-models/thingiverse-images";

export const runtime = "edge";

const MAX_URL_LENGTH = 1800;

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("u") ?? "";
  if (!raw || raw.length > MAX_URL_LENGTH) {
    return new Response("bad request", { status: 400 });
  }

  const normalized = normalizeThingiverseImageUrl(raw);
  if (!normalized) {
    return new Response("forbidden host", { status: 400 });
  }

  let current: URL;
  try {
    current = new URL(normalized);
  } catch {
    return new Response("bad request", { status: 400 });
  }

  for (let hop = 0; hop < 3; hop += 1) {
    if (!isAllowedThingiverseImageHost(current.hostname)) {
      return new Response("forbidden host", { status: 400 });
    }
    const upstream = await fetch(current.toString(), {
      headers: {
        Accept: "image/*,*/*;q=0.8",
        "User-Agent": "BaskiCiftligi/1.0 (+https://baskiciftligi.com)",
      },
      redirect: "manual",
      cache: "force-cache",
    });

    if (upstream.status >= 300 && upstream.status < 400) {
      const location = upstream.headers.get("location");
      if (!location) {
        return new Response("bad redirect", { status: 502 });
      }
      current = new URL(location, current);
      continue;
    }

    const contentType = upstream.headers.get("content-type") ?? "";
    if (!upstream.ok || !contentType.toLowerCase().startsWith("image/")) {
      return new Response("upstream image failed", { status: 502 });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  }

  return new Response("too many redirects", { status: 502 });
}
