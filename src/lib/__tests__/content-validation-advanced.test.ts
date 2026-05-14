/**
 * Content Validation - Advanced Tests
 *
 * 测试高级验证功能：
 * - 类型特定验证
 * - SEO验证
 * - 边界情况测试
 */

import { describe, expect, it } from "vitest";
import type { ContentType } from "@/types/content.types";
import { validateContentMetadata } from "@/lib/content-validation";
import {
  TEST_CONTENT_LIMITS,
  TEST_COUNT_CONSTANTS,
} from "@/test/constants/test-constants";

describe("Content Validation - Advanced Tests", () => {
  describe("validateContentMetadata - Advanced Validation", () => {
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

    describe("type-specific validation", () => {
      it("should warn about missing excerpt for blog posts", () => {
        const { excerpt: _excerpt, ...metadataWithoutExcerpt } = validMetadata;

        const result = validateContentMetadata(metadataWithoutExcerpt, "posts");

        expect(result.isValid).toBe(true); // Still valid, but with warnings
        expect(result.warnings).toContain(
          "Blog posts should have an excerpt for better SEO",
        );
      });

      it("should not warn about missing excerpt for pages", () => {
        const { excerpt: _excerpt, ...metadataWithoutExcerpt } = validMetadata;

        const result = validateContentMetadata(metadataWithoutExcerpt, "pages");

        expect(result.isValid).toBe(true);
        expect(result.warnings).not.toContain(
          "Excerpt is recommended for blog posts",
        );
      });

      it("should validate different content types", () => {
        const contentTypes: ContentType[] = ["posts", "pages"];

        contentTypes.forEach((type) => {
          const result = validateContentMetadata(validMetadata, type);
          expect(result.isValid).toBe(true);
        });
      });

      it("should handle unknown content types gracefully", () => {
        const result = validateContentMetadata(
          validMetadata,
          "unknown" as ContentType,
        );

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain("Unknown content type: unknown");
      });

      it("should validate tags for different content types", () => {
        const metadataWithManyTags = {
          ...validMetadata,
          tags: Array.from({ length: 15 }, (_, i) => `tag-${i}`),
        };

        const result = validateContentMetadata(metadataWithManyTags, "posts");

        // Direct string check instead of stringContaining
        const hasTagWarning = result.warnings.some((warning) =>
          warning.includes("Too many tags"),
        );
        expect(hasTagWarning).toBe(true);
        expect(result.isValid).toBe(true);
      });

      it("should validate title length for different content types", () => {
        const metadataWithLongTitle = {
          ...validMetadata,
          title: "A".repeat(TEST_CONTENT_LIMITS.TITLE_MAX + 1),
        };

        const result = validateContentMetadata(metadataWithLongTitle, "posts");

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          `Title must be less than ${TEST_CONTENT_LIMITS.TITLE_MAX} characters`,
        );
      });

      it("should validate excerpt length for blog posts", () => {
        const metadataWithLongExcerpt = {
          ...validMetadata,
          excerpt: "A".repeat(TEST_CONTENT_LIMITS.DESCRIPTION_MAX + 1),
        };

        const result = validateContentMetadata(
          metadataWithLongExcerpt,
          "posts",
        );

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          `Excerpt must be less than ${TEST_CONTENT_LIMITS.DESCRIPTION_MAX} characters`,
        );
      });
    });

    describe("SEO validation", () => {
      it("should pass validation with proper SEO fields", () => {
        const result = validateContentMetadata(validMetadata, "posts");

        expect(result.isValid).toBe(true);
        expect(result.warnings).not.toContain(
          expect.stringContaining("SEO title"),
        );
        expect(result.warnings).not.toContain(
          expect.stringContaining("SEO description"),
        );
      });

      it("should warn about missing SEO title", () => {
        const metadataWithoutSeoTitle = {
          ...validMetadata,
          seo: {
            description: "SEO description for the article",
          },
        };

        const result = validateContentMetadata(
          metadataWithoutSeoTitle,
          "posts",
        );

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain("SEO title is recommended");
      });

      it("should warn about missing SEO description", () => {
        const metadataWithoutSeoDescription = {
          ...validMetadata,
          seo: {
            title: "SEO Title",
          },
        };

        const result = validateContentMetadata(
          metadataWithoutSeoDescription,
          "posts",
        );

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain("SEO description is recommended");
      });

      it("should warn about missing entire SEO object", () => {
        const { seo: _seo, ...metadataWithoutSeo } = validMetadata;

        const result = validateContentMetadata(metadataWithoutSeo, "posts");

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain("SEO title is recommended");
        expect(result.warnings).toContain("SEO description is recommended");
      });

      it("should validate SEO title length", () => {
        const metadataWithLongSeoTitle = {
          ...validMetadata,
          seo: {
            title: "A".repeat(TEST_CONTENT_LIMITS.SEO_TITLE_MAX_LENGTH + 1),
            description: "SEO description for the article",
          },
        };

        const result = validateContentMetadata(
          metadataWithLongSeoTitle,
          "posts",
        );

        expect(result.isValid).toBe(true); // SEO length issues are warnings, not errors
        expect(result.warnings).toContain(
          "SEO title should be 60 characters or less",
        );
      });

      it("should validate SEO description length", () => {
        const metadataWithLongSeoDescription = {
          ...validMetadata,
          seo: {
            title: "SEO Title",
            description: "A".repeat(
              TEST_CONTENT_LIMITS.SEO_DESCRIPTION_MAX_LENGTH + 1,
            ),
          },
        };

        const result = validateContentMetadata(
          metadataWithLongSeoDescription,
          "posts",
        );

        expect(result.isValid).toBe(true); // SEO length issues are warnings, not errors
        expect(result.warnings).toContain(
          "SEO description should be 160 characters or less",
        );
      });

      it("should handle empty SEO fields", () => {
        const metadataWithEmptySeo = {
          ...validMetadata,
          seo: {
            title: "",
            description: "",
          },
        };

        const result = validateContentMetadata(metadataWithEmptySeo, "posts");

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain("SEO title is recommended");
        expect(result.warnings).toContain("SEO description is recommended");
      });

      it("should handle null SEO object", () => {
        const metadataWithNullSeo = {
          ...validMetadata,
          seo: null,
        };

        const result = validateContentMetadata(metadataWithNullSeo, "posts");

        expect(result.isValid).toBe(true);
        expect(result.warnings).not.toContain(expect.stringContaining("SEO"));
      });
    });

    describe("edge cases", () => {
      it("should handle empty metadata object", () => {
        const result = validateContentMetadata({}, "posts");

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Title is required");
        expect(result.errors).toContain("Published date is required");
        // updatedAt is optional, so no error expected
      });

      it("should handle metadata with extra fields", () => {
        const metadataWithExtraFields = {
          ...validMetadata,
          extraField: "extra value",
          anotherField: 123,
        };

        const result = validateContentMetadata(
          metadataWithExtraFields,
          "posts",
        );

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should handle very large tag arrays", () => {
        const metadataWithManyTags = {
          ...validMetadata,
          tags: Array.from({ length: 100 }, (_, i) => `tag-${i}`),
        };

        const result = validateContentMetadata(metadataWithManyTags, "posts");

        expect(result.isValid).toBe(true);
        // Direct string check instead of stringContaining
        const hasTagWarning = result.warnings.some((warning) =>
          warning.includes("Too many tags"),
        );
        expect(hasTagWarning).toBe(true);
      });

      it("should handle maximum valid metadata", () => {
        const maximalMetadata = {
          title: "A".repeat(TEST_CONTENT_LIMITS.TITLE_MAX),
          publishedAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z",
          excerpt: "A".repeat(TEST_CONTENT_LIMITS.DESCRIPTION_MAX),
          tags: Array.from(
            { length: TEST_COUNT_CONSTANTS.MAX_TAGS },
            (_, i) => `tag-${i}`,
          ),
          seo: {
            title: "A".repeat(TEST_CONTENT_LIMITS.SEO_TITLE_MAX_LENGTH),
            description: "A".repeat(
              TEST_CONTENT_LIMITS.SEO_DESCRIPTION_MAX_LENGTH,
            ),
          },
        };

        const result = validateContentMetadata(maximalMetadata, "posts");

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });
});
