export const runtime = "edge";

const THINGIVERSE_API_ORIGIN = "https://api.thingiverse.com";

function safeApiPath(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.includes("://") || raw.includes("..")) {
    return null;
  }
  if (raw.length > 300) return null;
  return raw;
}

export async function GET(request: Request) {
  const expected =
    process.env.MANUFACTURING_QUOTE_HMAC_SECRET ||
    process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY ||
    "";
  const provided = request.headers.get("x-bc-tv-proxy") ?? "";
  if (!expected || provided !== expected) {
    return new Response("forbidden", { status: 403 });
  }

  const path = safeApiPath(new URL(request.url).searchParams.get("path"));
  const token = request.headers.get("x-bc-tv-token") ?? "";
  if (!path || !token) {
    return new Response("bad request", { status: 400 });
  }

  const upstream = await fetch(`${THINGIVERSE_API_ORIGIN}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "User-Agent": "BaskiCiftligi/1.0 (+https://baskiciftligi.com)",
    },
    cache: "no-store",
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}
