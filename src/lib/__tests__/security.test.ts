import { describe, expect, it } from "vitest";
import {
  isValidEmail,
  isValidUrl,
  sanitizePlainText,
} from "@/lib/security/validation";

describe("Security Utils", () => {
  describe("sanitizePlainText", () => {
    it("should remove dangerous characters", () => {
      expect(sanitizePlainText('<script>alert("xss")</script>')).toBe(
        'scriptalert("xss")/script',
      );
      expect(sanitizePlainText('javascript:alert("xss")')).toBe('alert("xss")');
      expect(sanitizePlainText('onclick=alert("xss")')).toBe('alert("xss")');
      expect(
        sanitizePlainText('data:text/html,<script>alert("xss")</script>'),
      ).toBe('text/html,scriptalert("xss")/script');
    });

    it("should handle non-string input", () => {
      expect(sanitizePlainText(null as unknown as string)).toBe("");
      expect(sanitizePlainText(undefined as unknown as string)).toBe("");
      expect(sanitizePlainText(123 as unknown as string)).toBe("");
    });

    it("should preserve safe content", () => {
      expect(sanitizePlainText("Hello World")).toBe("Hello World");
      expect(sanitizePlainText("user@example.com")).toBe("user@example.com");
      expect(sanitizePlainText("Some text with spaces")).toBe(
        "Some text with spaces",
      );
    });
  });

  describe("isValidEmail", () => {
    it("should validate correct email addresses", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("test.email+tag@domain.co.uk")).toBe(true);
      expect(isValidEmail("user123@test-domain.org")).toBe(true);
    });

    it("should reject invalid email addresses", () => {
      expect(isValidEmail("invalid-email")).toBe(false);
      expect(isValidEmail("@domain.com")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
      expect(isValidEmail("user@domain")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });

    it("should reject emails that are too long", () => {
      const longEmail = `${"a".repeat(250)}@example.com`;
      expect(isValidEmail(longEmail)).toBe(false);
    });
  });

  describe("isValidUrl", () => {
    it("should validate correct URLs", () => {
      expect(isValidUrl("https://example.com")).toBe(true);
      expect(isValidUrl("http://localhost:3000")).toBe(true);
      expect(isValidUrl("https://sub.domain.com/path?query=value")).toBe(true);
    });

    it("should reject invalid URLs", () => {
      expect(isValidUrl("not-a-url")).toBe(false);
      expect(isValidUrl("ftp://example.com")).toBe(false);
      expect(isValidUrl('javascript:alert("xss")')).toBe(false);
    });

    it("should respect allowed protocols", () => {
      expect(isValidUrl("ftp://example.com", ["ftp:"])).toBe(true);
      expect(isValidUrl("https://example.com", ["http:"])).toBe(false);
    });
  });
});
