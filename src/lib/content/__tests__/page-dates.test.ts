import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCanonicalPath } from "@/config/paths/utils";
import {
  SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES,
  SINGLE_SITE_PUBLIC_STATIC_PAGES,
} from "@/config/single-site-seo";
import {
  getMdxPageLastModified,
  isMdxDrivenPage,
} from "@/lib/content/page-dates";

const { mockGetContentEntry, mockLoggerWarn } = vi.hoisted(() => ({
  mockGetContentEntry: vi.fn(),
  mockLoggerWarn: vi.fn(),
}));

vi.mock("@/lib/content-manifest", () => ({
  getContentEntry: mockGetContentEntry,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: mockLoggerWarn,
  },
}));

describe("page-dates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps sitemap MDX page detection aligned with public static routes", () => {
    const nonMdxPages = new Set([
      "",
      getCanonicalPath("products"),
      getCanonicalPath("blog"),
      getCanonicalPath("quote"),
    ]);
    const representativePageContracts = [
      { path: "", isMdx: false },
      { path: "/blog", isMdx: false },
      { path: "/capabilities", isMdx: true },
      { path: "/how-it-works", isMdx: true },
      { path: "/products", isMdx: false },
      { path: "/about", isMdx: true },
      { path: "/custom-project-support", isMdx: true },
    ] as const;

    for (const pagePath of SINGLE_SITE_PUBLIC_STATIC_PAGES) {
      expect(isMdxDrivenPage(pagePath)).toBe(!nonMdxPages.has(pagePath));
    }

    for (const { path, isMdx } of representativePageContracts) {
      expect(isMdxDrivenPage(path)).toBe(isMdx);
    }

    expect(SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES).toContain("customProject");
    expect(isMdxDrivenPage(getCanonicalPath("customProject"))).toBe(true);
    expect(SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES).toContain("blog");
    expect(isMdxDrivenPage(getCanonicalPath("blog"))).toBe(false);
    expect(SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES).toContain("capabilities");
    expect(SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES).toContain("howItWorks");
  });

  it("loads the latest MDX updatedAt across content-backed locales for route-derived paths", async () => {
    mockGetContentEntry.mockImplementation(
      (type: string, locale: string, slug: string) => ({
        type,
        locale,
        slug,
        extension: ".mdx",
        filePath: `/content/pages/${locale}/${slug}.mdx`,
        relativePath: `content/pages/${locale}/${slug}.mdx`,
        metadata: {
          publishedAt: "2026-01-01T00:00:00Z",
          updatedAt:
            locale === "zh"
              ? "2026-04-20T00:00:00Z"
              : "2026-04-01T00:00:00Z",
        },
        content: "",
      }),
    );

    const lastModified = await getMdxPageLastModified(
      getCanonicalPath("about"),
    );

    expect(lastModified).toEqual(new Date("2026-04-20T00:00:00Z"));
    expect(mockGetContentEntry).toHaveBeenCalledWith("pages", "en", "about");
    expect(mockGetContentEntry).toHaveBeenCalledWith("pages", "zh", "about");
    expect(mockGetContentEntry).not.toHaveBeenCalledWith(
      "pages",
      "es",
      "about",
    );
    expect(mockLoggerWarn).not.toHaveBeenCalled();
  });

  it("does not warn for Spanish MDX pages that are intentionally deferred", async () => {
    mockGetContentEntry.mockImplementation(
      (type: string, locale: string, slug: string) => {
        if (locale === "es") {
          return undefined;
        }

        return {
          type,
          locale,
          slug,
          extension: ".mdx",
          filePath: `/content/pages/${locale}/${slug}.mdx`,
          relativePath: `content/pages/${locale}/${slug}.mdx`,
          metadata: {
            publishedAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-04-01T00:00:00Z",
          },
          content: "",
        };
      },
    );

    await expect(
      getMdxPageLastModified(getCanonicalPath("about")),
    ).resolves.toEqual(new Date("2026-04-01T00:00:00Z"));

    expect(mockGetContentEntry).not.toHaveBeenCalledWith(
      "pages",
      "es",
      "about",
    );
    expect(mockLoggerWarn).not.toHaveBeenCalled();
  });

  it("rejects paths that are not mapped from a static route id", async () => {
    await expect(getMdxPageLastModified("/unknown")).rejects.toThrow(
      "No MDX slug mapping for path: /unknown",
    );
  });
});
