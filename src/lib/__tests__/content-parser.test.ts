import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ContentError,
  ContentValidationError,
  type ContentType,
} from "@/types/content.types";
import {
  getContentFiles,
  parseContentFile,
  parseContentFileWithDraftFilter,
} from "@/lib/content-parser";
import { logger } from "@/lib/logger";
import { CONTENT_LIMITS } from "@/constants/app-constants";

// Mock依赖（v4：为内置模块手动提供函数实现）
vi.mock("fs", () => {
  const mockAccess = vi.fn();
  const mockReadFile = vi.fn();
  const mockReaddir = vi.fn();
  // Keep sync mocks as sentinels for async contract tests
  const existsSync = vi.fn();
  const readFileSync = vi.fn();
  const readdirSync = vi.fn();
  const exports = {
    existsSync,
    readFileSync,
    readdirSync,
    promises: {
      access: mockAccess,
      readFile: mockReadFile,
      readdir: mockReaddir,
    },
  } as any;
  return { default: exports, ...exports };
});
vi.mock("@/lib/logger");
vi.mock("@/lib/content-utils", () => ({
  CONTENT_DIR: "/mock/content",
  validateFilePath: vi.fn((filePath: string, baseDir: string) => {
    if (filePath.includes("..") || filePath.includes("invalid")) {
      throw new Error("Invalid file path");
    }
    // For single files, return baseDir + basename
    // For directories, return baseDir + filePath
    if (filePath.includes("/")) {
      return path.join(baseDir, filePath);
    }
    return path.join(baseDir, path.basename(filePath));
  }),
  getValidationConfig: vi.fn(() => ({
    strictMode: false,
    requireSlug: true,
    requireLocale: false,
    requireAuthor: false,
    requireDescription: false,
    requireTags: false,
    requireCategories: false,
  })),
  shouldFilterDraft: vi.fn(() => false),
}));
vi.mock("@/lib/content-validation", () => ({
  validateContentMetadata: vi.fn(() => ({
    isValid: true,
    errors: [],
    warnings: [],
  })),
}));

const mockFsPromises = vi.mocked(fs.promises) as {
  access: ReturnType<typeof vi.fn>;
  readFile: ReturnType<typeof vi.fn>;
  readdir: ReturnType<typeof vi.fn>;
};
const mockFs = vi.mocked(fs) as unknown as {
  existsSync: ReturnType<typeof vi.fn>;
  readFileSync: ReturnType<typeof vi.fn>;
  readdirSync: ReturnType<typeof vi.fn>;
};
const mockLogger = vi.mocked(logger);

describe("content-parser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("parseContentFile", () => {
    const mockFilePath = "test-content.mdx";
    const mockContentType: ContentType = "posts";
    const mockFileContent = `---
title: Test Content
description: Test description
date: 2024-01-01
author: Test Author
---

# Test Content

This is test content.`;

    beforeEach(() => {
      mockFsPromises.access.mockResolvedValue(undefined);
      mockFsPromises.readFile.mockResolvedValue(mockFileContent);
    });

    it("should successfully parse a valid MDX file", async () => {
      const result = await parseContentFile(mockFilePath, mockContentType);

      expect(result).toEqual({
        slug: "test-content",
        metadata: {
          title: "Test Content",
          description: "Test description",
          date: new Date("2024-01-01"),
          author: "Test Author",
        },
        content: "\n# Test Content\n\nThis is test content.",
        filePath: "/mock/content/test-content.mdx",
      });
    });

    it("should throw ContentError when file does not exist", async () => {
      mockFsPromises.access.mockRejectedValue(new Error("ENOENT"));

      await expect(
        parseContentFile(mockFilePath, mockContentType),
      ).rejects.toThrow(ContentError);
      await expect(
        parseContentFile(mockFilePath, mockContentType),
      ).rejects.toThrow("Content file not found: test-content.mdx");
    });

    it("should throw ContentError when file is too large", async () => {
      const largeContent = "x".repeat(CONTENT_LIMITS.MAX_FILE_SIZE + 1);
      mockFsPromises.readFile.mockResolvedValue(largeContent);

      await expect(
        parseContentFile(mockFilePath, mockContentType),
      ).rejects.toThrow(ContentError);
      await expect(
        parseContentFile(mockFilePath, mockContentType),
      ).rejects.toThrow("Content file too large");
    });

    it("should handle invalid file paths", async () => {
      await expect(
        parseContentFile("../invalid/path.mdx", mockContentType),
      ).rejects.toThrow("Invalid file path");
    });

    it("should handle file read errors", async () => {
      mockFsPromises.readFile.mockRejectedValue(new Error("File read error"));

      await expect(
        parseContentFile(mockFilePath, mockContentType),
      ).rejects.toThrow(ContentError);
      await expect(
        parseContentFile(mockFilePath, mockContentType),
      ).rejects.toThrow("Failed to parse content file");
    });

    it("should log warnings when content validation fails", async () => {
      const { validateContentMetadata } = vi.mocked(
        await import("@/lib/content-validation"),
      );
      validateContentMetadata.mockReturnValue({
        isValid: false,
        errors: ["Missing required field"],
        warnings: ["Deprecated field used"],
      });

      await parseContentFile(mockFilePath, mockContentType);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Content validation failed",
        {
          file: mockFilePath,
          errors: ["Missing required field"],
          warnings: ["Deprecated field used"],
        },
      );
    });

    it("should extract slug from filename correctly", async () => {
      const result = await parseContentFile(
        "my-blog-post.mdx",
        mockContentType,
      );
      expect(result.slug).toBe("my-blog-post");
    });

    it("should handle files without frontmatter", async () => {
      mockFsPromises.readFile.mockResolvedValue(
        "# Just content without frontmatter",
      );

      const result = await parseContentFile(mockFilePath, mockContentType);

      expect(result.metadata).toEqual({});
      expect(result.content).toBe("# Just content without frontmatter");
    });

    it("should handle empty files", async () => {
      mockFsPromises.readFile.mockResolvedValue("");

      const result = await parseContentFile(mockFilePath, mockContentType);

      expect(result.metadata).toEqual({});
      expect(result.content).toBe("");
    });

    it("should preserve file path in result", async () => {
      const result = await parseContentFile(mockFilePath, mockContentType);
      expect(result.filePath).toBe("/mock/content/test-content.mdx");
    });
  });

  describe("getContentFiles", () => {
    const mockContentDir = "content/blog";

    beforeEach(() => {
      mockFsPromises.access.mockResolvedValue(undefined);
      mockFsPromises.readdir.mockResolvedValue([
        "post1.mdx",
        "post2.md",
        "post3.en.mdx",
        "post4.zh.mdx",
        "invalid.txt",
        "draft.mdx",
      ] as string[]);
    });

    it("should return all valid content files when no locale specified", async () => {
      const result = await getContentFiles(mockContentDir);

      expect(result).toEqual([
        "/mock/content/content/blog/post1.mdx",
        "/mock/content/content/blog/post2.md",
        "/mock/content/content/blog/post3.en.mdx",
        "/mock/content/content/blog/post4.zh.mdx",
        "/mock/content/content/blog/draft.mdx",
      ]);
    });

    it("should filter files by locale when specified", async () => {
      const result = await getContentFiles(mockContentDir, "en");

      expect(result).toEqual([
        "/mock/content/content/blog/en/post1.mdx",
        "/mock/content/content/blog/en/post2.md",
        "/mock/content/content/blog/en/post3.en.mdx",
        "/mock/content/content/blog/en/draft.mdx",
      ]);
    });

    it("should filter Chinese locale files correctly", async () => {
      const result = await getContentFiles(mockContentDir, "zh");

      expect(result).toEqual([
        "/mock/content/content/blog/zh/post1.mdx",
        "/mock/content/content/blog/zh/post2.md",
        "/mock/content/content/blog/zh/post4.zh.mdx",
        "/mock/content/content/blog/zh/draft.mdx",
      ]);
    });

    it("should return empty array when directory does not exist", async () => {
      mockFsPromises.access.mockRejectedValue(new Error("ENOENT"));

      const result = await getContentFiles(mockContentDir);

      expect(result).toEqual([]);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Content directory does not exist",
        { dir: "/mock/content/content/blog" },
      );
    });

    it("should filter out non-markdown files", async () => {
      mockFsPromises.readdir.mockResolvedValue([
        "post1.mdx",
        "post2.md",
        "image.jpg",
        "config.json",
        "readme.txt",
      ] as string[]);

      const result = await getContentFiles(mockContentDir);

      expect(result).toEqual([
        "/mock/content/content/blog/post1.mdx",
        "/mock/content/content/blog/post2.md",
      ]);
    });

    it("should handle empty directory", async () => {
      mockFsPromises.readdir.mockResolvedValue([] as string[]);

      const result = await getContentFiles(mockContentDir);

      expect(result).toEqual([]);
    });

    it("should handle directory read errors", async () => {
      mockFsPromises.readdir.mockRejectedValue(
        new Error("Directory read error"),
      );

      await expect(getContentFiles(mockContentDir)).rejects.toThrow(
        "Directory read error",
      );
    });

    it("should validate content directory path", async () => {
      await expect(getContentFiles("../invalid/path")).rejects.toThrow(
        "Invalid file path",
      );
    });
  });

  describe("parseContentFileWithDraftFilter", () => {
    const mockFilePath = "draft-post.mdx";
    const mockContentType: ContentType = "posts";
    const mockDraftContent = `---
title: Draft Post
draft: true
---

Draft content.`;

    beforeEach(() => {
      mockFsPromises.access.mockResolvedValue(undefined);
      mockFsPromises.readFile.mockResolvedValue(mockDraftContent);
    });

    it("should return parsed content when not a draft", async () => {
      const { shouldFilterDraft } = vi.mocked(
        await import("@/lib/content-utils"),
      );
      shouldFilterDraft.mockReturnValue(false);

      const result = await parseContentFileWithDraftFilter(
        mockFilePath,
        mockContentType,
      );

      expect(result).not.toBeNull();
      expect(result?.slug).toBe("draft-post");
    });

    it("should return null when content is filtered as draft", async () => {
      const { shouldFilterDraft } = vi.mocked(
        await import("@/lib/content-utils"),
      );
      shouldFilterDraft.mockReturnValue(true);

      const result = await parseContentFileWithDraftFilter(
        mockFilePath,
        mockContentType,
      );

      expect(result).toBeNull();
      expect(mockLogger.info).toHaveBeenCalledWith("Filtering draft content", {
        file: mockFilePath,
        slug: "draft-post",
      });
    });
  });

  describe("parseContentFile - validation logging", () => {
    const mockFilePath = "test.mdx";
    const mockContentType: ContentType = "posts";
    const mockFileContent = `---
title: Test
---

Content`;

    beforeEach(() => {
      mockFsPromises.access.mockResolvedValue(undefined);
      mockFsPromises.readFile.mockResolvedValue(mockFileContent);
    });

    it("should log errors in strict mode when validation fails", async () => {
      const { validateContentMetadata } = vi.mocked(
        await import("@/lib/content-validation"),
      );
      validateContentMetadata.mockReturnValue({
        isValid: false,
        errors: ["Missing required field"],
        warnings: [],
      });

      await expect(
        parseContentFile(mockFilePath, mockContentType, { strictMode: true }),
      ).rejects.toThrow(ContentValidationError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Content validation failed",
        {
          file: mockFilePath,
          errors: ["Missing required field"],
          warnings: [],
        },
      );
    });

    it("should log info for warnings when validation passes", async () => {
      const { validateContentMetadata } = vi.mocked(
        await import("@/lib/content-validation"),
      );
      validateContentMetadata.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: ["Field is deprecated"],
      });

      await parseContentFile(mockFilePath, mockContentType);

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Content validation warnings",
        {
          file: mockFilePath,
          warnings: ["Field is deprecated"],
        },
      );
    });

    it("should throw ContentValidationError in strict mode", async () => {
      const { validateContentMetadata } = vi.mocked(
        await import("@/lib/content-validation"),
      );
      validateContentMetadata.mockReturnValue({
        isValid: false,
        errors: ["Title too long"],
        warnings: [],
      });

      await expect(
        parseContentFile(mockFilePath, mockContentType, { strictMode: true }),
      ).rejects.toThrow(ContentValidationError);
    });

    it("should use slug from frontmatter if provided", async () => {
      const contentWithSlug = `---
title: Test
slug: custom-slug
---

Content`;
      mockFsPromises.readFile.mockResolvedValue(contentWithSlug);

      const result = await parseContentFile(mockFilePath, mockContentType);

      expect(result.slug).toBe("custom-slug");
    });
  });

  describe("async I/O contract", () => {
    /**
     * These tests verify that content-parser functions use async fs APIs
     * (fs.promises.*) instead of synchronous APIs (fs.*Sync).
     *
     * Strategy:
     * 1. "Returns a Promise" -- call function, check return is instanceof Promise.
     *    Current sync impl returns plain object/array -> FAIL.
     * 2. "Does not use sync APIs" -- make sync mocks throw sentinel errors,
     *    confirm function does NOT throw those sentinels (i.e. it never calls them).
     *    Current sync impl calls them -> throws sentinel -> FAIL.
     * 3. "Rejects properly" -- verify async error handling via Promise rejection.
     *    Current sync impl throws synchronously -> FAIL.
     */

    const SYNC_SENTINEL = "SYNC_API_USED";

    const validMdxContent = `---
title: Async Test Content
description: Testing async I/O
date: 2024-01-01
---

# Async Test

This is async test content.`;

    describe("parseContentFile", () => {
      const mockFilePath = "async-test.mdx";
      const mockContentType: ContentType = "posts";

      it("should return a Promise that resolves to parsed content", () => {
        // Provide valid async mocks so the function can execute.
        mockFsPromises.access.mockResolvedValue(undefined);
        mockFsPromises.readFile.mockResolvedValue(validMdxContent);

        const returnValue = parseContentFile(mockFilePath, mockContentType);

        // Async implementation returns a Promise; sync returns a plain object.
        expect(returnValue).toBeInstanceOf(Promise);
      });

      it("should not call fs.existsSync (uses fs.promises.access instead)", () => {
        // Make existsSync throw a sentinel error
        mockFs.existsSync.mockImplementation(() => {
          throw new Error(SYNC_SENTINEL);
        });
        // Provide valid async mocks
        mockFsPromises.access.mockResolvedValue(undefined);
        mockFsPromises.readFile.mockResolvedValue(validMdxContent);

        // If async impl, existsSync is never called -> no throw.
        expect(() =>
          parseContentFile(mockFilePath, mockContentType),
        ).not.toThrow(SYNC_SENTINEL);
      });

      it("should not call fs.readFileSync (uses fs.promises.readFile instead)", () => {
        // Provide valid async mocks
        mockFsPromises.access.mockResolvedValue(undefined);
        mockFsPromises.readFile.mockResolvedValue(validMdxContent);
        // Make readFileSync throw a sentinel error
        mockFs.readFileSync.mockImplementation(() => {
          throw new Error(SYNC_SENTINEL);
        });

        // If async impl, readFileSync is never called -> no throw.
        expect(() =>
          parseContentFile(mockFilePath, mockContentType),
        ).not.toThrow(SYNC_SENTINEL);
      });

      it("should reject with appropriate error for non-existent file via async API", async () => {
        // Make sync APIs throw sentinel
        mockFs.existsSync.mockImplementation(() => {
          throw new Error(SYNC_SENTINEL);
        });
        mockFs.readFileSync.mockImplementation(() => {
          throw new Error(SYNC_SENTINEL);
        });
        // Make async access reject
        mockFsPromises.access.mockRejectedValue(new Error("ENOENT"));

        let caughtError: Error | undefined;
        try {
          await parseContentFile("non-existent.mdx", "posts");
        } catch (error) {
          caughtError = error as Error;
        }

        // Function should have thrown/rejected
        expect(caughtError).toBeDefined();
        // The error should NOT contain the sync sentinel
        expect(caughtError!.message).not.toContain(SYNC_SENTINEL);
      });
    });

    describe("getContentFiles", () => {
      const mockContentDir = "content/blog";

      it("should return a Promise that resolves to an array of file paths", () => {
        // Provide valid async mocks
        mockFsPromises.access.mockResolvedValue(undefined);
        mockFsPromises.readdir.mockResolvedValue([
          "post1.mdx",
          "post2.md",
        ] as string[]);

        const returnValue = getContentFiles(mockContentDir);

        // Async implementation returns a Promise; sync returns a plain array.
        expect(returnValue).toBeInstanceOf(Promise);
      });

      it("should not call fs.existsSync (uses fs.promises.access instead)", () => {
        // Make existsSync throw a sentinel error
        mockFs.existsSync.mockImplementation(() => {
          throw new Error(SYNC_SENTINEL);
        });
        // Provide valid async mocks
        mockFsPromises.access.mockResolvedValue(undefined);
        mockFsPromises.readdir.mockResolvedValue(["post1.mdx"] as string[]);

        // If async impl, existsSync is never called -> no throw.
        expect(() => getContentFiles(mockContentDir)).not.toThrow(
          SYNC_SENTINEL,
        );
      });

      it("should not call fs.readdirSync (uses fs.promises.readdir instead)", () => {
        // Provide valid async mocks
        mockFsPromises.access.mockResolvedValue(undefined);
        mockFsPromises.readdir.mockResolvedValue(["post1.mdx"] as string[]);
        // Make readdirSync throw a sentinel error
        mockFs.readdirSync.mockImplementation(() => {
          throw new Error(SYNC_SENTINEL);
        });

        // If async impl, readdirSync is never called -> no throw.
        expect(() => getContentFiles(mockContentDir)).not.toThrow(
          SYNC_SENTINEL,
        );
      });

      it("should resolve to empty array for non-existent directory via async API", async () => {
        // Make sync APIs throw sentinel
        mockFs.existsSync.mockImplementation(() => {
          throw new Error(SYNC_SENTINEL);
        });
        mockFs.readdirSync.mockImplementation(() => {
          throw new Error(SYNC_SENTINEL);
        });
        // Make async access reject
        mockFsPromises.access.mockRejectedValue(new Error("ENOENT"));

        let result: string[] | undefined;
        let caughtError: Error | undefined;
        try {
          result = await getContentFiles("non-existent-dir");
        } catch (error) {
          caughtError = error as Error;
        }

        // Should NOT have thrown a sync sentinel error
        if (caughtError) {
          expect(caughtError.message).not.toContain(SYNC_SENTINEL);
        }
        // Should return an empty array for non-existent directory
        expect(result).toEqual([]);
      });
    });
  });
});
