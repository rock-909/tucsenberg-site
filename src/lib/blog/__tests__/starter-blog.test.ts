import { describe, expect, it } from "vitest";
import {
  getStarterBlogArticle,
  getStarterBlogArticles,
} from "@/lib/blog/starter-blog";

describe("starter blog content", () => {
  it("provides launch education articles in all runtime locales", () => {
    const enArticles = getStarterBlogArticles("en");
    const esArticles = getStarterBlogArticles("es");
    const zhArticles = getStarterBlogArticles("zh");

    expect(enArticles).toHaveLength(4);
    expect(esArticles).toHaveLength(4);
    expect(zhArticles).toHaveLength(4);
    expect(enArticles.map((article) => article.slug)).toEqual(
      esArticles.map((article) => article.slug),
    );
    expect(enArticles.map((article) => article.slug)).toEqual(
      zhArticles.map((article) => article.slug),
    );
    expect(enArticles[0]?.title).toContain("launch");
    expect(esArticles[0]?.title).toContain("launch");
    expect(zhArticles[0]?.title).toContain("上线");
  });

  it("loads a single article by slug", () => {
    const article = getStarterBlogArticle("en", "prepare-before-launch");

    expect(article.title).toBe(
      "What to prepare before launching your first showcase website",
    );
    expect(article.sections).toHaveLength(4);
  });

  it("throws for unknown slugs", () => {
    expect(() => getStarterBlogArticle("en", "missing")).toThrow(
      "Unknown starter blog article: missing",
    );
  });
});
