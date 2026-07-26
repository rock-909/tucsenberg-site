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
  // 保持缺席,永远为真。换成下面两条——一条管导出的每一项,一条管这个文件往
  // 模块图里拉了什么,都不点名任何一个具体的退役页。
  it("keeps the generated manifest catalog-only", () => {
    expect(CONTENT_MANIFEST.entries.length).toBeGreaterThan(0);

    const offenders = CONTENT_MANIFEST.entries.filter(
      (entry) =>
        entry.source !== "active-content" ||
        !entry.filePath.startsWith("/content/") ||
        !entry.relativePath.startsWith("content/") ||
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- path comes from the generated manifest and is already constrained to /content/ above
        !existsSync(join(process.cwd(), entry.filePath)) ||
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- same, constrained to content/ above
        !existsSync(join(process.cwd(), entry.relativePath)),
    );

    expect(offenders.map((entry) => entry.filePath)).toEqual([]);
  });

  // 检查导出的 entries 还不够:生成器完全可以在 entries 之外多写一个静态 import,
  // 导出的每一项照样干净,而 bundler 已经把那份 MDX 拉进模块图了。整个 manifest
  // 的存在理由就是运行时不碰 MDX——所以这里守的是"这个文件不 import 任何 .mdx",
  // 而不是某几个退役文件名缺席。
  it("pulls no MDX into the module graph", () => {
    const manifestSource = readSource("src/lib/content-manifest.generated.ts");

    expect(manifestSource).not.toMatch(/from\s+["'][^"']*\.mdx["']/u);
    expect(manifestSource).not.toMatch(/import\s*\(\s*["'][^"']*\.mdx["']/u);
    expect(manifestSource).not.toMatch(/require\s*\(\s*["'][^"']*\.mdx["']/u);
  });
});
