import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const REQUIRED_SURFACES = [
  "src/config/single-site.ts",
  "src/config/single-site-seo.ts",
  "src/config/single-site-navigation.ts",
  "src/config/single-site-links.ts",
  "src/config/single-site-page-expression.ts",
  "src/config/single-site-product-catalog.ts",
  "src/constants/product-specs/**",
  "content/pages/{locale}/*.mdx",
  "messages/{locale}/critical.json",
  "messages/{locale}/deferred.json",
  "public/images/**",
] as const;

const REQUIRED_GROUPS = [
  "brand-identity",
  "seo-crawl-indexing",
  "navigation-links",
  "page-expression",
  "product-catalog",
  "page-content",
  "i18n-ui-copy",
  "assets",
  "deployment-runtime",
] as const;

describe("replacement surface index", () => {
  it("keeps a dedicated executable index linked from adopter-facing docs", () => {
    const hasIndex = existsSync("docs/website/replacement-surface-index.md");
    const readme = readFileSync("docs/website/README.md", "utf8");
    const checklist = readFileSync("docs/website/新项目替换清单.md", "utf8");
    const truthSources = readFileSync("docs/website/配置真相源.md", "utf8");

    expect(hasIndex).toBe(true);
    expect(readme).toContain("replacement-surface-index.md");
    expect(checklist).toContain("replacement-surface-index.md");
    expect(truthSources).toContain("replacement-surface-index.md");
  });

  it("lists the required launch replacement surfaces by stable group", () => {
    const hasIndex = existsSync("docs/website/replacement-surface-index.md");
    const index = hasIndex
      ? readFileSync("docs/website/replacement-surface-index.md", "utf8")
      : "";

    expect(index).toContain("must-replace");
    expect(index).toContain("review-or-tune");
    expect(index).toContain("do-not-edit-first");

    for (const group of REQUIRED_GROUPS) {
      expect(index).toContain(group);
    }

    for (const surface of REQUIRED_SURFACES) {
      expect(index).toContain(surface);
    }
  });

  it("warns against editing compatibility wrappers or generated content first", () => {
    const hasIndex = existsSync("docs/website/replacement-surface-index.md");
    const index = hasIndex
      ? readFileSync("docs/website/replacement-surface-index.md", "utf8")
      : "";

    expect(index).toContain("src/config/paths/site-config.ts");
    expect(index).toContain("src/constants/product-catalog.ts");
    expect(index).toContain("src/lib/content-manifest.generated.ts");
    expect(index).toContain("src/lib/mdx-importers.generated.ts");
  });
});
