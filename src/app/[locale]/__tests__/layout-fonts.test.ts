import { describe, expect, it, vi } from "vitest";
import { IBM_Plex_Mono, IBM_Plex_Sans, Inter } from "next/font/google";

async function loadFonts() {
  vi.resetModules();
  vi.clearAllMocks();
  return import("@/app/[locale]/layout-fonts");
}

describe("Layout Fonts Configuration", () => {
  describe("IBM Plex Sans font", () => {
    it("should be configured with correct CSS variable", async () => {
      const { ibmPlexSans } = await loadFonts();

      expect(ibmPlexSans).toBeDefined();
      expect(ibmPlexSans.variable).toBe("__variable_ibm_plex_sans");
    });

    it("should include required Next.js font properties", async () => {
      const { ibmPlexSans } = await loadFonts();

      expect(ibmPlexSans).toHaveProperty("variable");
      expect(ibmPlexSans).toHaveProperty("className");
      expect(ibmPlexSans).toHaveProperty("style");
    });

    it("should have correct style object", async () => {
      const { ibmPlexSans } = await loadFonts();

      expect(ibmPlexSans.style).toHaveProperty("fontFamily");
      expect(typeof ibmPlexSans.style.fontFamily).toBe("string");
    });

    it("should request the required Google font options", async () => {
      await loadFonts();

      expect(IBM_Plex_Sans).toHaveBeenCalledWith({
        subsets: ["latin", "latin-ext"],
        weight: ["300", "400", "600"],
        display: "swap",
        variable: "--font-ibm-plex-sans",
      });
    });
  });

  describe("Inter font", () => {
    it("should be configured with correct CSS variable", async () => {
      const { inter } = await loadFonts();

      expect(inter).toBeDefined();
      expect(inter.variable).toBe("__variable_inter");
    });

    it("should include required Next.js font properties", async () => {
      const { inter } = await loadFonts();

      expect(inter).toHaveProperty("variable");
      expect(inter).toHaveProperty("className");
      expect(inter).toHaveProperty("style");
    });

    it("should request the required Google font options", async () => {
      await loadFonts();

      expect(Inter).toHaveBeenCalledWith({
        subsets: ["latin", "latin-ext"],
        weight: ["400", "600"],
        display: "swap",
        variable: "--font-inter",
      });
    });
  });

  describe("IBM Plex Mono font", () => {
    it("should be configured with correct CSS variable", async () => {
      const { ibmPlexMono } = await loadFonts();

      expect(ibmPlexMono).toBeDefined();
      expect(ibmPlexMono.variable).toBe("__variable_ibm_plex_mono");
    });

    it("should include required Next.js font properties", async () => {
      const { ibmPlexMono } = await loadFonts();

      expect(ibmPlexMono).toHaveProperty("variable");
      expect(ibmPlexMono).toHaveProperty("className");
      expect(ibmPlexMono).toHaveProperty("style");
    });

    it("should request the required Google font options", async () => {
      await loadFonts();

      expect(IBM_Plex_Mono).toHaveBeenCalledWith({
        subsets: ["latin", "latin-ext"],
        weight: ["400"],
        display: "swap",
        variable: "--font-ibm-plex-mono",
      });
    });
  });

  describe("getFontClassNames", () => {
    it("should return all font variables", async () => {
      const { getFontClassNames } = await loadFonts();
      const classNames = getFontClassNames();

      expect(typeof classNames).toBe("string");
      expect(classNames.split(" ")).toEqual([
        "__variable_ibm_plex_sans",
        "__variable_inter",
        "__variable_ibm_plex_mono",
      ]);
    });

    it("should not return className tokens", async () => {
      const { getFontClassNames } = await loadFonts();
      const classNames = getFontClassNames();

      expect(classNames).not.toContain("__className_ibm_plex_sans");
      expect(classNames).not.toContain("__className_inter");
      expect(classNames).not.toContain("__className_ibm_plex_mono");
    });

    it("should not return stale local font variables", async () => {
      const { getFontClassNames } = await loadFonts();
      const classNames = getFontClassNames();
      const staleFontTokens = [
        ["fig", "tree"].join(""),
        ["jetbrains", "Mono"].join(""),
        ["--font", ["fig", "tree"].join("")].join("-"),
        ["--font", ["jetbrains", "mono"].join("-")].join("-"),
      ];

      for (const staleFontToken of staleFontTokens) {
        expect(classNames).not.toContain(staleFontToken);
      }
    });

    it("should return consistent results", async () => {
      const { getFontClassNames } = await loadFonts();

      expect(getFontClassNames()).toBe(getFontClassNames());
    });

    it("should return non-empty string", async () => {
      const { getFontClassNames } = await loadFonts();
      const classNames = getFontClassNames();

      expect(classNames).toBeTruthy();
      expect(classNames.length).toBeGreaterThan(0);
    });

    it("should not have leading or trailing whitespace", async () => {
      const { getFontClassNames } = await loadFonts();
      const classNames = getFontClassNames();

      expect(classNames).not.toMatch(/^\s/);
      expect(classNames).not.toMatch(/\s$/);
    });

    it("should not have consecutive spaces", async () => {
      const { getFontClassNames } = await loadFonts();
      const classNames = getFontClassNames();

      expect(classNames).not.toMatch(/\s{2,}/);
    });
  });

  describe("font variable naming", () => {
    it("variables should use generated class token convention", async () => {
      const { ibmPlexMono, ibmPlexSans, inter } = await loadFonts();

      expect(ibmPlexSans.variable).toMatch(/^__variable_/);
      expect(inter.variable).toMatch(/^__variable_/);
      expect(ibmPlexMono.variable).toMatch(/^__variable_/);
    });
  });
});
