import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing-config";
import { HTTP_NOT_FOUND } from "@/constants";
import { isProductMarketSlug } from "@/constants/product-catalog";

const intlMiddleware = createMiddleware(routing);

const PLAIN_NOT_FOUND_HEADERS = {
  "content-type": "text/plain; charset=utf-8",
  "x-robots-tag": "noindex, nofollow",
} as const;

function createPlainNotFound() {
  return new NextResponse("Not Found", {
    status: HTTP_NOT_FOUND,
    headers: PLAIN_NOT_FOUND_HEADERS,
  });
}

function isUnknownProductPath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  let market: string | undefined;

  if (segments.length === 2 && segments[0] === "products") {
    market = segments[1];
  } else if (
    segments.length === 3 &&
    routing.locales.some((locale) => locale === segments[0]) &&
    segments[1] === "products"
  ) {
    market = segments[2];
  }

  return market !== undefined && !isProductMarketSlug(market);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isUnknownProductPath(pathname)) {
    return createPlainNotFound();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/((?!api|_next|.*\\..*).*)"],
};
