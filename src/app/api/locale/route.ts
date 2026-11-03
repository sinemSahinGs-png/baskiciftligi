import { NextResponse } from "next/server";

import { isAppLocale, LOCALE_COOKIE } from "@/i18n/config";

export async function POST(request: Request) {
  let locale = "";
  try {
    const json = (await request.json()) as { locale?: string };
    locale = String(json.locale ?? "");
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (!isAppLocale(locale)) {
    return NextResponse.json({ error: "invalid" }, { status: 422 });
  }
  const response = NextResponse.json({ ok: true, locale });
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
