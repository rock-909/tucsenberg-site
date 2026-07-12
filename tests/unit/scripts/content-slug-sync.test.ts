/* eslint-disable security/detect-non-literal-fs-filename -- test creates isolated temp fixture files and moves temp dirs to trash */
import { spawn } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * Content Slug Sync CLI Integration Tests
 *
 * Tests for the CLI wrapper in scripts/starter-checks.js content-slugs
 * Focuses on CLI behavior using isolated temporary content fixtures:
 * - Help flag behavior
 * - Argument validation errors
 * - JSON report path behavior
 * - Strict frontmatter behavior
 *
 * Note: Exit code and content validation tests are covered by the
 * core exports in starter-checks.js. This file keeps CLI-specific checks
 * hermetic so they do not write to the real repo reports directory.
 */

const CLI_PATH = path.resolve(__dirname, "../../../scripts/starter-checks.js");
const TEMP_TRASH_ROOT = path.join(
  os.tmpdir(),
  "showcase-content-slug-cli-test-trash",
);

let tmpDir: string;

function moveTempDirToTrash(dir: string): void {
  if (!dir || !fs.existsSync(dir)) return;

  fs.mkdirSync(TEMP_TRASH_ROOT, { recursive: true });
  fs.renameSync(
    dir,
    path.join(TEMP_TRASH_ROOT, `${path.basename(dir)}-${Date.now()}`),
  );
}

interface SpawnResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

function createMdxFile(
  collection: string,
  locale: string,
  filename: string,
  frontmatter: Record<string, unknown>,
): string {
  const dir = path.join(tmpDir, "content", collection, locale);
  fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, filename);
  const yaml = Object.entries(frontmatter)
    .map(([key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const nested = Object.entries(value)
          .map(
            ([nestedKey, nestedValue]) =>
              `  ${nestedKey}: ${JSON.stringify(nestedValue)}`,
          )
          .join("\n");
        return `${key}:\n${nested}`;
      }

      return `${key}: ${JSON.stringify(value)}`;
    })
    .join("\n");

  fs.writeFileSync(filePath, `---\n${yaml}\n---\n\nTest content`);
  return filePath;
}

function createSlugPair(
  collection: string,
  filename: string,
  slug = path.basename(filename, ".mdx"),
): void {
  createMdxFile(collection, "en", filename, { slug });
  createMdxFile(collection, "zh", filename, { slug });
}

function createDefaultSlugFixtures(): void {
  for (const collection of ["posts", "pages", "products"]) {
    createSlugPair(collection, `${collection}-sample.mdx`);
  }
}

function createValidPageFrontmatter(ogImage = "/images/custom-about.jpg") {
  return {
    locale: "en",
    title: "About",
    description: "About page description",
    slug: "about",
    publishedAt: "2026-01-01",
    updatedAt: "2026-01-02",
    seo: {
      title: "About SEO",
      description: "About SEO description",
      ogImage,
    },
  };
}

function reportPath() {
  return path.join(tmpDir, "reports", "content-slug-sync-report.json");
}

/**
 * Execute CLI command and return result
 */
function runCLI(args: string[]): Promise<SpawnResult> {
  return new Promise((resolve) => {
    const proc = spawn("node", [CLI_PATH, "content-slugs", ...args], {
      cwd: tmpDir,
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

describe("content-slug-sync CLI", () => {
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "showcase-content-slug-cli-"),
    );
  });

  afterEach(() => {
    moveTempDirToTrash(tmpDir);
  });

  describe("help flag", () => {
    it("should display help with --help", async () => {
      const result = await runCLI(["--help"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("MDX Content Slug Sync Validator");
      expect(result.stdout).toContain("--json");
      expect(result.stdout).toContain("--collections");
      expect(result.stdout).toContain("--locales");
      expect(result.stdout).toContain("--strict-frontmatter");
    });

    it("should display help with -h", async () => {
      const result = await runCLI(["-h"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("MDX Content Slug Sync Validator");
    });

    it("should show usage examples", async () => {
      const result = await runCLI(["--help"]);

      expect(result.stdout).toContain(
        "node scripts/starter-checks.js content-slugs",
      );
      expect(result.stdout).toContain("--quiet");
    });
  });

  describe("argument validation", () => {
    it("should error when less than 2 locales specified", async () => {
      const result = await runCLI(["--locales=en"]);

      expect(result.code).toBe(1);
      // Error goes to stderr via console.error
      expect(result.stderr).toContain("At least 2 locales are required");
    });

    it("should error when no collections specified", async () => {
      const result = await runCLI(["--collections="]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("No collections specified");
    });

    it("should parse multiple collections", async () => {
      // This test verifies CLI runs with multiple collections
      // (will validate against real content, so we just check it doesn't error on parsing)
      const result = await runCLI(["--collections=posts,pages", "--help"]);

      expect(result.code).toBe(0);
    });

    it("should parse multiple locales", async () => {
      // Verify CLI doesn't error when multiple locales are specified
      const result = await runCLI(["--locales=en,zh,ja", "--help"]);

      expect(result.code).toBe(0);
    });
  });

  describe("runs against fixture content", () => {
    it("should run validation on fixture content", async () => {
      createDefaultSlugFixtures();

      const result = await runCLI([]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("MDX Slug Sync Validation");
    });

    it("should keep default validation independent from strict frontmatter failures", async () => {
      createMdxFile(
        "pages",
        "en",
        "about.mdx",
        createValidPageFrontmatter("/images/about-og.jpg"),
      );
      createMdxFile("pages", "zh", "about.mdx", {
        ...createValidPageFrontmatter("/images/about-og.jpg"),
        locale: "zh",
      });

      const result = await runCLI([]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("MDX Slug Sync Validation");
      expect(result.stdout).not.toContain("Frontmatter/SEO Contract");
    });

    it("should fail strict frontmatter validation on fixture starter OG images", async () => {
      createMdxFile(
        "pages",
        "en",
        "about.mdx",
        createValidPageFrontmatter("/images/about-og.jpg"),
      );
      createMdxFile("pages", "zh", "about.mdx", {
        ...createValidPageFrontmatter("/images/about-og.jpg"),
        locale: "zh",
      });

      const result = await runCLI(["--strict-frontmatter"]);

      expect(result.code).toBe(1);
      expect(result.stdout).toContain("Frontmatter/SEO Contract Validation");
      expect(result.stdout).toContain("Starter OG Images");
    });

    it("should pass strict frontmatter validation on fixture project OG images", async () => {
      createMdxFile("pages", "en", "about.mdx", createValidPageFrontmatter());
      createMdxFile("pages", "zh", "about.mdx", {
        ...createValidPageFrontmatter(),
        locale: "zh",
      });

      const result = await runCLI(["--strict-frontmatter"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Frontmatter/SEO Contract Validation");
      expect(result.stdout).toContain(
        "All frontmatter/SEO contract validations passed.",
      );
    });

    it("should preserve --json report output path and payload", async () => {
      createDefaultSlugFixtures();

      const result = await runCLI(["--json"]);

      expect(result.stdout).toContain("JSON report saved to:");
      expect(result.stdout).toContain(
        path.join("reports", "content-slug-sync-report.json"),
      );
      expect(fs.existsSync(reportPath())).toBe(true);

      const report = JSON.parse(fs.readFileSync(reportPath(), "utf8")) as {
        ok: boolean;
        timestamp: string;
        tool: string;
        version: string;
        checkedCollections: string[];
        checkedLocales: string[];
        issues: unknown[];
      };

      expect(report.tool).toBe("content-slug-sync");
      expect(report.version).toBe("1.0.0");
      expect(Number.isNaN(Date.parse(report.timestamp))).toBe(false);
      expect(report.checkedCollections).toEqual(["pages"]);
      expect(report.checkedLocales).toEqual(["en"]);
      expect(typeof report.ok).toBe("boolean");
      expect(Array.isArray(report.issues)).toBe(true);
      expect(result.code).toBe(report.ok ? 0 : 1);
    });

    it("should preserve legacy report fields when strict frontmatter writes json", async () => {
      createMdxFile(
        "pages",
        "en",
        "about.mdx",
        createValidPageFrontmatter("/images/about-og.jpg"),
      );
      createMdxFile("pages", "zh", "about.mdx", {
        ...createValidPageFrontmatter("/images/about-og.jpg"),
        locale: "zh",
      });

      const result = await runCLI(["--json", "--strict-frontmatter"]);

      expect(result.code).toBe(1);
      expect(result.stdout).toContain("JSON report saved to:");
      expect(fs.existsSync(reportPath())).toBe(true);

      const report = JSON.parse(fs.readFileSync(reportPath(), "utf8")) as {
        issues: unknown[];
        stats?: Record<string, unknown>;
        slugSync?: unknown;
        frontmatterContract?: {
          stats?: {
            starterOgImages?: number;
          };
        };
      };

      expect(Array.isArray(report.issues)).toBe(true);
      expect(report.stats).toBeDefined();
      expect(report.slugSync).toBeDefined();
      expect(report.frontmatterContract).toBeDefined();
      expect(
        report.frontmatterContract?.stats?.starterOgImages,
      ).toBeGreaterThan(0);
    });

    it("should support quiet mode", async () => {
      createDefaultSlugFixtures();

      const normalResult = await runCLI([]);
      const quietResult = await runCLI(["--quiet"]);

      // Both should complete
      expect(normalResult.code).toBeDefined();
      expect(quietResult.code).toBeDefined();

      // Quiet mode should have less or equal output
      expect(quietResult.stdout.length).toBeLessThanOrEqual(
        normalResult.stdout.length,
      );
    });
  });
});
