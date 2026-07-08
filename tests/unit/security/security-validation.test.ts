import { describe, expect, it } from "vitest";
import {
  isValidEmail,
  isValidJson,
  isValidPhoneNumber,
  isValidUrl,
  sanitizeFilePath,
  sanitizeHtml,
  sanitizePlainText,
  validateCharacters,
  validateInputLength,
} from "@/lib/security/validation";

describe("security-validation", () => {
  it("sanitizes html and input payloads", () => {
    expect(
      sanitizeHtml('<script>alert(1)</script><div onclick="x">ok</div>'),
    ).not.toContain("script");
    expect(sanitizePlainText("<img onerror=alert(1)>")).toBe(
      "<img onerror=alert(1)>",
    );
    expect(sanitizePlainText("width < 900mm, > 5 units")).toBe(
      "width < 900mm, > 5 units",
    );
    expect(sanitizePlainText("see product metadata: sheet")).toBe(
      "see product metadata: sheet",
    );
    expect(sanitizePlainText("  a\n\n b  ")).toBe("a b");
  });

  it("validates url/email/phone patterns", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("javascript:alert(1)")).toBe(false);
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("bad-email")).toBe(false);
    expect(isValidPhoneNumber("+8613012345678")).toBe(true);
    expect(isValidPhoneNumber("123abc")).toBe(false);
  });

  it("enforces length and character constraints", () => {
    expect(validateInputLength("abc", 2, 5).valid).toBe(true);
    expect(validateInputLength("a", 2, 5).valid).toBe(false);
    expect(validateInputLength("abcdef", 2, 5).valid).toBe(false);

    const alphaOnly = /^[a-z]+$/;
    expect(validateCharacters("safe", alphaOnly).valid).toBe(true);
    expect(validateCharacters("unsafe123", alphaOnly).valid).toBe(false);
  });

  it("sanitizes file paths and validates json", () => {
    expect(sanitizeFilePath("../etc/passwd")).toBe("etc/passwd");
    expect(isValidJson('{"a":1}')).toBe(true);
    expect(isValidJson("{invalid}")).toBe(false);
  });
});
