import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("config facade replacement boundary", () => {
  it("keeps authoring truth separate from runtime/query facades", () => {
    const replacementIndex = readFileSync(
      "docs/website/replacement-surface-index.md",
      "utf8",
    );
    const truthSources = readFileSync("docs/website/配置真相源.md", "utf8");
    const docs = `${replacementIndex}\n${truthSources}`;

    expect(docs).toContain("src/config/single-site.ts");
    expect(docs).toContain("src/config/single-site-product-catalog.ts");
    expect(docs).toContain("src/constants/product-specs/**");

    expect(docs).toContain("src/config/paths/site-config.ts");
    expect(docs).toContain("runtime/validation facade");
    expect(docs).toContain("src/constants/product-catalog.ts");
    expect(docs).toContain("query facade");
    expect(docs).toContain("do-not-edit-first");
  });

  it("does not describe runtime facades as the first replacement truth", () => {
    const index = readFileSync(
      "docs/website/replacement-surface-index.md",
      "utf8",
    );

    expect(index).not.toContain(
      "src/config/paths/site-config.ts`：兼容 wrapper",
    );
    expect(index).not.toContain(
      "src/constants/product-catalog.ts`：兼容 wrapper",
    );
    expect(index).not.toContain("当前等于 `SINGLE_SITE_CONFIG`");
    expect(index).not.toContain("当前等于 `SINGLE_SITE_PRODUCT_CATALOG`");
  });
});
