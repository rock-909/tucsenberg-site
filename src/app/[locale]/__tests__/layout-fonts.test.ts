import { describe, expect, it } from "vitest";
import {
  ibmPlexMono,
  ibmPlexSans,
  inter,
  getFontClassNames,
} from "@/app/[locale]/layout-fonts";

describe("Layout Fonts Configuration", () => {
  describe("IBM Plex Sans font", () => {
    it("should be configured with correct CSS variable", () => {
      expect(ibmPlexSans).toBeDefined();
      expect(ibmPlexSans.variable).toBe("--font-ibm-plex-sans");
    });

    it("should include required Next.js font properties", () => {
      expect(ibmPlexSans).toHaveProperty("variable");
      expect(ibmPlexSans).toHaveProperty("className");
      expect(ibmPlexSans).toHaveProperty("style");
    });

    it("should have correct style object", () => {
      expect(ibmPlexSans.style).toHaveProperty("fontFamily");
      expect(typeof ibmPlexSans.style.fontFamily).toBe("string");
    });

    it("should request the required Google font options", () => {
      expect(ibmPlexSans).toHaveProperty("options", {
        subsets: ["latin", "latin-ext"],
        weight: ["300", "400", "600"],
        display: "swap",
        variable: "--font-ibm-plex-sans",
      });
    });
  });

  describe("Inter font", () => {
    it("should be configured with correct CSS variable", () => {
      expect(inter).toBeDefined();
      expect(inter.variable).toBe("--font-inter");
    });

    it("should include required Next.js font properties", () => {
      expect(inter).toHaveProperty("variable");
      expect(inter).toHaveProperty("className");
      expect(inter).toHaveProperty("style");
    });

    it("should request the required Google font options", () => {
      expect(inter).toHaveProperty("options", {
        subsets: ["latin", "latin-ext"],
        weight: ["400", "600"],
        display: "swap",
        variable: "--font-inter",
      });
    });
  });

  describe("IBM Plex Mono font", () => {
    it("should be configured with correct CSS variable", () => {
      expect(ibmPlexMono).toBeDefined();
      expect(ibmPlexMono.variable).toBe("--font-ibm-plex-mono");
    });

    it("should include required Next.js font properties", () => {
      expect(ibmPlexMono).toHaveProperty("variable");
      expect(ibmPlexMono).toHaveProperty("className");
      expect(ibmPlexMono).toHaveProperty("style");
    });

    it("should request the required Google font options", () => {
      expect(ibmPlexMono).toHaveProperty("options", {
        subsets: ["latin", "latin-ext"],
        weight: ["400"],
        display: "swap",
        variable: "--font-ibm-plex-mono",
      });
    });
  });

  describe("getFontClassNames", () => {
    it("should return all font variables", () => {
      const classNames = getFontClassNames();

      expect(typeof classNames).toBe("string");
      expect(classNames.split(" ")).toEqual([
        "--font-ibm-plex-sans",
        "--font-inter",
        "--font-ibm-plex-mono",
      ]);
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
      expect(ibmPlexSans.variable).toMatch(/^--font-/);
      expect(inter.variable).toMatch(/^--font-/);
      expect(ibmPlexMono.variable).toMatch(/^--font-/);
    });
  });
});
