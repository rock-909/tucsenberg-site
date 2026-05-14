import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPageBySlug } from "../queries";

const { mockGetContentEntry } = vi.hoisted(() => ({
  mockGetContentEntry: vi.fn(),
}));

vi.mock("@/lib/content-manifest", () => ({
  getContentEntry: mockGetContentEntry,
}));

describe("content-query manifest runtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads pages directly from the generated content manifest", async () => {
    mockGetContentEntry.mockReturnValue({
      type: "pages",
      locale: "en",
      slug: "about",
      extension: ".mdx",
      filePath: "/content/pages/en/about.mdx",
      relativePath: "content/pages/en/about.mdx",
      metadata: {
        title: "About",
        description: "About page",
        slug: "about",
        publishedAt: "2026-01-01",
        updatedAt: "2026-01-02",
      },
      content: "## About",
    });

    const page = await getPageBySlug("about", "en");

    expect(mockGetContentEntry).toHaveBeenCalledWith("pages", "en", "about");
    expect(page).toEqual({
      slug: "about",
      metadata: {
        title: "About",
        description: "About page",
        slug: "about",
        publishedAt: "2026-01-01",
        updatedAt: "2026-01-02",
      },
      content: "## About",
      filePath: "/content/pages/en/about.mdx",
    });
  });

  it("falls Spanish MDX-backed pages back to English content during Step 2", async () => {
    mockGetContentEntry.mockImplementation(
      (type: string, locale: string, slug: string) => {
        if (locale === "es") return undefined;
        if (locale !== "en") return undefined;

        return {
          type,
          locale,
          slug,
          extension: ".mdx",
          filePath: `/content/pages/${locale}/${slug}.mdx`,
          relativePath: `content/pages/${locale}/${slug}.mdx`,
          metadata: {
            title: "About",
            description: "About page",
            slug,
            publishedAt: "2026-01-01",
          },
          content: "## About",
        };
      },
    );

    const page = await getPageBySlug("about", "es");

    expect(mockGetContentEntry).toHaveBeenNthCalledWith(
      1,
      "pages",
      "es",
      "about",
    );
    expect(mockGetContentEntry).toHaveBeenNthCalledWith(
      2,
      "pages",
      "en",
      "about",
    );
    expect(page.filePath).toBe("/content/pages/en/about.mdx");
    expect(page.metadata.title).toBe("About");
  });

  it("throws the existing content-not-found message when a manifest entry is missing", async () => {
    mockGetContentEntry.mockReturnValue(undefined);

    await expect(getPageBySlug("missing", "en")).rejects.toThrow(
      "Content not found: missing",
    );
  });
});
