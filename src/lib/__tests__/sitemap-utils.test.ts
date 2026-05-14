/**
 * Sitemap utilities tests
 */

import fs from "fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getContentLastModified,
  getProductLastModified,
  getStaticPageLastModified,
} from "../sitemap-utils";

// Mock fs module (vitest v4 pattern: define mocks inside factory)
vi.mock("fs", () => {
  const statSync = vi.fn();
  const exports = { statSync } as any;
  return { default: exports, ...exports };
});

const mockFs = vi.mocked(fs) as {
  statSync: ReturnType<typeof vi.fn>;
};

describe("sitemap-utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getContentLastModified", () => {
    it("should use updatedAt when available", () => {
      const metadata = {
        publishedAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-06-15T12:00:00Z",
      };

      const result = getContentLastModified(metadata);

      expect(result.toISOString()).toBe("2023-06-15T12:00:00.000Z");
    });

    it("should use publishedAt when updatedAt is not available", () => {
      const metadata = {
        publishedAt: "2023-01-01T00:00:00Z",
      };

      const result = getContentLastModified(metadata);

      expect(result.toISOString()).toBe("2023-01-01T00:00:00.000Z");
    });

    it("should use publishedAt when updatedAt is undefined", () => {
      const metadata = {
        publishedAt: "2023-03-20T08:30:00Z",
        updatedAt: undefined,
      };

      const result = getContentLastModified(metadata);

      expect(result.toISOString()).toBe("2023-03-20T08:30:00.000Z");
    });

    it("should use file mtime when no timestamps available", () => {
      const mockMtime = new Date("2023-05-10T10:00:00Z");
      mockFs.statSync.mockReturnValue({ mtime: mockMtime });

      const result = getContentLastModified({}, "/path/to/file.mdx");

      expect(mockFs.statSync).toHaveBeenCalledWith("/path/to/file.mdx");
      expect(result).toEqual(mockMtime);
    });

    it("should not fallback to fake now when no timestamps and no filePath", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-04-26T00:00:00Z"));

      try {
        const result = getContentLastModified({});

        expect(result.toISOString()).toBe("2026-01-01T00:00:00.000Z");
        expect(result.toISOString()).not.toBe("2026-04-26T00:00:00.000Z");
      } finally {
        vi.useRealTimers();
      }
    });

    it("should fallback to conservative fixed date when fs.stat throws", () => {
      mockFs.statSync.mockImplementation(() => {
        throw new Error("File not found");
      });

      const result = getContentLastModified({}, "/nonexistent/file.mdx");

      expect(result.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    });

    it("should skip invalid updatedAt and use publishedAt", () => {
      const metadata = {
        publishedAt: "2023-01-01T00:00:00Z",
        updatedAt: "invalid-date",
      };

      const result = getContentLastModified(metadata);

      expect(result.toISOString()).toBe("2023-01-01T00:00:00.000Z");
    });

    it("should skip invalid publishedAt and use fs.stat", () => {
      const mockMtime = new Date("2023-05-10T10:00:00Z");
      mockFs.statSync.mockReturnValue({ mtime: mockMtime });

      const metadata = {
        publishedAt: "invalid-date",
      };

      const result = getContentLastModified(metadata, "/path/to/file.mdx");

      expect(result).toEqual(mockMtime);
    });

    it("should handle empty metadata object", () => {
      const mockMtime = new Date("2023-07-01T00:00:00Z");
      mockFs.statSync.mockReturnValue({ mtime: mockMtime });

      const result = getContentLastModified({}, "/path/to/file.mdx");

      expect(result).toEqual(mockMtime);
    });
  });

  describe("getProductLastModified", () => {
    it("should use updatedAt when available", () => {
      const product = {
        publishedAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-08-20T14:00:00Z",
      };

      const result = getProductLastModified(product);

      expect(result.toISOString()).toBe("2023-08-20T14:00:00.000Z");
    });

    it("should use publishedAt when updatedAt is not available", () => {
      const product = {
        publishedAt: "2023-02-15T09:00:00Z",
      };

      const result = getProductLastModified(product);

      expect(result.toISOString()).toBe("2023-02-15T09:00:00.000Z");
    });

    it("should handle product with undefined updatedAt", () => {
      const product = {
        publishedAt: "2023-04-01T00:00:00Z",
        updatedAt: undefined,
      };

      const result = getProductLastModified(product);

      expect(result.toISOString()).toBe("2023-04-01T00:00:00.000Z");
    });
  });

  describe("getStaticPageLastModified", () => {
    it("should return configured date for known path", () => {
      const config = new Map([
        ["/about", new Date("2023-01-15T00:00:00Z")],
        ["/contact", new Date("2023-02-20T00:00:00Z")],
      ]);

      const result = getStaticPageLastModified("/about", config);

      expect(result.toISOString()).toBe("2023-01-15T00:00:00.000Z");
    });

    it("should not return fake now for unknown path", () => {
      const config = new Map([["/about", new Date("2023-01-15T00:00:00Z")]]);

      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-04-26T00:00:00Z"));

      try {
        const result = getStaticPageLastModified("/unknown", config);

        expect(result.toISOString()).toBe("2026-01-01T00:00:00.000Z");
        expect(result.toISOString()).not.toBe("2026-04-26T00:00:00.000Z");
      } finally {
        vi.useRealTimers();
      }
    });

    it("should return conservative fixed date when config is undefined", () => {
      const result = getStaticPageLastModified("/about");

      expect(result.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    });

    it("should return conservative fixed date when config is empty", () => {
      const result = getStaticPageLastModified("/about", new Map());

      expect(result.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    });
  });
});
