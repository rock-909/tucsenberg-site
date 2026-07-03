import { readFileSync } from "node:fs";
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
import { CONTENT_MANIFEST } from "@/lib/content-manifest.generated";

const { mockGetContentEntry, mockLoggerWarn } = vi.hoisted(() => ({
  mockGetContentEntry: vi.fn(),
  mockLoggerWarn: vi.fn(),
}));

vi.mock("@/lib/content-manifest", () => ({
  resolveOptionalContentEntry: mockGetContentEntry,
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
      getCanonicalPath("resources"),
    ]);
    const representativePageContracts = [
      { path: "", isMdx: false },
      { path: "/about", isMdx: true },
      { path: "/contact", isMdx: true },
      { path: "/privacy", isMdx: true },
      { path: "/terms", isMdx: true },
      { path: "/blog", isMdx: false },
      { path: "/resources", isMdx: false },
      { path: "/capabilities", isMdx: true },
      { path: "/how-it-works", isMdx: true },
      { path: "/products", isMdx: false },
      { path: "/custom-project-support", isMdx: true },
    ] as const;

    for (const pagePath of SINGLE_SITE_PUBLIC_STATIC_PAGES) {
      expect(isMdxDrivenPage(pagePath)).toBe(!nonMdxPages.has(pagePath));
    }

    for (const { path, isMdx } of representativePageContracts) {
      expect(isMdxDrivenPage(path)).toBe(isMdx);
    }

    expect(SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES).toEqual([
      "home",
      "about",
      "products",
      "blog",
      "resources",
      "contact",
      "privacy",
      "terms",
    ]);
    expect(SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES).not.toContain("customProject");
    expect(SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES).not.toContain("capabilities");
    expect(SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES).not.toContain("howItWorks");
  });

  it("loads the latest MDX updatedAt across locales for route-derived paths", async () => {
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
  });

  it("rejects paths that are not mapped from a static route id", async () => {
    await expect(getMdxPageLastModified("/unknown")).rejects.toThrow(
      "No MDX slug mapping for path: /unknown",
    );
  });

  it("keeps legal page frontmatter dates aligned with visible updated dates", () => {
    const legalFiles = [
      "content/pages/en/privacy.mdx",
      "content/pages/en/terms.mdx",
      "content/pages/zh/privacy.mdx",
      "content/pages/zh/terms.mdx",
    ];

    for (const filePath of legalFiles) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- test iterates fixed legal MDX fixture paths
      const source = readFileSync(filePath, "utf8");
      const updatedAt = source.match(/updatedAt: ['"]([^'"]+)['"]/u)?.[1];
      const body = source.split("---").slice(2).join("---");

      expect(updatedAt, filePath).toBeTruthy();
      expect(body, filePath).toContain(updatedAt);
    }
  });

  it("keeps generated legal page content aligned with metadata updatedAt", () => {
    const legalPages = [
      { locale: "en", slug: "privacy" },
      { locale: "en", slug: "terms" },
      { locale: "zh", slug: "privacy" },
      { locale: "zh", slug: "terms" },
    ] as const;

    for (const { locale, slug } of legalPages) {
      const entry = CONTENT_MANIFEST.byKey[`pages/${locale}/${slug}`];
      const updatedAt = entry?.metadata.updatedAt;

      expect(entry, `${locale}/${slug}`).toBeDefined();
      expect(updatedAt, `${locale}/${slug}`).toEqual(expect.any(String));
      expect(entry?.content, `${locale}/${slug}`).toContain(updatedAt);
    }
  });
});
