import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createMiddlewareMock, intlMiddlewareMock } = vi.hoisted(() => ({
  createMiddlewareMock: vi.fn(),
  intlMiddlewareMock: vi.fn(),
}));

vi.mock("next-intl/middleware", () => ({
  default: createMiddlewareMock,
}));

vi.mock("@/i18n/routing-config", () => ({
  routing: {
    defaultLocale: "en",
    locales: ["en", "zh"],
    pathnames: {
      "/": "/",
      "/about": "/about",
      "/contact": "/contact",
      "/products/[market]": "/products/[market]",
    },
    localeCookie: { maxAge: 60 * 60 * 24 * 365 },
  },
}));

describe("middleware next-intl boundary", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    createMiddlewareMock.mockReturnValue(intlMiddlewareMock);
    intlMiddlewareMock.mockReturnValue(NextResponse.next());
  });

  it("creates one next-intl middleware and delegates the request", async () => {
    const { default: middleware } = await import("@/middleware");
    const request = new NextRequest("http://localhost:3000/en/about");
    const intlResponse = NextResponse.next();
    intlMiddlewareMock.mockReturnValue(intlResponse);

    const response = middleware(request);

    expect(response).toBe(intlResponse);
    expect(createMiddlewareMock).toHaveBeenCalledTimes(1);
    expect(createMiddlewareMock).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultLocale: "en",
        locales: ["en", "zh"],
      }),
    );
    expect(intlMiddlewareMock).toHaveBeenCalledTimes(1);
    expect(intlMiddlewareMock).toHaveBeenCalledWith(request);
  });

  it("does not manually set NEXT_LOCALE for localized requests", async () => {
    const { default: middleware } = await import("@/middleware");
    const request = new NextRequest("http://localhost:3000/zh/about", {
      headers: {
        cookie: "NEXT_LOCALE=en",
      },
    });

    const response = middleware(request);

    expect(response.headers.get("set-cookie")).toBeNull();
    expect(intlMiddlewareMock).toHaveBeenCalledTimes(1);
  });

  it("does not parse unsupported locale-like paths before next-intl", async () => {
    const { default: middleware } = await import("@/middleware");
    const request = new NextRequest("http://localhost:3000/fr/products/eu");

    const response = middleware(request);

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(intlMiddlewareMock).toHaveBeenCalledTimes(1);
  });

  it("does not clean up next-intl response headers", async () => {
    const { default: middleware } = await import("@/middleware");
    const intlResponse = NextResponse.next();
    intlResponse.headers.set("x-middleware-set-cookie", "next-intl-owned");
    intlMiddlewareMock.mockReturnValue(intlResponse);

    const response = middleware(
      new NextRequest("http://localhost:3000/en/about"),
    );

    expect(response.headers.get("x-middleware-set-cookie")).toBe(
      "next-intl-owned",
    );
  });

  it("does not own request overrides, nonce, CSP, health, or security headers", async () => {
    const { default: middleware } = await import("@/middleware");
    const request = new NextRequest("http://localhost:3000/en/contact", {
      headers: {
        "cf-connecting-ip": "198.51.100.77",
      },
    });

    const response = middleware(request);

    expect(response.headers.get("x-middleware-override-headers")).toBeNull();
    expect(response.headers.get("x-middleware-request-x-nonce")).toBeNull();
    expect(response.headers.get("x-nonce")).toBeNull();
    expect(response.headers.get("Content-Security-Policy")).toBeNull();
    expect(response.headers.get("Strict-Transport-Security")).toBeNull();
    expect(response.headers.get("x-health-status")).toBeNull();
  });

  it("keeps matcher out of api, admin, ops, and static files", async () => {
    const { config } = await import("@/middleware");

    expect(config.matcher).toEqual([
      "/",
      "/((?!api|_next|admin|ops|.*\\..*).*)",
    ]);
  });

  it("keeps middleware as the Cloudflare runtime entrypoint until proxy support is proven", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const repoRoot = path.resolve(__dirname, "../..");

    expect(fs.existsSync(path.join(repoRoot, "src/middleware.ts"))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, "src/proxy.ts"))).toBe(false);
  });
});
