import { NextResponse } from "next/server";

import { executeIdeaSearch } from "@/lib/model-discovery/idea-search-service";
import { planIdeaSearch, validateIdeaQuery } from "@/lib/model-discovery/idea-search";
import { clientKey, rateLimit } from "@/lib/manufacturing/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = rateLimit({
    key: clientKey(request, "home-idea-search"),
    limit: 12,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      {
        status: "rate_limited",
        category: null,
        variants: [],
        chips: [],
        items: [],
        closest: false,
        hasMore: false,
        retryAfterSeconds: limited.retryAfterSeconds,
      },
      { status: 429 },
    );
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Geçersiz istek.", status: "unavailable" },
      { status: 400 },
    );
  }

  const rawQuery =
    body && typeof body === "object" && "query" in body
      ? (body as { query?: unknown }).query
      : undefined;
  const rawPage =
    body && typeof body === "object" && "page" in body
      ? (body as { page?: unknown }).page
      : 1;

  const validation = validateIdeaQuery(rawQuery);
  if (!validation.ok) {
    return NextResponse.json(
      {
        error:
          validation.reason === "too_long"
            ? "Sorgu çok uzun."
            : "Geçerli bir fikir yazın.",
        status: "empty",
        reason: validation.reason,
        items: [],
      },
      { status: 400 },
    );
  }

  const page = typeof rawPage === "number" && Number.isFinite(rawPage) ? rawPage : 1;
  const plan = planIdeaSearch(validation.query);
  const result = await executeIdeaSearch({
    plan,
    page,
    correlationId: crypto.randomUUID(),
  });

  return NextResponse.json({
    ...result,
    // Never echo the raw user sentence back as HTML; sanitized display only.
    displayQuery: plan.sanitized,
  });
}
