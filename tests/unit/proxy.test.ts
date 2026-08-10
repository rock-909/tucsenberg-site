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
    locales: ["en"],
    pathnames: {
      "/": "/",
      "/about": "/about",
      "/contact": "/contact",
      "/products/[market]": "/products/[market]",
    },
  },
}));

describe("proxy next-intl boundary", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    createMiddlewareMock.mockReturnValue(intlMiddlewareMock);
    intlMiddlewareMock.mockReturnValue(NextResponse.next());
  });

  it("creates one next-intl middleware and delegates the request", async () => {
    const { proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/en/about");
    const intlResponse = NextResponse.next();
    intlMiddlewareMock.mockReturnValue(intlResponse);

    const response = proxy(request);

    expect(response).toBe(intlResponse);
    expect(createMiddlewareMock).toHaveBeenCalledTimes(1);
    expect(createMiddlewareMock).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultLocale: "en",
        locales: ["en"],
      }),
    );
    expect(intlMiddlewareMock).toHaveBeenCalledTimes(1);
    expect(intlMiddlewareMock).toHaveBeenCalledWith(request);
  });

  it.each(["/products/not-a-real-product", "/en/products/not-a-real-product"])(
    "returns 404 before streaming an unknown product path: %s",
    async (url) => {
      const { proxy } = await import("@/proxy");
      const request = new NextRequest(`http://localhost:3000${url}`);

      const response = proxy(request);

      expect(response.status).toBe(404);
      expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
      expect(intlMiddlewareMock).not.toHaveBeenCalled();
    },
  );

  it("delegates a real product path to next-intl", async () => {
    const { proxy } = await import("@/proxy");
    const request = new NextRequest(
      "http://localhost:3000/products/abs-flood-barriers",
    );

    proxy(request);

    expect(intlMiddlewareMock).toHaveBeenCalledWith(request);
  });

  it("does not parse unsupported locale-like paths before next-intl", async () => {
    const { proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/fr/products/eu");

    const response = proxy(request);

    expect(response.headers.get("location")).toBeNull();
    expect(intlMiddlewareMock).toHaveBeenCalledTimes(1);
  });

  it("does not clean up next-intl response headers", async () => {
    const { proxy } = await import("@/proxy");
    const intlResponse = NextResponse.next();
    intlResponse.headers.set("x-middleware-set-cookie", "next-intl-owned");
    intlMiddlewareMock.mockReturnValue(intlResponse);

    const response = proxy(new NextRequest("http://localhost:3000/en/about"));

    expect(response.headers.get("x-middleware-set-cookie")).toBe(
      "next-intl-owned",
    );
  });

  it("does not own request overrides, nonce, CSP, health, or security headers", async () => {
    const { proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/en/contact", {
      headers: {
        "cf-connecting-ip": "198.51.100.77",
      },
    });

    const response = proxy(request);

    expect(response.headers.get("x-middleware-override-headers")).toBeNull();
    expect(response.headers.get("x-middleware-request-x-nonce")).toBeNull();
    expect(response.headers.get("x-nonce")).toBeNull();
    expect(response.headers.get("Content-Security-Policy")).toBeNull();
    expect(response.headers.get("Strict-Transport-Security")).toBeNull();
    expect(response.headers.get("x-health-status")).toBeNull();
  });

  it("keeps matcher out of api, _next, and static files only", async () => {
    const { config } = await import("@/proxy");

    expect(config.matcher).toEqual(["/", "/((?!api|_next|.*\\..*).*)"]);
    expect(config.matcher.join(" ")).not.toContain("admin");
    expect(config.matcher.join(" ")).not.toContain("ops");
  });

  it("uses the Next.js proxy convention as the runtime entrypoint", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const repoRoot = path.resolve(__dirname, "../..");

    expect(fs.existsSync(path.join(repoRoot, "src/middleware.ts"))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, "src/proxy.ts"))).toBe(true);
  });
});
