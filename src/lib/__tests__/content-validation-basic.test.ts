/**
 * Content Validation - Basic Tests
 *
 * 测试基本验证功能：
 * - 必填字段验证
 * - 日期格式验证
 * - 基本数据类型验证
 */

import { describe, expect, it } from "vitest";
import type { _ContentType } from "@/types/content.types";
import { validateContentMetadata } from "@/lib/content-validation";

// 注释未使用的导入，保留以备将来使用
// import {
//   TEST_CONTENT_LIMITS,
//   TEST_COUNT_CONSTANTS,
// } from '@/test/constants/test-constants';

describe("Content Validation - Basic Tests", () => {
  describe("validateContentMetadata - Basic Validation", () => {
    const validMetadata = {
      title: "Test Article",
      slug: "test-article",
      publishedAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
      excerpt: "This is a test excerpt",
      tags: ["test", "article"],
      seo: {
        title: "SEO Title",
        description: "SEO description for the article",
      },
    };

    describe("required fields validation", () => {
      it("should pass validation with all required fields", () => {
        const result = validateContentMetadata(validMetadata, "posts");

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should fail validation when title is missing", () => {
        const { title: _title, ...metadataWithoutTitle } = validMetadata;

        const result = validateContentMetadata(metadataWithoutTitle, "posts");

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Title is required");
      });

      it("should fail validation when publishedAt is missing", () => {
        const { publishedAt: _publishedAt, ...metadataWithoutPublishedAt } =
          validMetadata;

        const result = validateContentMetadata(
          metadataWithoutPublishedAt,
          "posts",
        );

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Published date is required");
      });

      it("should handle missing updatedAt gracefully", () => {
        const { updatedAt: _updatedAt, ...metadataWithoutUpdatedAt } =
          validMetadata;

        const result = validateContentMetadata(
          metadataWithoutUpdatedAt,
          "posts",
        );

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should fail validation when title is empty string", () => {
        const metadataWithEmptyTitle = {
          ...validMetadata,
          title: "",
        };

        const result = validateContentMetadata(metadataWithEmptyTitle, "posts");

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Title is required");
      });

      it("should fail validation when title is only whitespace", () => {
        const metadataWithWhitespaceTitle = {
          ...validMetadata,
          title: "   ",
        };

        const result = validateContentMetadata(
          metadataWithWhitespaceTitle,
          "posts",
        );

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Title is required");
      });

      it("should fail validation when multiple required fields are missing", () => {
        const {
          title: _title,
          publishedAt: _publishedAt,
          ...metadataWithoutMultiple
        } = validMetadata;

        const result = validateContentMetadata(
          metadataWithoutMultiple,
          "posts",
        );

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Title is required");
        expect(result.errors).toContain("Published date is required");
      });
    });

    describe("date validation", () => {
      it("should pass validation with valid ISO date strings", () => {
        const metadata = {
          ...validMetadata,
          publishedAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-02T12:30:45Z",
        };

        const result = validateContentMetadata(metadata, "posts");

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should fail validation with invalid publishedAt date format", () => {
        const metadata = {
          ...validMetadata,
          publishedAt: "invalid-date",
        };

        const result = validateContentMetadata(metadata, "posts");

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Published date must be a valid ISO date",
        );
      });

      it("should fail validation with invalid updatedAt date format", () => {
        const metadata = {
          ...validMetadata,
          updatedAt: "not-a-date",
        };

        const result = validateContentMetadata(metadata, "posts");

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Updated date must be a valid ISO date",
        );
      });

      it("should fail validation when updatedAt is before publishedAt", () => {
        const metadata = {
          ...validMetadata,
          publishedAt: "2024-01-02T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        const result = validateContentMetadata(metadata, "posts");

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Updated date must be after published date",
        );
      });

      it("should pass validation when updatedAt equals publishedAt", () => {
        const metadata = {
          ...validMetadata,
          publishedAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        const result = validateContentMetadata(metadata, "posts");

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should handle dates with different timezone formats", () => {
        const metadata = {
          ...validMetadata,
          publishedAt: "2024-01-01T00:00:00+00:00",
          updatedAt: "2024-01-02T00:00:00-05:00",
        };

        const result = validateContentMetadata(metadata, "posts");

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should fail validation with timestamp numbers", () => {
        const metadata = {
          ...validMetadata,
          publishedAt: 1704067200000 as unknown as string, // timestamp
        };

        const result = validateContentMetadata(metadata, "posts");

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Published date must be a valid ISO date",
        );
      });
    });

    describe("basic data type validation", () => {
      it("should fail validation when title is not a string", () => {
        const metadata = {
          ...validMetadata,
          title: 123 as unknown as string,
        };

        const result = validateContentMetadata(metadata, "posts");

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Title must be a string");
      });

      it("should fail validation when tags is not an array", () => {
        const metadata = {
          ...validMetadata,
          tags: "not-an-array" as unknown as string[],
        };

        const result = validateContentMetadata(metadata, "posts");

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Tags must be an array");
      });

      it("should fail validation when excerpt is not a string", () => {
        const metadata = {
          ...validMetadata,
          excerpt: 456 as unknown as string,
        };

        const result = validateContentMetadata(metadata, "posts");

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Excerpt must be a string");
      });

      it("should validate array elements in tags", () => {
        const metadata = {
          ...validMetadata,
          tags: ["valid-tag", 123, "another-valid-tag"] as unknown as string[],
        };

        const result = validateContentMetadata(metadata, "posts");

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("All tags must be strings");
      });

      it("should handle empty arrays in tags", () => {
        const metadata = {
          ...validMetadata,
          tags: [],
        };

        const result = validateContentMetadata(metadata, "posts");

        // Empty tags array should be valid
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });
});
