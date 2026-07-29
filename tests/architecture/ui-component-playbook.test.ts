import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// 这个文件以前有五条断言，四条守的是文档长什么样：必须保留十个指定章节、
// checklist 必须逐字列出 registry 的每个字段、必须被两份文档引用、backlog 不许
// 列已发布的 wrapper（而那个 backlog 是空的）。2026-07-26 全部退役——它们守的是
// 措辞和结构，不是组件行为，改文档时红，红了照着改回去。
//
// 留下的是唯一一条能独立变红且红得有意义的：文档里写的 .md 引用必须真的能解析。
// 断链会把 agent 送到不存在的文件，而单纯 toContain("某某.md") 在死链上照样过。
const LINK_CHECKED_DOCS = [
  { name: "docs 入口", path: "docs/README.md", siblingDir: "docs" },
  {
    name: "组件治理",
    path: "docs/design/组件治理.md",
    siblingDir: "docs/design",
  },
] as const;

function readText(filePath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads fixed repo docs by relative path
  return readFileSync(filePath, "utf8");
}

function collectDocFilenames(dir: string): string[] {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- walk is rooted at the fixed docs/ tree
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? collectDocFilenames(join(dir, entry.name))
      : [entry.name],
  );
}

// Bare filenames are written relative to whatever directory the surrounding row
// is talking about, so they resolve against the doc tree by name.
function getUnresolvedMarkdownReferences(
  markdown: string,
  siblingDir: string,
): { referenced: string[]; missing: string[] } {
  const docFilenames = new Set(collectDocFilenames("docs"));
  const referenced = [...markdown.matchAll(/`([\w./一-鿿-]+\.md)`/gu)].map(
    (match) => match[1]!,
  );
  const missing = referenced.filter(
    (reference) =>
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- reference comes from a restricted character class in a repo-local doc
      !existsSync(reference) &&
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- sibling lookup for bare filenames written relative to the doc
      !existsSync(join(siblingDir, reference)) &&
      !(!reference.includes("/") && docFilenames.has(reference)),
  );

  return { referenced, missing };
}

describe("UI component playbook", () => {
  it.each(LINK_CHECKED_DOCS)(
    "routes readers on to files that still exist ($name)",
    ({ path, siblingDir }) => {
      const { referenced, missing } = getUnresolvedMarkdownReferences(
        readText(path),
        siblingDir,
      );

      // 没有引用就不是"全部有效"，是解析器坏了。
      expect(referenced.length).toBeGreaterThan(0);
      expect(missing).toEqual([]);
    },
  );
});
