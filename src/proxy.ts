import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isAdminLoginPath } from "@/lib/auth/admin-password";
import { isDevelopmentDemoMode } from "@/lib/env";
import {
  isAppLocale,
  isLocaleExemptPath,
  isPrefixedLocale,
  localePath,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  splitLocalePath,
  type AppLocale,
} from "@/i18n/config";
import { refreshSupabaseSession } from "@/lib/supabase/proxy";

const LOCALE_COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
};

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  return to;
}

function withLocaleHeader(request: NextRequest, locale: AppLocale, pathname: string) {
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, locale);
  headers.set("x-pathname", pathname);
  return headers;
}

export async function proxy(request: NextRequest) {
  const { response, user } = await refreshSupabaseSession(request);
  const url = request.nextUrl;
  const { locale: pathLocale, pathname: stripped } = splitLocalePath(url.pathname);
  const lang = url.searchParams.get("lang");

  if (isAppLocale(lang)) {
    const next = url.clone();
    next.searchParams.delete("lang");
    next.pathname = localePath(lang, stripped);
    const redirectResponse = NextResponse.redirect(next);
    copyCookies(response, redirectResponse);
    redirectResponse.cookies.set(LOCALE_COOKIE, lang, LOCALE_COOKIE_OPTIONS);
    return redirectResponse;
  }

  if (pathLocale) {
    const rewriteUrl = url.clone();
    rewriteUrl.pathname = stripped;
    const rewriteResponse = NextResponse.rewrite(rewriteUrl, {
      request: { headers: withLocaleHeader(request, pathLocale, stripped) },
    });
    copyCookies(response, rewriteResponse);
    rewriteResponse.cookies.set(LOCALE_COOKIE, pathLocale, LOCALE_COOKIE_OPTIONS);
    return finishAuth(request, rewriteResponse, user, stripped, pathLocale);
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (
    isPrefixedLocale(cookieLocale) &&
    !isLocaleExemptPath(stripped)
  ) {
    const next = url.clone();
    next.pathname = localePath(cookieLocale, stripped);
    const redirectResponse = NextResponse.redirect(next);
    copyCookies(response, redirectResponse);
    return redirectResponse;
  }

  const locale: AppLocale = isAppLocale(cookieLocale) ? cookieLocale : "tr";
  const nextResponse = NextResponse.next({
    request: { headers: withLocaleHeader(request, locale, stripped) },
  });
  copyCookies(response, nextResponse);
  return finishAuth(request, nextResponse, user, stripped, locale);
}

function finishAuth(
  request: NextRequest,
  response: NextResponse,
  user: unknown,
  pathname: string,
  locale: AppLocale,
) {
  const requiresSession =
    pathname.startsWith("/hesabim") ||
    (pathname.startsWith("/admin") && !isAdminLoginPath(pathname));

  if (requiresSession && !user && !isDevelopmentDemoMode) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = localePath(locale, "/giris");
    loginUrl.search = "";
    loginUrl.searchParams.set("next", localePath(locale, pathname));
    const redirectResponse = NextResponse.redirect(loginUrl);
    copyCookies(response, redirectResponse);
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};
