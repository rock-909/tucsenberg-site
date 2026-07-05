import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { LOCALES_CONFIG } from "@/config/paths/locales-config";
import { routing } from "@/i18n/routing-config";

const intlMiddleware = createMiddleware(routing);

const RETIRED_LOCALE_NOT_FOUND_HEADERS = {
  "content-type": "text/plain; charset=utf-8",
  "x-robots-tag": "noindex, nofollow",
} as const;

function isRetiredLocalePath(pathname: string): boolean {
  return LOCALES_CONFIG.retiredLocales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
}

function createRetiredLocaleNotFound() {
  return new NextResponse("Not Found", {
    status: 404,
    headers: RETIRED_LOCALE_NOT_FOUND_HEADERS,
  });
}

export default function middleware(request: NextRequest) {
  if (isRetiredLocalePath(request.nextUrl.pathname)) {
    return createRetiredLocaleNotFound();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/((?!api|_next|.*\\..*).*)"],
};
