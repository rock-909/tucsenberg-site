import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CONTENT_MANIFEST } from "@/lib/content-manifest.generated";

const RUNTIME_FILES = [
  "src/lib/content-manifest.ts",
  "src/lib/content-query/queries.ts",
  "src/lib/content/page-dates.ts",
  "src/lib/content/legal-page.ts",
  "src/app/[locale]/static-mdx-page.tsx",
] as const;

const FORBIDDEN_RUNTIME_IMPORTS = [
  "node:fs",
  "fs",
  "node:path",
  "path",
  "gray-matter",
  "glob",
  "fast-glob",
  "@/lib/content-parser",
  "@/lib/content-utils",
] as const;

function readSource(relativePath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads fixed repo-local runtime files from the allowlist above
  return readFileSync(relativePath, "utf8");
}

describe("MDX manifest-only runtime contract", () => {
  it("keeps runtime content loading free of filesystem and parser imports", () => {
    for (const file of RUNTIME_FILES) {
      const source = readSource(file);

      for (const forbidden of FORBIDDEN_RUNTIME_IMPORTS) {
        expect(source).not.toContain(`from "${forbidden}"`);
        expect(source).not.toContain(`from '${forbidden}'`);
        expect(source).not.toContain(`require("${forbidden}")`);
        expect(source).not.toContain(`require('${forbidden}')`);
      }
    }
  });

  it("loads static page bodies through manifest string content and the static markdown renderer", () => {
    expect(readSource("src/lib/content-manifest.ts")).toContain(
      "./content-manifest.generated",
    );
    expect(readSource("src/lib/content-query/queries.ts")).toContain(
      "@/lib/content-manifest",
    );
    expect(readSource("src/lib/content/page-dates.ts")).toContain(
      "@/lib/content-manifest",
    );
    expect(readSource("src/lib/content/legal-page.ts")).toContain(
      "@/lib/content-query/queries",
    );
    expect(readSource("src/lib/content/legal-page.ts")).toContain(
      "render-static-markdown-content",
    );
    expect(readSource("src/app/[locale]/static-mdx-page.tsx")).toContain(
      "loadLegalPage",
    );
    expect(readSource("src/lib/content/render-legal-content.tsx")).toContain(
      "render-static-markdown-content",
    );
  });

  // 这里以前还有一条,断言生成的清单里不出现 `showcase-full/...capabilities.mdx`
  // 和几个退役页的 `@content/...` 路径。那是负空间守卫:锁的是几个已经删掉的名字
  // 保持缺席,永远为真。下面这条覆盖同一个意图,而且更强——它要求每一项都真的
  // 落在 content/ 下并且文件存在,不管它叫什么名字。
  it("keeps the generated manifest catalog-only", () => {
    expect(CONTENT_MANIFEST.entries.length).toBeGreaterThan(0);

    const offenders = CONTENT_MANIFEST.entries.filter(
      (entry) =>
        entry.source !== "active-content" ||
        !entry.filePath.startsWith("/content/") ||
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- path comes from the generated manifest and is already constrained to /content/ above
        !existsSync(join(process.cwd(), entry.filePath)),
    );

    expect(offenders.map((entry) => entry.filePath)).toEqual([]);
  });
});
