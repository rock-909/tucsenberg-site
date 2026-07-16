/* eslint-disable security/detect-non-literal-fs-filename -- test creates temp dirs with dynamic names for fixture isolation */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { captureExpectedConsoleErrors } from "@/test/console";

/**
 * Content Slug Sync Core Logic Tests
 *
 * Tests for the focused content-slugs module core validation logic.
 * Uses temporary directories to avoid dependency on real content files.
 *
 * Coverage:
 * - missing_pair: File exists in one locale but not the other
 * - slug_mismatch: Files exist in both locales but slugs differ
 * - parse_error: Frontmatter.slug is missing or malformed
 * - success: All files properly paired with matching slugs
 */

// Import the focused module under test.
const {
  buildKey,
  collectPairs,
  parseContentSlugArgs,
  parseFrontmatter,
  runContentSlugCheck,
  validateContentFrontmatterContract,
  validateCollectionPair,
  validateMdxSlugSync,
  writeContentSlugJsonReport,
} = require("../../../scripts/quality/checks/content-slugs.js");
const starterChecksFacade = require("../../../scripts/starter-checks.js");
const {
  createContentManifestContext,
  generateContentManifest,
  runContentManifestGenerator,
  writeFileAtomic,
} = starterChecksFacade;
const contentManifestModule = require("../../../scripts/quality/checks/content-manifest.js");

describe("content-slug-sync legacy facade", () => {
  it("keeps starter-checks exports wired to the focused module", () => {
    expect(starterChecksFacade.buildKey).toBe(buildKey);
    expect(starterChecksFacade.collectPairs).toBe(collectPairs);
    expect(starterChecksFacade.parseArgs).toBe(parseContentSlugArgs);
    expect(starterChecksFacade.parseFrontmatter).toBe(parseFrontmatter);
    expect(starterChecksFacade.runContentSlugCheck).toBe(runContentSlugCheck);
    expect(starterChecksFacade.validateContentFrontmatterContract).toBe(
      validateContentFrontmatterContract,
    );
    expect(starterChecksFacade.validateCollectionPair).toBe(
      validateCollectionPair,
    );
    expect(starterChecksFacade.validateMdxSlugSync).toBe(validateMdxSlugSync);
  });

  it("exports content manifest helpers for generator contract tests", () => {
    expect(starterChecksFacade.createContentManifestContext).toBeTypeOf(
      "function",
    );
    expect(starterChecksFacade.generateContentManifest).toBeTypeOf("function");
    expect(starterChecksFacade.writeFileAtomic).toBeTypeOf("function");
  });

  it("keeps content manifest helpers wired to the focused module", () => {
    expect(starterChecksFacade.createContentManifestContext).toBe(
      contentManifestModule.createContentManifestContext,
    );
    expect(starterChecksFacade.generateContentManifest).toBe(
      contentManifestModule.generateContentManifest,
    );
    expect(starterChecksFacade.runContentManifestGenerator).toBe(
      contentManifestModule.runContentManifestGenerator,
    );
    expect(starterChecksFacade.writeFileAtomic).toBe(
      contentManifestModule.writeFileAtomic,
    );
  });

  it("keeps report output out of the default freshness contract", () => {
    const context = createContentManifestContext("/tmp/starter-project");

    expect("reportOutput" in context).toBe(false);
  });
});

interface SlugSyncIssue {
  type: "missing_pair" | "slug_mismatch" | "parse_error";
  collection: string;
  baseLocale: string;
  targetLocale: string;
  basePath?: string;
  targetPath?: string;
  baseSlug?: string;
  targetSlug?: string;
  message: string;
  error?: string;
}

interface SlugSyncResult {
  ok: boolean;
  checkedCollections: string[];
  checkedLocales: string[];
  issues: SlugSyncIssue[];
  stats: {
    totalFiles: number;
    totalPairs: number;
    missingPairs: number;
    slugMismatches: number;
    parseErrors: number;
  };
}

interface FrontmatterContractIssue {
  type:
    | "missing_field"
    | "invalid_field"
    | "missing_seo_field"
    | "starter_og_image";
  collection: string;
  locale: string;
  filePath: string;
  field: string;
  message: string;
}

interface FrontmatterContractResult {
  ok: boolean;
  issues: FrontmatterContractIssue[];
  stats: {
    totalFiles: number;
    missingFields: number;
    invalidFields: number;
    missingSeoFields: number;
    starterOgImages: number;
  };
}

describe("content-slug-sync core", () => {
  let tmpDir: string;
  const tempTrashRoot = path.join(
    os.tmpdir(),
    "showcase-mdx-slug-sync-test-trash",
  );

  function moveTempDirToTrash(dir: string): void {
    if (!dir || !fs.existsSync(dir)) return;

    fs.mkdirSync(tempTrashRoot, { recursive: true });
    const targetDir = path.join(
      tempTrashRoot,
      `${path.basename(dir)}-${Date.now()}`,
    );

    fs.renameSync(dir, targetDir);
  }

  beforeEach(() => {
    // Create a fresh temp directory for each test
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mdx-slug-sync-test-"));
  });

  afterEach(() => {
    moveTempDirToTrash(tmpDir);
  });

  /**
   * Helper to create MDX file with frontmatter
   */
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
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join("\n");

    fs.writeFileSync(filePath, `---\n${yaml}\n---\n\nTest content`);
    return filePath;
  }

  /**
   * Helper to create MDX file with raw content (for parse error tests)
   */
  function createRawMdxFile(
    collection: string,
    locale: string,
    filename: string,
    content: string,
  ): string {
    const dir = path.join(tmpDir, "content", collection, locale);
    fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, content);
    return filePath;
  }

  describe("buildKey", () => {
    it("should generate canonical key from file path", () => {
      const rootDir = "/root";
      const filePath = "/root/content/posts/en/foo.mdx";
      const key = buildKey(rootDir, filePath, "content", "posts", "en");
      expect(key).toBe("content/posts/foo.mdx");
    });

    it("should work with different collections", () => {
      const rootDir = "/any/path";
      const filePath = "/any/path/content/products/zh/bar.mdx";
      const key = buildKey(rootDir, filePath, "content", "products", "zh");
      expect(key).toBe("content/products/bar.mdx");
    });

    it("should support nested subdirectories", () => {
      const rootDir = "/project";
      const filePath =
        "/project/content/products/en/category/subcategory/item.mdx";
      const key = buildKey(rootDir, filePath, "content", "products", "en");
      expect(key).toBe("content/products/category/subcategory/item.mdx");
    });

    it("should normalize Windows-style paths to POSIX", () => {
      // Simulate path.relative returning Windows-style path
      const rootDir = tmpDir;
      const subDir = path.join(tmpDir, "content", "posts", "en", "blog");
      fs.mkdirSync(subDir, { recursive: true });
      const filePath = path.join(subDir, "test.mdx");
      fs.writeFileSync(filePath, "---\nslug: test\n---\n");

      const key = buildKey(rootDir, filePath, "content", "posts", "en");
      // Should use forward slashes regardless of platform
      expect(key).toBe("content/posts/blog/test.mdx");
      expect(key).not.toContain("\\");
    });
  });

  describe("parseFrontmatter", () => {
    it("should extract slug from valid frontmatter", () => {
      const filePath = createMdxFile("posts", "en", "test.mdx", {
        slug: "my-test-slug",
        title: "Test Title",
      });

      const result = parseFrontmatter(filePath);
      expect(result.slug).toBe("my-test-slug");
      expect(result.error).toBeNull();
    });

    it("should return error when slug is missing", () => {
      const filePath = createMdxFile("posts", "en", "no-slug.mdx", {
        title: "No Slug Here",
      });

      const result = parseFrontmatter(filePath);
      expect(result.slug).toBeNull();
      expect(result.error).toContain("missing");
    });

    it("should return error when file does not exist", () => {
      const result = parseFrontmatter("/nonexistent/file.mdx");
      expect(result.slug).toBeNull();
      expect(result.error).toContain("Failed to parse");
    });

    it("should return error for invalid frontmatter", () => {
      const filePath = createRawMdxFile(
        "posts",
        "en",
        "invalid.mdx",
        "No frontmatter here, just content",
      );

      const result = parseFrontmatter(filePath);
      expect(result.slug).toBeNull();
      expect(result.error).toContain("missing");
    });
  });

  describe("validateCollectionPair", () => {
    it("should detect missing_pair when zh file is missing", () => {
      createMdxFile("posts", "en", "only-en.mdx", { slug: "only-en" });

      const result = validateCollectionPair(
        tmpDir,
        "content",
        "posts",
        "en",
        "zh",
      );

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe("missing_pair");
      expect(result.issues[0].message).toContain("Missing zh");
    });

    it("should detect missing_pair when en file is missing", () => {
      createMdxFile("posts", "zh", "only-zh.mdx", { slug: "only-zh" });

      const result = validateCollectionPair(
        tmpDir,
        "content",
        "posts",
        "en",
        "zh",
      );

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe("missing_pair");
      expect(result.issues[0].message).toContain("Missing en");
    });

    it("should detect slug_mismatch when slugs differ", () => {
      createMdxFile("posts", "en", "article.mdx", { slug: "slug-en" });
      createMdxFile("posts", "zh", "article.mdx", { slug: "slug-zh" });

      const result = validateCollectionPair(
        tmpDir,
        "content",
        "posts",
        "en",
        "zh",
      );

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe("slug_mismatch");
      expect(result.issues[0].baseSlug).toBe("slug-en");
      expect(result.issues[0].targetSlug).toBe("slug-zh");
    });

    it("should detect parse_error when slug is missing", () => {
      createMdxFile("posts", "en", "no-slug.mdx", { title: "No slug" });
      createMdxFile("posts", "zh", "no-slug.mdx", { title: "No slug zh" });

      const result = validateCollectionPair(
        tmpDir,
        "content",
        "posts",
        "en",
        "zh",
      );

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe("parse_error");
    });

    it("should pass when files are properly paired with matching slugs", () => {
      createMdxFile("posts", "en", "valid.mdx", { slug: "valid-article" });
      createMdxFile("posts", "zh", "valid.mdx", { slug: "valid-article" });

      const result = validateCollectionPair(
        tmpDir,
        "content",
        "posts",
        "en",
        "zh",
      );

      expect(result.issues).toHaveLength(0);
      expect(result.pairCount).toBe(1);
    });

    it("returns slug issues in stable collection path order", () => {
      createMdxFile("posts", "en", "b-post.mdx", { slug: "b-en" });
      createMdxFile("posts", "zh", "b-post.mdx", { slug: "b-zh" });
      createMdxFile("posts", "en", "a-post.mdx", { slug: "a-en" });
      createMdxFile("posts", "zh", "a-post.mdx", { slug: "a-zh" });

      const result: SlugSyncResult = validateMdxSlugSync({
        rootDir: tmpDir,
        collections: ["posts"],
        locales: ["en", "zh"],
      });

      expect(
        result.issues.map((issue) => path.basename(issue.basePath ?? "")),
      ).toEqual(["a-post.mdx", "b-post.mdx"]);
    });
  });

  describe("validateContentFrontmatterContract", () => {
    function createValidPageFrontmatter(
      overrides: Record<string, unknown> = {},
    ): Record<string, unknown> {
      return {
        locale: "en",
        title: "About",
        description: "About page description",
        slug: "about",
        publishedAt: "2026-01-01",
        updatedAt: "2026-01-02",
        draft: false,
        lastReviewed: "2026-01-03",
        seo: {
          title: "About SEO",
          description: "About SEO description",
          ogImage: "/images/custom-about.jpg",
        },
        ...overrides,
      };
    }

    it("passes when required top-level frontmatter and seo fields are complete", () => {
      createMdxFile("pages", "en", "about.mdx", createValidPageFrontmatter());

      const result: FrontmatterContractResult =
        validateContentFrontmatterContract({
          rootDir: tmpDir,
          collections: ["pages"],
          locales: ["en"],
          strictFrontmatter: true,
        });

      expect(result.ok).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.stats.totalFiles).toBe(1);
    });

    it("reports missing_field when a required top-level field is absent", () => {
      const frontmatter = createValidPageFrontmatter();
      delete frontmatter.title;
      createMdxFile("pages", "en", "about.mdx", frontmatter);

      const result: FrontmatterContractResult =
        validateContentFrontmatterContract({
          rootDir: tmpDir,
          collections: ["pages"],
          locales: ["en"],
          strictFrontmatter: true,
        });

      expect(result.ok).toBe(false);
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "missing_field",
            field: "title",
          }),
        ]),
      );
      expect(result.stats.missingFields).toBe(1);
    });

    it("reports invalid_field for invalid locale, slug, date, and draft shapes", () => {
      createMdxFile(
        "pages",
        "en",
        "about.mdx",
        createValidPageFrontmatter({
          locale: "zh",
          slug: "not-about",
          publishedAt: "2026/01/01",
          updatedAt: "January 2, 2026",
          lastReviewed: "2026.01.03",
          draft: "false",
        }),
      );

      const result: FrontmatterContractResult =
        validateContentFrontmatterContract({
          rootDir: tmpDir,
          collections: ["pages"],
          locales: ["en"],
          strictFrontmatter: true,
        });

      expect(result.ok).toBe(false);
      expect(
        result.issues.filter((issue) => issue.type === "invalid_field"),
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "locale" }),
          expect.objectContaining({ field: "slug" }),
          expect.objectContaining({ field: "publishedAt" }),
          expect.objectContaining({ field: "updatedAt" }),
          expect.objectContaining({ field: "lastReviewed" }),
          expect.objectContaining({ field: "draft" }),
        ]),
      );
      expect(result.stats.invalidFields).toBe(6);
    });

    it("reports missing_seo_field when seo.title or seo.description is absent", () => {
      createMdxFile("pages", "en", "about.mdx", {
        ...createValidPageFrontmatter(),
        seo: {
          ogImage: "/images/custom-about.jpg",
        },
      });

      const result: FrontmatterContractResult =
        validateContentFrontmatterContract({
          rootDir: tmpDir,
          collections: ["pages"],
          locales: ["en"],
          strictFrontmatter: true,
        });

      expect(result.ok).toBe(false);
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "missing_seo_field",
            field: "seo.title",
          }),
          expect.objectContaining({
            type: "missing_seo_field",
            field: "seo.description",
          }),
        ]),
      );
      expect(result.stats.missingSeoFields).toBe(2);
    });

    it("reports starter_og_image for starter OG assets in strict mode", () => {
      createMdxFile("pages", "en", "about.mdx", {
        ...createValidPageFrontmatter(),
        seo: {
          title: "About SEO",
          description: "About SEO description",
          ogImage: "/images/about-og.jpg",
        },
      });

      const result: FrontmatterContractResult =
        validateContentFrontmatterContract({
          rootDir: tmpDir,
          collections: ["pages"],
          locales: ["en"],
          strictFrontmatter: true,
        });

      expect(result.ok).toBe(false);
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "starter_og_image",
            field: "seo.ogImage",
          }),
        ]),
      );
      expect(result.stats.starterOgImages).toBe(1);
    });

    it("passes strict mode when pages use project-specific OG images", () => {
      createMdxFile("pages", "en", "about.mdx", createValidPageFrontmatter());

      const result: FrontmatterContractResult =
        validateContentFrontmatterContract({
          rootDir: tmpDir,
          collections: ["pages"],
          locales: ["en"],
          strictFrontmatter: true,
        });

      expect(result.ok).toBe(true);
      expect(result.stats.starterOgImages).toBe(0);
    });
  });

  describe("writeContentSlugJsonReport", () => {
    it("writes JSON reports inside the provided root directory", () => {
      const result: SlugSyncResult = {
        ok: true,
        checkedCollections: ["pages"],
        checkedLocales: ["en", "zh"],
        issues: [],
        stats: {
          totalFiles: 0,
          totalPairs: 0,
          missingPairs: 0,
          slugMismatches: 0,
          parseErrors: 0,
        },
      };

      writeContentSlugJsonReport(result, tmpDir);

      const reportPath = path.join(
        tmpDir,
        "reports",
        "content-slug-sync-report.json",
      );
      expect(fs.existsSync(reportPath)).toBe(true);

      const report = JSON.parse(fs.readFileSync(reportPath, "utf8")) as {
        checkedCollections: string[];
        checkedLocales: string[];
        issues: unknown[];
      };
      expect(report.checkedCollections).toEqual(["pages"]);
      expect(report.checkedLocales).toEqual(["en", "zh"]);
      expect(report.issues).toEqual([]);
    });
  });

  describe("validateMdxSlugSync", () => {
    it("should return ok:true when all content is valid", () => {
      // Create valid pairs in multiple collections
      createMdxFile("posts", "en", "post1.mdx", { slug: "post-1" });
      createMdxFile("posts", "zh", "post1.mdx", { slug: "post-1" });
      createMdxFile("pages", "en", "about.mdx", { slug: "about" });
      createMdxFile("pages", "zh", "about.mdx", { slug: "about" });

      const result: SlugSyncResult = validateMdxSlugSync({
        rootDir: tmpDir,
        collections: ["posts", "pages"],
        locales: ["en", "zh"],
      });

      expect(result.ok).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.stats.totalPairs).toBe(2);
    });

    it("should return ok:false with issues when validation fails", () => {
      // Create one valid pair and one missing pair
      createMdxFile("posts", "en", "valid.mdx", { slug: "valid" });
      createMdxFile("posts", "zh", "valid.mdx", { slug: "valid" });
      createMdxFile("posts", "en", "missing-zh.mdx", { slug: "missing" });

      const result: SlugSyncResult = validateMdxSlugSync({
        rootDir: tmpDir,
        collections: ["posts"],
        locales: ["en", "zh"],
      });

      expect(result.ok).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.stats.missingPairs).toBe(1);
    });

    it("should aggregate issues from multiple collections", () => {
      // Posts: missing pair
      createMdxFile("posts", "en", "only-en.mdx", { slug: "only-en" });

      // Pages: slug mismatch
      createMdxFile("pages", "en", "mismatch.mdx", { slug: "en-slug" });
      createMdxFile("pages", "zh", "mismatch.mdx", { slug: "zh-slug" });

      // Products: parse error
      createMdxFile("products", "en", "no-slug.mdx", { title: "no slug" });
      createMdxFile("products", "zh", "no-slug.mdx", { title: "no slug" });

      const result: SlugSyncResult = validateMdxSlugSync({
        rootDir: tmpDir,
        collections: ["posts", "pages", "products"],
        locales: ["en", "zh"],
      });

      expect(result.ok).toBe(false);
      expect(result.issues).toHaveLength(3);
      expect(result.stats.missingPairs).toBe(1);
      expect(result.stats.slugMismatches).toBe(1);
      expect(result.stats.parseErrors).toBe(1);
    });

    it("should support custom locales configuration", () => {
      // Create files for en, zh, ja
      createMdxFile("posts", "en", "multi.mdx", { slug: "multi" });
      createMdxFile("posts", "zh", "multi.mdx", { slug: "multi" });
      createMdxFile("posts", "ja", "multi.mdx", { slug: "multi" });

      const result: SlugSyncResult = validateMdxSlugSync({
        rootDir: tmpDir,
        collections: ["posts"],
        locales: ["en", "zh", "ja"],
      });

      expect(result.ok).toBe(true);
      expect(result.checkedLocales).toEqual(["en", "zh", "ja"]);
      // Should check en vs zh and en vs ja (2 pairs per file)
      expect(result.stats.totalPairs).toBe(2);
    });

    it("should handle empty collections gracefully", () => {
      // Don't create any files

      const result: SlugSyncResult = validateMdxSlugSync({
        rootDir: tmpDir,
        collections: ["posts"],
        locales: ["en", "zh"],
      });

      expect(result.ok).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.stats.totalFiles).toBe(0);
    });

    it("should use first locale as base when baseLocale not specified", () => {
      createMdxFile("posts", "zh", "only-zh.mdx", { slug: "only-zh" });

      const result: SlugSyncResult = validateMdxSlugSync({
        rootDir: tmpDir,
        collections: ["posts"],
        locales: ["en", "zh"],
        contentRoots: ["content"],
      });

      expect(result.issues).toHaveLength(1);
      const issue = result.issues[0];
      expect(issue).toBeDefined();
      expect(issue?.type).toBe("missing_pair");
      expect(issue?.baseLocale).toBe("en");
    });
  });

  describe("edge cases", () => {
    it("should handle files with special characters in slug", () => {
      createMdxFile("posts", "en", "special.mdx", { slug: "hello-world-2024" });
      createMdxFile("posts", "zh", "special.mdx", { slug: "hello-world-2024" });

      const result: SlugSyncResult = validateMdxSlugSync({
        rootDir: tmpDir,
        collections: ["posts"],
        locales: ["en", "zh"],
      });

      expect(result.ok).toBe(true);
    });

    it("should treat empty string slug as valid if both match", () => {
      // Note: Empty string slugs are technically valid strings and will match
      // if both locales have the same empty slug. This is by design - the
      // validation focuses on consistency, not slug quality.
      createMdxFile("posts", "en", "empty.mdx", { slug: "" });
      createMdxFile("posts", "zh", "empty.mdx", { slug: "" });

      const result: SlugSyncResult = validateMdxSlugSync({
        rootDir: tmpDir,
        collections: ["posts"],
        locales: ["en", "zh"],
      });

      // Empty strings match, so no mismatch error
      // (Content quality checks should be handled separately)
      expect(result.ok).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it("should handle multiple files in same collection", () => {
      // Create 3 valid pairs
      for (let i = 1; i <= 3; i++) {
        createMdxFile("posts", "en", `post${i}.mdx`, { slug: `post-${i}` });
        createMdxFile("posts", "zh", `post${i}.mdx`, { slug: `post-${i}` });
      }

      const result: SlugSyncResult = validateMdxSlugSync({
        rootDir: tmpDir,
        collections: ["posts"],
        locales: ["en", "zh"],
      });

      expect(result.ok).toBe(true);
      expect(result.stats.totalPairs).toBe(3);
      expect(result.stats.totalFiles).toBe(6);
    });
  });

  describe("content manifest generation", () => {
    it("exposes an atomic generated-artifact writer", () => {
      const outputPath = path.join(tmpDir, "reports", "artifact.txt");

      writeFileAtomic(outputPath, "first");
      writeFileAtomic(outputPath, "second");

      expect(fs.readFileSync(outputPath, "utf8")).toBe("second");
      expect(
        fs
          .readdirSync(path.dirname(outputPath))
          .some((file) => file.startsWith("artifact.txt.tmp-")),
      ).toBe(false);
    });

    it("rejects invalid frontmatter before producing manifest entries", () => {
      createMdxFile("pages", "en", "about.mdx", {
        locale: "en",
        title: "About",
        description: "About page description",
        slug: "about",
        publishedAt: "2026-01-01",
        updatedAt: "2026-01-02",
        seo: {
          title: "About SEO",
        },
      });

      const context = createContentManifestContext(tmpDir);

      expect(() => generateContentManifest(context)).toThrow(
        /seo\.description is required/u,
      );
    });

    it("rejects invalid markdown frontmatter before producing manifest entries", () => {
      createMdxFile("pages", "en", "about.md", {
        locale: "en",
        title: "About",
        description: "About page description",
        slug: "about",
        publishedAt: "2026-01-01",
        updatedAt: "2026-01-02",
        seo: {
          title: "About SEO",
        },
      });

      const context = createContentManifestContext(tmpDir);

      expect(() => generateContentManifest(context)).toThrow(
        /seo\.description is required/u,
      );
    });

    it("accepts valid single-locale page frontmatter into manifest keys", () => {
      createMdxFile("pages", "en", "about.mdx", {
        locale: "en",
        title: "About",
        description: "About page description",
        slug: "about",
        publishedAt: "2026-01-01",
        updatedAt: "2026-01-02",
        draft: false,
        seo: {
          title: "About SEO",
          description: "About SEO description",
        },
      });

      const context = createContentManifestContext(tmpDir);
      const manifest = generateContentManifest(context);

      expect(manifest.byKey["pages/en/about"]).toBeDefined();
      expect(manifest.byKey["pages/zh/about"]).toBeUndefined();
    });

    it("check mode fails when generated artifacts are stale without rewriting them", () => {
      const consoleError = captureExpectedConsoleErrors(
        "Content manifest artifacts are stale:",
        "  - ",
        "Run `node scripts/starter-checks.js content-manifest`",
      );
      createMdxFile("pages", "en", "about.mdx", {
        locale: "en",
        title: "About",
        description: "About page description",
        slug: "about",
        publishedAt: "2026-01-01",
        updatedAt: "2026-01-02",
        draft: false,
        seo: {
          title: "About SEO",
          description: "About SEO description",
        },
      });
      createMdxFile("pages", "zh", "about.mdx", {
        locale: "zh",
        title: "关于",
        description: "关于页面描述",
        slug: "about",
        publishedAt: "2026-01-01",
        updatedAt: "2026-01-02",
        draft: false,
        seo: {
          title: "关于 SEO",
          description: "关于 SEO 描述",
        },
      });

      const context = createContentManifestContext(tmpDir);
      fs.mkdirSync(path.dirname(context.importersOutput), { recursive: true });
      fs.mkdirSync(path.dirname(context.manifestTsOutput), { recursive: true });
      fs.writeFileSync(context.importersOutput, "stale importers");
      fs.writeFileSync(context.manifestTsOutput, "stale manifest");

      expect(runContentManifestGenerator(context, { check: true })).toBe(false);
      expect(fs.readFileSync(context.importersOutput, "utf8")).toBe(
        "stale importers",
      );
      expect(fs.readFileSync(context.manifestTsOutput, "utf8")).toBe(
        "stale manifest",
      );
      expect(consoleError).toHaveBeenCalledTimes(4);
      expect(consoleError).toHaveBeenCalledWith(
        `  - ${context.importersOutput}`,
      );
      expect(consoleError).toHaveBeenCalledWith(
        `  - ${context.manifestTsOutput}`,
      );
    });

    it("replaces generated artifacts through temporary files", () => {
      createMdxFile("pages", "en", "about.mdx", {
        locale: "en",
        title: "About",
        description: "About page description",
        slug: "about",
        publishedAt: "2026-01-01",
        updatedAt: "2026-01-02",
        draft: false,
        seo: {
          title: "About SEO",
          description: "About SEO description",
        },
      });
      createMdxFile("pages", "zh", "about.mdx", {
        locale: "zh",
        title: "关于",
        description: "关于页面描述",
        slug: "about",
        publishedAt: "2026-01-01",
        updatedAt: "2026-01-02",
        draft: false,
        seo: {
          title: "关于 SEO",
          description: "关于 SEO 描述",
        },
      });

      const context = createContentManifestContext(tmpDir);

      expect(runContentManifestGenerator(context)).toBe(true);
      expect(
        fs
          .readdirSync(path.dirname(context.importersOutput))
          .some((file) => file.startsWith("mdx-importers.generated.ts.tmp-")),
      ).toBe(false);
      expect(
        fs
          .readdirSync(path.dirname(context.manifestTsOutput))
          .some((file) =>
            file.startsWith("content-manifest.generated.ts.tmp-"),
          ),
      ).toBe(false);
    });
  });
});
