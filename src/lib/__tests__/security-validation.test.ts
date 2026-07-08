import { describe, expect, it } from "vitest";
import {
  isValidEmail,
  isValidJson,
  isValidPhoneNumber,
  isValidUrl,
  sanitizeFilePath,
  sanitizeHtml,
  sanitizePlainText,
  sanitizeUrl,
  validateCharacters,
  validateInputLength,
} from "@/lib/security/validation";

describe("security-validation", () => {
  describe("sanitizePlainText", () => {
    it("should preserve angle brackets", () => {
      expect(sanitizePlainText("<script>")).toBe("<script>");
      expect(sanitizePlainText("test<div>content</div>")).toBe(
        "test<div>content</div>",
      );
    });

    it("should preserve javascript-like protocol text", () => {
      expect(sanitizePlainText("javascript:alert(1)")).toBe(
        "javascript:alert(1)",
      );
      expect(sanitizePlainText("JAVASCRIPT:void(0)")).toBe(
        "JAVASCRIPT:void(0)",
      );
    });

    it("should preserve event-handler-like text", () => {
      expect(sanitizePlainText("onclick=alert(1)")).toBe("onclick=alert(1)");
      expect(sanitizePlainText('onmouseover="evil()"')).toBe(
        'onmouseover="evil()"',
      );
      expect(sanitizePlainText("ONERROR=hack")).toBe("ONERROR=hack");
    });

    it("should preserve data-like protocol text", () => {
      expect(sanitizePlainText("data:text/html")).toBe("data:text/html");
      expect(sanitizePlainText("DATA:image/png")).toBe("DATA:image/png");
    });

    it("should trim whitespace", () => {
      expect(sanitizePlainText("  test  ")).toBe("test");
      expect(sanitizePlainText("  a\n\n b  ")).toBe("a b");
    });

    it("should return empty string for non-string input", () => {
      expect(sanitizePlainText(123 as unknown as string)).toBe("");
      expect(sanitizePlainText(null as unknown as string)).toBe("");
      expect(sanitizePlainText(undefined as unknown as string)).toBe("");
    });

    it("should preserve combined plain text input", () => {
      expect(
        sanitizePlainText("<script>javascript:onclick=alert(1)</script>"),
      ).toBe("<script>javascript:onclick=alert(1)</script>");
    });

    it("should preserve buyer inquiry specification text", () => {
      expect(sanitizePlainText("width < 900mm, > 5 units")).toBe(
        "width < 900mm, > 5 units",
      );
      expect(sanitizePlainText("see product metadata: sheet")).toBe(
        "see product metadata: sheet",
      );
    });
  });

  describe("sanitizeUrl", () => {
    it("should return valid https URL unchanged", () => {
      expect(sanitizeUrl("https://example.com")).toBe("https://example.com");
      expect(sanitizeUrl("https://example.com/path?query=value")).toBe(
        "https://example.com/path?query=value",
      );
    });

    it("should return valid http URL unchanged", () => {
      expect(sanitizeUrl("http://example.com")).toBe("http://example.com");
    });

    it("should return empty string for javascript: protocol", () => {
      expect(sanitizeUrl("javascript:alert(1)")).toBe("");
      expect(sanitizeUrl("JAVASCRIPT:void(0)")).toBe("");
    });

    it("should return empty string for data: protocol", () => {
      expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBe("");
    });

    it("should return empty string for file: protocol", () => {
      expect(sanitizeUrl("file:///etc/passwd")).toBe("");
    });

    it("should return empty string for invalid URLs", () => {
      expect(sanitizeUrl("not-a-url")).toBe("");
      expect(sanitizeUrl("://missing-protocol.com")).toBe("");
    });

    it("should return empty string for non-string input", () => {
      expect(sanitizeUrl(123 as unknown as string)).toBe("");
      expect(sanitizeUrl(null as unknown as string)).toBe("");
      expect(sanitizeUrl(undefined as unknown as string)).toBe("");
    });

    it("should allow empty string (for optional URL fields)", () => {
      expect(sanitizeUrl("")).toBe("");
      expect(sanitizeUrl("   ")).toBe("");
    });

    it("should trim whitespace from valid URLs", () => {
      expect(sanitizeUrl("  https://example.com  ")).toBe(
        "https://example.com",
      );
    });

    it("should support custom allowed protocols", () => {
      expect(sanitizeUrl("ftp://example.com", ["ftp:"])).toBe(
        "ftp://example.com",
      );
      expect(sanitizeUrl("mailto:test@example.com", ["mailto:"])).toBe(
        "mailto:test@example.com",
      );
    });
  });

  describe("isValidEmail", () => {
    it("should return true for valid emails", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
      expect(isValidEmail("user+tag@example.org")).toBe(true);
    });

    it("should return false for invalid emails", () => {
      expect(isValidEmail("notanemail")).toBe(false);
      expect(isValidEmail("missing@domain")).toBe(false);
      expect(isValidEmail("@nodomain.com")).toBe(false);
      expect(isValidEmail("spaces in@email.com")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });

    it("should reject emails exceeding max length", () => {
      const longEmail = `${"a".repeat(300)}@example.com`;
      expect(isValidEmail(longEmail)).toBe(false);
    });
  });

  describe("isValidUrl", () => {
    it("should return true for valid http/https URLs", () => {
      expect(isValidUrl("https://example.com")).toBe(true);
      expect(isValidUrl("http://example.com")).toBe(true);
      expect(isValidUrl("https://sub.domain.com/path?query=value")).toBe(true);
    });

    it("should return false for invalid URLs", () => {
      expect(isValidUrl("not-a-url")).toBe(false);
      expect(isValidUrl("//missing-protocol.com")).toBe(false);
    });

    it("should reject disallowed protocols by default", () => {
      expect(isValidUrl("ftp://example.com")).toBe(false);
      expect(isValidUrl("javascript:alert(1)")).toBe(false);
      expect(isValidUrl("file:///etc/passwd")).toBe(false);
    });

    it("should allow custom protocols", () => {
      expect(isValidUrl("ftp://example.com", ["ftp:"])).toBe(true);
      expect(isValidUrl("mailto:test@example.com", ["mailto:"])).toBe(true);
    });

    it("should handle URL parsing errors gracefully", () => {
      expect(isValidUrl("")).toBe(false);
    });
  });

  describe("sanitizeFilePath", () => {
    it("should remove parent directory references", () => {
      expect(sanitizeFilePath("../../../etc/passwd")).toBe("etc/passwd");
      // Note: Implementation removes ".." but leaves slashes
      expect(sanitizeFilePath("foo/../bar")).toBe("foo//bar");
    });

    it("should remove invalid filename characters", () => {
      expect(sanitizeFilePath("file<name>.txt")).toBe("filename.txt");
      expect(sanitizeFilePath("path:to:file")).toBe("pathtofile");
      expect(sanitizeFilePath('file"name')).toBe("filename");
      expect(sanitizeFilePath("file|pipe")).toBe("filepipe");
      expect(sanitizeFilePath("file?query")).toBe("filequery");
      expect(sanitizeFilePath("file*star")).toBe("filestar");
    });

    it("should remove leading slashes", () => {
      expect(sanitizeFilePath("/etc/passwd")).toBe("etc/passwd");
      expect(sanitizeFilePath("///multiple")).toBe("multiple");
    });

    it("should trim whitespace", () => {
      expect(sanitizeFilePath("  path/to/file  ")).toBe("path/to/file");
    });

    it("should return empty string for non-string input", () => {
      expect(sanitizeFilePath(123 as unknown as string)).toBe("");
      expect(sanitizeFilePath(null as unknown as string)).toBe("");
    });
  });

  describe("validateInputLength", () => {
    it("should return valid for input within bounds", () => {
      const result = validateInputLength("test", 1, 10);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should return error for input too short", () => {
      const result = validateInputLength("ab", 5, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("at least 5 characters");
    });

    it("should return error for input too long", () => {
      const result = validateInputLength("a".repeat(20), 1, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("no more than 10 characters");
    });

    it("should use default max length when not specified", () => {
      // Default max is ANIMATION_DURATION_VERY_SLOW = 1000
      const result = validateInputLength("test");
      expect(result.valid).toBe(true);
    });

    it("should return error for non-string input", () => {
      const result = validateInputLength(123 as unknown as string);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Input must be a string");
    });

    it("should handle edge cases at boundaries", () => {
      expect(validateInputLength("12345", 5, 5).valid).toBe(true);
      expect(validateInputLength("1234", 5, 5).valid).toBe(false);
      expect(validateInputLength("123456", 5, 5).valid).toBe(false);
    });

    it("should handle empty string with minLength 0", () => {
      const result = validateInputLength("", 0, 10);
      expect(result.valid).toBe(true);
    });
  });

  describe("validateCharacters", () => {
    it("should return valid for allowed characters", () => {
      const result = validateCharacters("abc123", /^[a-z0-9]+$/);
      expect(result.valid).toBe(true);
    });

    it("should return error for disallowed characters", () => {
      const result = validateCharacters("abc!@#", /^[a-z0-9]+$/);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Input contains invalid characters");
    });

    it("should return error for non-string input", () => {
      const result = validateCharacters(123 as unknown as string, /^[a-z]+$/);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Input must be a string");
    });

    it("should work with various patterns", () => {
      expect(validateCharacters("test@email.com", /^[\w.@]+$/).valid).toBe(
        true,
      );
      expect(validateCharacters("123-456-7890", /^[\d-]+$/).valid).toBe(true);
      expect(validateCharacters("UPPERCASE", /^[A-Z]+$/).valid).toBe(true);
    });
  });

  describe("isValidPhoneNumber", () => {
    it("should return true for valid phone numbers", () => {
      expect(isValidPhoneNumber("+1234567890")).toBe(true);
      expect(isValidPhoneNumber("1234567890")).toBe(true);
      expect(isValidPhoneNumber("+86 138 0000 0000")).toBe(true);
    });

    it("should handle formatted phone numbers", () => {
      expect(isValidPhoneNumber("(123) 456-7890")).toBe(true);
      expect(isValidPhoneNumber("123-456-7890")).toBe(true);
      expect(isValidPhoneNumber("123 456 7890")).toBe(true);
    });

    it("should return false for invalid phone numbers", () => {
      expect(isValidPhoneNumber("")).toBe(false);
      expect(isValidPhoneNumber("abc")).toBe(false);
      expect(isValidPhoneNumber("0")).toBe(false); // starts with 0
    });

    it("should handle international format", () => {
      expect(isValidPhoneNumber("+447700900000")).toBe(true);
      expect(isValidPhoneNumber("+8613800138000")).toBe(true);
    });
  });

  describe("sanitizeHtml", () => {
    it("should remove script tags", () => {
      expect(sanitizeHtml("<script>alert(1)</script>")).toBe("");
      expect(sanitizeHtml("before<script>evil()</script>after")).toBe(
        "beforeafter",
      );
    });

    it("should remove script tags with mixed casing, attributes, and missing closing tags", () => {
      expect(
        sanitizeHtml('safe<ScRiPt type="text/javascript">evil()</sCrIpT>text'),
      ).toBe("safetext");
      expect(sanitizeHtml('before<script src="evil.js">after')).toBe("before");
    });

    it("should remove nested script tags without preserving attacker payloads", () => {
      expect(
        sanitizeHtml(
          "before<script>one<script>two</script>three</script>after",
        ),
      ).toBe("beforeafter");
    });

    it("should not treat script text literals as nested tags", () => {
      expect(
        sanitizeHtml('before<script>const x = "<script>";</script>after'),
      ).toBe("beforeafter");
      expect(
        sanitizeHtml(
          'before<script>const x = "</script><script>alert(1)</script>";</script>after',
        ),
      ).toBe("beforeafter");
    });

    it("should remove iframe tags", () => {
      expect(sanitizeHtml('<iframe src="evil.com"></iframe>')).toBe("");
      expect(sanitizeHtml("test<iframe></iframe>content")).toBe("testcontent");
    });

    it("should remove iframe tags with mixed casing, attributes, and missing closing tags", () => {
      expect(sanitizeHtml('safe<IFRAME src="evil.com">bad</iframe>text')).toBe(
        "safetext",
      );
      expect(sanitizeHtml('before<iframe src="evil.com">after')).toBe("before");
    });

    it("should remove event handlers", () => {
      expect(sanitizeHtml('<img onerror="alert(1)">')).toBe("<img >");
      expect(sanitizeHtml('<div onclick="evil()">text</div>')).toBe(
        "<div >text</div>",
      );
      expect(sanitizeHtml("<img onerror=alert(1)>")).toBe("<img >");
      expect(sanitizeHtml("<svg onload=alert(1)>")).toBe("<svg >");
    });

    it("should remove javascript: protocol", () => {
      expect(sanitizeHtml('<a href="javascript:alert(1)">link</a>')).toBe(
        '<a href="alert(1)">link</a>',
      );
    });

    it("should remove data: protocol", () => {
      expect(sanitizeHtml('<img src="data:image/png;base64,xxx">')).toBe(
        '<img src="image/png;base64,xxx">',
      );
    });

    it("should return empty string for non-string input", () => {
      expect(sanitizeHtml(123 as unknown as string)).toBe("");
      expect(sanitizeHtml(null as unknown as string)).toBe("");
    });

    it("should preserve safe HTML", () => {
      expect(sanitizeHtml("<p>Hello <strong>World</strong></p>")).toBe(
        "<p>Hello <strong>World</strong></p>",
      );
    });
  });

  describe("isValidJson", () => {
    it("should return true for valid JSON", () => {
      expect(isValidJson("{}")).toBe(true);
      expect(isValidJson("[]")).toBe(true);
      expect(isValidJson('{"key": "value"}')).toBe(true);
      expect(isValidJson("[1, 2, 3]")).toBe(true);
      expect(isValidJson('"string"')).toBe(true);
      expect(isValidJson("null")).toBe(true);
      expect(isValidJson("123")).toBe(true);
      expect(isValidJson("true")).toBe(true);
    });

    it("should return false for invalid JSON", () => {
      expect(isValidJson("")).toBe(false);
      expect(isValidJson("{invalid}")).toBe(false);
      expect(isValidJson("{'single': 'quotes'}")).toBe(false);
      expect(isValidJson('{key: "unquoted key"}')).toBe(false);
      expect(isValidJson("undefined")).toBe(false);
    });
  });
});
