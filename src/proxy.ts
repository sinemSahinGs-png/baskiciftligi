import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isAdminLoginPath } from "@/lib/auth/admin-password";
import { isDevelopmentDemoMode } from "@/lib/env";
import { refreshSupabaseSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { response, user } = await refreshSupabaseSession(request);
  const pathname = request.nextUrl.pathname;
  const requiresSession =
    pathname.startsWith("/hesabim") ||
    (pathname.startsWith("/admin") && !isAdminLoginPath(pathname));

  if (requiresSession && !user && !isDevelopmentDemoMode) {
    const loginUrl = new URL("/giris", request.url);
    loginUrl.searchParams.set("next", pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);

    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};
