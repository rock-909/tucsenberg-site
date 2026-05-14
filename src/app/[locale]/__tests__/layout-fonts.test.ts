import { describe, expect, it } from "vitest";
import {
  figtree,
  jetbrainsMono,
  getFontClassNames,
} from "@/app/[locale]/layout-fonts";

describe("Layout Fonts Configuration", () => {
  describe("figtree font", () => {
    it("should be configured with correct CSS variable", () => {
      expect(figtree).toBeDefined();
      expect(figtree.variable).toBe("--font-figtree");
    });

    it("should include required Next.js font properties", () => {
      expect(figtree).toHaveProperty("variable");
      expect(figtree).toHaveProperty("className");
      expect(figtree).toHaveProperty("style");
    });

    it("should have correct style object", () => {
      expect(figtree.style).toHaveProperty("fontFamily");
      expect(typeof figtree.style.fontFamily).toBe("string");
    });
  });

  describe("jetbrainsMono font", () => {
    it("should be configured with correct CSS variable", () => {
      expect(jetbrainsMono).toBeDefined();
      expect(jetbrainsMono.variable).toBe("--font-jetbrains-mono");
    });

    it("should include required Next.js font properties", () => {
      expect(jetbrainsMono).toHaveProperty("variable");
      expect(jetbrainsMono).toHaveProperty("className");
      expect(jetbrainsMono).toHaveProperty("style");
    });
  });

  describe("getFontClassNames", () => {
    it("should return both font variables", () => {
      const classNames = getFontClassNames();

      expect(typeof classNames).toBe("string");
      expect(classNames).toContain("--font-figtree");
      expect(classNames).toContain("--font-jetbrains-mono");
    });

    it("should return consistent results", () => {
      expect(getFontClassNames()).toBe(getFontClassNames());
    });

    it("should return non-empty string", () => {
      const classNames = getFontClassNames();
      expect(classNames).toBeTruthy();
      expect(classNames.length).toBeGreaterThan(0);
    });

    it("should not have leading or trailing whitespace", () => {
      const classNames = getFontClassNames();
      expect(classNames).not.toMatch(/^\s/);
      expect(classNames).not.toMatch(/\s$/);
    });

    it("should not have consecutive spaces", () => {
      const classNames = getFontClassNames();
      expect(classNames).not.toMatch(/\s{2,}/);
    });
  });

  describe("font variable naming", () => {
    it("variables should follow CSS custom property convention", () => {
      expect(figtree.variable).toMatch(/^--font-/);
      expect(jetbrainsMono.variable).toMatch(/^--font-/);
    });
  });
});
