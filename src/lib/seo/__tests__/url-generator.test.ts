/**
 * SEO URL 生成器单元测试
 */

import { describe, expect, it } from "vitest";
import {
  generateCanonicalURL,
  generateLanguageAlternates,
} from "@/lib/seo/url-generator";

describe("generateCanonicalURL", () => {
  it("should generate correct canonical URL for content pages", () => {
    expect(generateCanonicalURL("about", "en")).toBe(
      "https://example.com/about",
    );
  });

  it("should generate correct canonical URL for the home page", () => {
    expect(generateCanonicalURL("home", "en")).toBe("https://example.com/");
  });
});

describe("generateLanguageAlternates", () => {
  it("should generate alternates for all supported languages including x-default", () => {
    expect(generateLanguageAlternates("about")).toEqual({
      en: "https://example.com/about",
      "x-default": "https://example.com/about",
    });
  });

  it("should point x-default at the default locale", () => {
    const alternates = generateLanguageAlternates("home");

    expect(alternates["x-default"]).toBe("https://example.com/");
    expect(alternates["x-default"]).toBe(alternates["en"]);
  });
});
