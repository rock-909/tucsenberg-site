import { describe, expect, it } from "vitest";
import type { ContentType } from "@/types/content.types";
import { validateContentMetadata } from "@/lib/content-validation";
import {
  TEST_CONTENT_LIMITS,
  TEST_COUNT_CONSTANTS,
} from "@/test/constants/test-constants";

describe("content-validation", () => {
  describe("validateContentMetadata", () => {
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

      it("should fail validation when both title and publishedAt are missing", () => {
        const {
          title: _title,
          publishedAt: _publishedAt,
          ...metadataWithoutRequired
        } = validMetadata;

        const result = validateContentMetadata(
          metadataWithoutRequired,
          "posts",
        );

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Title is required");
        expect(result.errors).toContain("Published date is required");
        expect(result.errors).toHaveLength(TEST_COUNT_CONSTANTS.SMALL);
      });

      it("should handle empty string title as missing", () => {
        const metadata = { ...validMetadata, title: "" };

        const result = validateContentMetadata(metadata, "posts");

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Title is required");
      });

      it("should handle null values as missing", () => {
        const metadata = { ...validMetadata, title: null, publishedAt: null };

        const result = validateContentMetadata(metadata, "posts");

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

      it("should pass validation with simple date strings", () => {
        const metadata = {
          ...validMetadata,
          publishedAt: "2024-01-01",
          updatedAt: "2024-01-02",
        };

        const result = validateContentMetadata(metadata, "posts");

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should fail validation with invalid publishedAt date", () => {
        const metadata = { ...validMetadata, publishedAt: "invalid-date" };

        const result = validateContentMetadata(metadata, "posts");

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Published date must be a valid ISO date",
        );
      });

      it("should fail validation with invalid updatedAt date", () => {
        const metadata = { ...validMetadata, updatedAt: "not-a-date" };

        const result = validateContentMetadata(metadata, "posts");

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Updated date must be a valid ISO date",
        );
      });

      it("should fail validation with both invalid dates", () => {
        const metadata = {
          ...validMetadata,
          publishedAt: "invalid",
          updatedAt: "also-invalid",
        };

        const result = validateContentMetadata(metadata, "posts");

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Published date must be a valid ISO date",
        );
        expect(result.errors).toContain(
          "Updated date must be a valid ISO date",
        );
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
    });

    describe("type-specific validation", () => {
      it("should warn about missing excerpt for blog posts", () => {
        const { excerpt: _excerpt, ...metadataWithoutExcerpt } = validMetadata;

        const result = validateContentMetadata(metadataWithoutExcerpt, "posts");

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain(
          "Blog posts should have an excerpt for better SEO",
        );
      });

      it("should warn about missing tags for blog posts", () => {
        const { tags: _tags, ...metadataWithoutTags } = validMetadata;

        const result = validateContentMetadata(metadataWithoutTags, "posts");

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain(
          "Blog posts should have tags for better categorization",
        );
      });

      it("should warn about empty tags array for blog posts", () => {
        const metadata = { ...validMetadata, tags: [] };

        const result = validateContentMetadata(metadata, "posts");

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain(
          "Blog posts should have tags for better categorization",
        );
      });

      it("should not warn about missing excerpt/tags for non-blog content", () => {
        const {
          excerpt: _excerpt,
          tags: _tags,
          ...metadataWithoutExcerptAndTags
        } = validMetadata;

        const result = validateContentMetadata(
          metadataWithoutExcerptAndTags,
          "pages" as ContentType,
        );

        expect(result.warnings).not.toContain(
          "Blog posts should have an excerpt for better SEO",
        );
        expect(result.warnings).not.toContain(
          "Blog posts should have tags for better categorization",
        );
      });

      it("should handle different content types correctly", () => {
        const contentTypes: ContentType[] = ["posts", "pages"];

        contentTypes.forEach((type) => {
          const result = validateContentMetadata(validMetadata, type);
          expect(result.isValid).toBe(true);
        });
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

      it("should warn about long SEO title", () => {
        const metadata = {
          ...validMetadata,
          seo: {
            title: "x".repeat(TEST_CONTENT_LIMITS.TITLE_MAX + 1), // Exceeds 60 character limit
            description: "Valid description",
          },
        };

        const result = validateContentMetadata(metadata, "posts");

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain(
          "SEO title should be 60 characters or less",
        );
      });

      it("should warn about long SEO description", () => {
        const metadata = {
          ...validMetadata,
          seo: {
            title: "Valid title",
            description: "x".repeat(TEST_CONTENT_LIMITS.DESCRIPTION_MAX + 1), // Exceeds 160 character limit
          },
        };

        const result = validateContentMetadata(metadata, "posts");

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain(
          "SEO description should be 160 characters or less",
        );
      });

      it("should handle missing SEO object gracefully", () => {
        const { seo: _seo, ...metadataWithoutSeo } = validMetadata;
        const metadata = metadataWithoutSeo;

        const result = validateContentMetadata(metadata, "posts");

        expect(result.isValid).toBe(true);
        expect(result.warnings).not.toContain(expect.stringContaining("SEO"));
      });

      it("should handle null SEO object", () => {
        const metadata = { ...validMetadata, seo: null };

        const result = validateContentMetadata(metadata, "posts");

        expect(result.isValid).toBe(true);
        expect(result.warnings).not.toContain(expect.stringContaining("SEO"));
      });

      it("should handle SEO object with missing fields", () => {
        const metadata = { ...validMetadata, seo: {} };

        const result = validateContentMetadata(metadata, "posts");

        expect(result.isValid).toBe(true);
        expect(result.warnings).not.toContain(expect.stringContaining("SEO"));
      });

      it("should handle non-string SEO fields", () => {
        const metadata = {
          ...validMetadata,
          seo: {
            title: 123,
            description: true,
          },
        };

        const result = validateContentMetadata(metadata, "posts");

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
      });

      it("should handle metadata with unexpected fields", () => {
        const metadata = {
          ...validMetadata,
          unexpectedField: "some value",
          anotherField: 123,
        };

        const result = validateContentMetadata(metadata, "posts");

        expect(result.isValid).toBe(true);
      });

      it("should combine multiple errors and warnings", () => {
        const metadata = {
          publishedAt: "invalid-date",
          updatedAt: "also-invalid",
          seo: {
            title: "x".repeat(
              TEST_CONTENT_LIMITS.FUNCTION_MAX_LINES -
                TEST_COUNT_CONSTANTS.LARGE,
            ),
            description: "x".repeat(
              TEST_CONTENT_LIMITS.DESCRIPTION_MAX +
                TEST_CONTENT_LIMITS.MAX_NESTED_CALLBACKS *
                  TEST_COUNT_CONSTANTS.LARGE,
            ),
          },
        };

        const result = validateContentMetadata(metadata, "posts");

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(TEST_COUNT_CONSTANTS.TINY); // title, publishedAt, updatedAt
        expect(result.warnings).toHaveLength(TEST_COUNT_CONSTANTS.MEDIUM - 1); // excerpt, tags, seo title, seo description
      });
    });
  });
});
