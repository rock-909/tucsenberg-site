import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const RUNTIME_SOURCE_ROOTS = [
  "src/app",
  "src/components",
  "src/hooks",
  "src/lib",
  "src/services",
  "src/templates",
];

const WEBSITE_CONFIG_PREFIX = "@/config/website";
const IMPORT_SPECIFIER_PATTERN =
  /(?:from\s+["']|import\s*[(]?\s*["']|require\s*[(]\s*["'])([^"']+)["']/gu;

function read(repoPath: string) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads repo-local files from fixed scan roots
  return readFileSync(repoPath, "utf8");
}

function walkSourceFiles(dir: string, results: string[] = []) {
  let entries: ReturnType<typeof readdirSync>;

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test recursively scans fixed repo-local runtime roots
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return results;
    }

    throw error;
  }

  for (const entry of entries) {
    const absolutePath = join(dir, entry.name);

    if (entry.isDirectory()) {
      walkSourceFiles(absolutePath, results);
      continue;
    }

    if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name))) {
      results.push(relative(process.cwd(), absolutePath).split(sep).join("/"));
    }
  }

  return results;
}

function findWebsiteConfigImports(source: string) {
  const specifiers: string[] = [];

  for (const match of source.matchAll(IMPORT_SPECIFIER_PATTERN)) {
    const specifier = match[1];

    if (
      specifier === WEBSITE_CONFIG_PREFIX ||
      specifier.startsWith(`${WEBSITE_CONFIG_PREFIX}/`)
    ) {
      specifiers.push(specifier);
    }
  }

  return specifiers;
}

describe("website config runtime boundary", () => {
  it("keeps replacement website config out of runtime app dependencies", () => {
    const offenders: string[] = [];

    for (const root of RUNTIME_SOURCE_ROOTS) {
      for (const repoPath of walkSourceFiles(root)) {
        const source = read(repoPath);
        const imports = findWebsiteConfigImports(source);

        for (const specifier of imports) {
          offenders.push(`${repoPath} -> ${specifier}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("catches direct, nested, dynamic, and require imports", () => {
    const examples = [
      'import { websiteProfile } from "@/config/website";',
      'import { websiteProfile } from "@/config/website/profile";',
      'export { websiteProfile } from "@/config/website/profile";',
      'await import("@/config/website/profile");',
      'require("@/config/website/profile");',
    ];

    for (const source of examples) {
      const matches = findWebsiteConfigImports(source);

      expect(matches).toHaveLength(1);
    }
  });
});
