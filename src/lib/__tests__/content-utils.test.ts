import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContentError, type ContentConfig } from "@/types/content.types";
import {
  TEST_COUNT_CONSTANTS,
  TEST_SAMPLE_CONSTANTS,
} from "@/test/constants/test-constants";
import {
  ALLOWED_EXTENSIONS,
  CONFIG_DIR,
  CONTENT_DIR,
  getContentConfig,
  getValidationConfig,
  PAGES_DIR,
  POSTS_DIR,
  shouldFilterDraft,
  validateFilePath,
  warnIfDraftsInProduction,
} from "../content-utils";

// Mock dependencies
vi.mock("fs", () => {
  const existsSync = vi.fn();
  const readFileSync = vi.fn();
  const exports = { existsSync, readFileSync } as any;
  return { default: exports, ...exports };
});
vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
  },
}));

const mockFs = vi.mocked(fs);

const CURRENT_CONTENT_LOCALE_CONTRACT = {
  defaultLocale: "en",
  supportedLocales: ["en", "es", "zh"],
} satisfies Pick<ContentConfig, "defaultLocale" | "supportedLocales">;

function expectedDefaultContentConfig(
  overrides: Partial<ContentConfig> = {},
): ContentConfig {
  return {
    defaultLocale: CURRENT_CONTENT_LOCALE_CONTRACT.defaultLocale,
    supportedLocales: CURRENT_CONTENT_LOCALE_CONTRACT.supportedLocales,
    postsPerPage: 10,
    enableDrafts: process.env.NODE_ENV === "development",
    enableSearch: true,
    enableComments: false,
    autoGenerateExcerpt: true,
    excerptLength: 160,
    dateFormat: "YYYY-MM-DD",
    timeZone: "UTC",
    ...overrides,
  };
}

describe("Content Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Constants", () => {
    it("should define correct directory paths", () => {
      expect(CONTENT_DIR).toBe(path.join(process.cwd(), "content"));
      expect(POSTS_DIR).toBe(path.join(CONTENT_DIR, "posts"));
      expect(PAGES_DIR).toBe(path.join(CONTENT_DIR, "pages"));
      expect(CONFIG_DIR).toBe(path.join(CONTENT_DIR, "config"));
    });

    it("should define allowed file extensions", () => {
      expect(ALLOWED_EXTENSIONS).toEqual([".md", ".mdx", ".json"]);
      expect(Array.isArray(ALLOWED_EXTENSIONS)).toBe(true);
      expect(ALLOWED_EXTENSIONS.length).toBe(TEST_COUNT_CONSTANTS.TINY);
    });
  });

  describe("validateFilePath", () => {
    const baseDir = "/safe/directory";

    describe("input validation", () => {
      it("should throw error for empty file path", () => {
        expect(() => validateFilePath("", baseDir)).toThrow(ContentError);
        expect(() => validateFilePath("", baseDir)).toThrow(
          "Invalid file path: path must be a non-empty string",
        );
      });

      it("should throw error for null file path", () => {
        expect(() =>
          validateFilePath(null as unknown as string, baseDir),
        ).toThrow(ContentError);
      });

      it("should throw error for undefined file path", () => {
        expect(() =>
          validateFilePath(undefined as unknown as string, baseDir),
        ).toThrow(ContentError);
      });

      it("should throw error for non-string file path", () => {
        expect(() =>
          validateFilePath(
            TEST_SAMPLE_CONSTANTS.DECIMAL_SAMPLE as unknown as string,
            baseDir,
          ),
        ).toThrow(ContentError);
        expect(() =>
          validateFilePath({} as unknown as string, baseDir),
        ).toThrow(ContentError);
        expect(() =>
          validateFilePath([] as unknown as string, baseDir),
        ).toThrow(ContentError);
      });
    });

    describe("directory traversal protection", () => {
      it("should throw error for directory traversal attempts", () => {
        expect(() => validateFilePath("../../../etc/passwd", baseDir)).toThrow(
          ContentError,
        );
        expect(() => validateFilePath("../../../etc/passwd", baseDir)).toThrow(
          "Invalid file path: directory traversal detected",
        );
      });

      it("should throw error for subtle directory traversal attempts", () => {
        expect(() =>
          validateFilePath("safe/../../../etc/passwd", baseDir),
        ).toThrow(ContentError);
        expect(() => validateFilePath("./../../etc/passwd", baseDir)).toThrow(
          ContentError,
        );
        expect(() =>
          validateFilePath("..\\..\\windows\\system32", baseDir),
        ).toThrow(ContentError);
      });

      it("should allow legitimate relative paths", () => {
        expect(() =>
          validateFilePath("posts/article.md", baseDir),
        ).not.toThrow();
        expect(() =>
          validateFilePath("./posts/article.md", baseDir),
        ).not.toThrow();
        expect(() =>
          validateFilePath("pages/about.mdx", baseDir),
        ).not.toThrow();
      });
    });

    describe("path outside base directory protection", () => {
      it("should throw error when resolved path is outside base directory", () => {
        const outsidePath = "/completely/different/path/file.md";
        expect(() => validateFilePath(outsidePath, baseDir)).toThrow(
          ContentError,
        );
        expect(() => validateFilePath(outsidePath, baseDir)).toThrow(
          "File path outside allowed directory",
        );
      });

      it("should allow paths within base directory", () => {
        const safePath = path.join(baseDir, "posts", "article.md");
        expect(() => validateFilePath(safePath, baseDir)).not.toThrow();
      });
    });

    describe("file extension validation", () => {
      it("should allow files with permitted extensions", () => {
        expect(() => validateFilePath("article.md", baseDir)).not.toThrow();
        expect(() => validateFilePath("component.mdx", baseDir)).not.toThrow();
        expect(() => validateFilePath("config.json", baseDir)).not.toThrow();
      });

      it("should throw error for files with forbidden extensions", () => {
        expect(() => validateFilePath("script.js", baseDir)).toThrow(
          ContentError,
        );
        expect(() => validateFilePath("script.js", baseDir)).toThrow(
          "File extension not allowed: .js",
        );

        expect(() => validateFilePath("executable.exe", baseDir)).toThrow(
          ContentError,
        );
        expect(() => validateFilePath("document.pdf", baseDir)).toThrow(
          ContentError,
        );
        expect(() => validateFilePath("image.png", baseDir)).toThrow(
          ContentError,
        );
      });

      it("should allow files without extensions", () => {
        expect(() => validateFilePath("README", baseDir)).not.toThrow();
        expect(() => validateFilePath("LICENSE", baseDir)).not.toThrow();
      });

      it("should handle multiple dots in filename correctly", () => {
        expect(() => validateFilePath("file.backup.md", baseDir)).not.toThrow();
        expect(() =>
          validateFilePath("config.local.json", baseDir),
        ).not.toThrow();
        expect(() => validateFilePath("script.min.js", baseDir)).toThrow(
          ContentError,
        );
      });
    });

    describe("path normalization", () => {
      it("should normalize relative paths correctly", () => {
        const result = validateFilePath("posts/./article.md", baseDir);
        expect(result).toBe(path.join(baseDir, "posts/article.md"));
      });

      it("should handle absolute paths correctly", () => {
        const absolutePath = path.join(baseDir, "posts", "article.md");
        const result = validateFilePath(absolutePath, baseDir);
        expect(result).toBe(absolutePath);
      });

      it("should return normalized absolute path", () => {
        const result = validateFilePath("posts/article.md", baseDir);
        expect(path.isAbsolute(result)).toBe(true);
        expect(result).toBe(path.join(baseDir, "posts/article.md"));
      });
    });

    describe("edge cases", () => {
      it("should handle empty base directory", () => {
        expect(() => validateFilePath("file.md", "")).not.toThrow();
      });

      it("should handle paths with special characters", () => {
        expect(() => validateFilePath("posts/文章.md", baseDir)).not.toThrow();
        expect(() =>
          validateFilePath("posts/article-with-dashes.md", baseDir),
        ).not.toThrow();
        expect(() =>
          validateFilePath("posts/article_with_underscores.md", baseDir),
        ).not.toThrow();
      });

      it("should handle very long paths", () => {
        const longPath = `${"a".repeat(200)}.md`;
        expect(() => validateFilePath(longPath, baseDir)).not.toThrow();
      });
    });
  });

  describe("getContentConfig", () => {
    // const mockConfigPath = path.join(CONFIG_DIR, 'content.json');

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should return default config when config file does not exist", () => {
      mockFs.existsSync.mockReturnValue(false);

      const config = getContentConfig();

      expect(config).toEqual(expectedDefaultContentConfig());
    });

    it("should load and merge custom config when file exists (ignoring unknown keys)", () => {
      const customConfig = {
        postsPerPage: 20,
        enableComments: true,
        customField: "custom value",
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(customConfig));

      const config = getContentConfig();

      expect(config).toEqual(
        expectedDefaultContentConfig({
          postsPerPage: 20,
          enableComments: true,
        }),
      );
    });

    it("should handle JSON parsing errors gracefully", async () => {
      const { logger } = await import("@/lib/logger");

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue("invalid json content");

      const config = getContentConfig();

      expect(config).toEqual(expectedDefaultContentConfig());

      expect(logger.warn).toHaveBeenCalledWith(
        "Failed to load content config, using defaults",
        { error: expect.any(Error) },
      );
    });

    it("should handle file system errors gracefully", async () => {
      const { logger } = await import("@/lib/logger");

      mockFs.existsSync.mockImplementation(() => {
        throw new Error("File system error");
      });

      const config = getContentConfig();

      expect(config).toEqual(expectedDefaultContentConfig());

      expect(logger.warn).toHaveBeenCalledWith(
        "Failed to load content config, using defaults",
        { error: expect.any(Error) },
      );
    });

    it("should validate config file path for security", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue("{}");

      expect(() => getContentConfig()).not.toThrow();
      expect(mockFs.existsSync).toHaveBeenCalledWith(
        expect.stringContaining("content.json"),
      );
    });

    it("should handle empty config file", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue("{}");

      const config = getContentConfig();

      expect(config).toEqual(expectedDefaultContentConfig());
    });

    it("should handle partial config override", () => {
      const partialConfig = {
        defaultLocale: "zh",
        postsPerPage: TEST_COUNT_CONSTANTS.MEDIUM,
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(partialConfig));

      const config = getContentConfig();

      expect(config.defaultLocale).toBe("zh");
      expect(config.postsPerPage).toBe(TEST_COUNT_CONSTANTS.MEDIUM);
      expect(config.enableSearch).toBe(true); // Should keep default
      expect(config.enableComments).toBe(false); // Should keep default
    });
  });

  describe("shouldFilterDraft", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("should return false when content is not a draft", () => {
      mockFs.existsSync.mockReturnValue(false);

      expect(shouldFilterDraft(false)).toBe(false);
      expect(shouldFilterDraft(undefined)).toBe(false);
    });

    it("should return true when draft and drafts disabled", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(
        JSON.stringify({ enableDrafts: false }),
      );

      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("CONTENT_ENABLE_DRAFTS", "");

      expect(shouldFilterDraft(true)).toBe(true);
    });

    it("should return false when draft but drafts enabled", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(
        JSON.stringify({ enableDrafts: true }),
      );

      vi.stubEnv("CONTENT_ENABLE_DRAFTS", "true");

      expect(shouldFilterDraft(true)).toBe(false);
    });
  });

  describe("warnIfDraftsInProduction", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("should log warning when drafts enabled in production", async () => {
      const { logger } = await import("@/lib/logger");

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({}));

      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("CONTENT_ENABLE_DRAFTS", "true");

      warnIfDraftsInProduction();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("CONTENT_WARNING"),
      );
    });

    it("should not log warning when drafts disabled in production", async () => {
      const { logger } = await import("@/lib/logger");

      mockFs.existsSync.mockReturnValue(false);

      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("CONTENT_ENABLE_DRAFTS", "");

      warnIfDraftsInProduction();
      expect(logger.warn).not.toHaveBeenCalledWith(
        expect.stringContaining("CONTENT_WARNING"),
      );
    });
  });

  describe("getValidationConfig", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should return default validation config when file does not exist", () => {
      mockFs.existsSync.mockReturnValue(false);

      const config = getValidationConfig();

      expect(config).toEqual({
        strictMode: false,
        requireSlug: true,
        requireLocale: false,
        requireAuthor: false,
        requireDescription: false,
        requireTags: false,
        requireCategories: false,
      });
    });

    it("should return default config when no validation section exists", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({ postsPerPage: 20 }));

      const config = getValidationConfig();

      expect(config.strictMode).toBe(false);
      expect(config.requireSlug).toBe(true);
    });

    it("should load validation config from content.json", () => {
      const validationConfig = {
        validation: {
          strictMode: true,
          requireAuthor: true,
          maxTitleLength: 100,
          maxDescriptionLength: 200,
          maxExcerptLength: 300,
          products: ["product-a", "product-b"],
        },
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(validationConfig));

      const config = getValidationConfig();

      expect(config.strictMode).toBe(true);
      expect(config.requireAuthor).toBe(true);
      expect(config.maxTitleLength).toBe(100);
      expect(config.maxDescriptionLength).toBe(200);
      expect(config.maxExcerptLength).toBe(300);
      expect(config.products).toEqual(["product-a", "product-b"]);
    });

    it("should handle errors gracefully and return defaults", async () => {
      const { logger } = await import("@/lib/logger");

      mockFs.existsSync.mockImplementation(() => {
        throw new Error("Read error");
      });

      const config = getValidationConfig();

      expect(config.strictMode).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(
        "Failed to load validation config, using defaults",
        { error: expect.any(Error) },
      );
    });

    it("should handle partial validation config", () => {
      const partialValidation = {
        validation: {
          requireDescription: true,
        },
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(partialValidation));

      const config = getValidationConfig();

      expect(config.requireDescription).toBe(true);
      expect(config.strictMode).toBe(false);
      expect(config.requireSlug).toBe(true);
    });
  });
});
