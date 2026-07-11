import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { SITE_CONFIG } from "@/config/paths";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const RUNTIME_SOURCE_ROOTS = [
  "src/app",
  "src/components",
  "src/hooks",
  "src/lib",
];

const WEBSITE_CONFIG_PREFIX = "@/config/website";
const IMPORT_SPECIFIER_PATTERN =
  /(?:from\s+["']|import\s*[(]?\s*["']|require\s*[(]\s*["'])([^"']+)["']/gu;
const SITE_CONFIG_BRAND_ASSETS_PATTERN = /\bSITE_CONFIG\s*\.\s*brandAssets\b/u;

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
  it("keeps root agent project summaries aligned with Tucsenberg", () => {
    const instructionFiles = ["AGENTS.md", "CLAUDE.md"] as const;
    const staleProjectMarkers = [
      "**Showcase Website Starter** - reusable website starter for company, product, or service presentation.",
      "This is a starter project, not a finished client website. Keep examples generic and replaceable.",
    ] as const;
    const requiredProjectMarkers = [
      "**tucsenberg-site** - derived English B2B website for Tucsenberg flood barrier products.",
      "It is not a generic starter anymore.",
    ] as const;

    for (const instructionFile of instructionFiles) {
      const source = read(instructionFile);

      for (const staleMarker of staleProjectMarkers) {
        expect(
          source,
          `${instructionFile} should not present the derived site as a reusable starter`,
        ).not.toContain(staleMarker);
      }

      for (const requiredMarker of requiredProjectMarkers) {
        expect(
          source,
          `${instructionFile} should state current Tucsenberg project truth`,
        ).toContain(requiredMarker);
      }
    }
  });

  it("keeps root agent structure maps aligned with existing source directories", () => {
    const instructionFiles = ["AGENTS.md", "CLAUDE.md"] as const;
    const staleStructureEntries = [
      "config/website/",
      "services/",
      "styles/",
      "templates/",
      "test/, testing/",
      "content/pages/zh",
      "messages/en/, zh/",
    ] as const;
    const requiredStructureEntries = [
      "config/             # Runtime config and starter replacement surfaces",
      "test/               # Source-level test helpers",
      "- base/                       # Base physical message packs",
      "- profiles/b2b-lead/          # Fixed lead-form message ownership layer",
      "- profiles/catalog/           # Fixed catalog message ownership layer",
      "- en/                         # Generated compatibility message JSON",
    ] as const;

    for (const instructionFile of instructionFiles) {
      const source = read(instructionFile);

      for (const staleEntry of staleStructureEntries) {
        expect(
          source,
          `${instructionFile} should not list ${staleEntry}`,
        ).not.toContain(staleEntry);
      }

      for (const requiredEntry of requiredStructureEntries) {
        expect(
          source,
          `${instructionFile} should list ${requiredEntry}`,
        ).toContain(requiredEntry);
      }
    }
  });

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

  it("keeps brand asset facts out of the SITE_CONFIG runtime facade", () => {
    const runtimeConfig = SITE_CONFIG as Record<string, unknown>;

    expect(Object.hasOwn(runtimeConfig, "brandAssets")).toBe(false);
  });

  it("keeps runtime source from reading brand assets through SITE_CONFIG", () => {
    const offenders: string[] = [];

    for (const root of RUNTIME_SOURCE_ROOTS) {
      for (const repoPath of walkSourceFiles(root)) {
        const source = read(repoPath);

        if (SITE_CONFIG_BRAND_ASSETS_PATTERN.test(source)) {
          offenders.push(repoPath);
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
