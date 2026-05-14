import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CONTENT_PAGES_DIR = join(process.cwd(), "content", "pages");

const FORBIDDEN_PLACEHOLDERS = [
  "Example Showcase Company",
  "示例展示型公司",
  "sales@example.com",
  "Example Business Park",
  "Example City",
  "[Company Name]",
  "[company-domain]",
  "[Company Address]",
  "[Company Phone]",
  "[PROJECT_NAME]",
  "[EU Representative Contact]",
  "[公司名称]",
  "[公司域名]",
  "[公司地址]",
  "[公司电话]",
  "[欧盟代表联系方式]",
] as const;

function collectMdxFiles(dir: string): string[] {
  // Test-only scanner: directory is anchored to the repo's static content/pages root.
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test scanner is constrained to the static content/pages root.
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return collectMdxFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".mdx") ? [fullPath] : [];
  });
}

describe("content page placeholder guard", () => {
  it("does not ship unresolved brand placeholders in content/pages", () => {
    const failures = collectMdxFiles(CONTENT_PAGES_DIR).flatMap((filePath) => {
      // File paths come from collectMdxFiles under the static content/pages root.
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- File paths come from collectMdxFiles under content/pages.
      const content = readFileSync(filePath, "utf8");
      return FORBIDDEN_PLACEHOLDERS.filter((placeholder) =>
        content.includes(placeholder),
      ).map((placeholder) => `${filePath}: ${placeholder}`);
    });

    expect(failures).toEqual([]);
  });
});
