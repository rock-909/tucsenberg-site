import { describe, expect, it } from "vitest";
import {
  getBlurPlaceholder,
  NEUTRAL_BLUR_DATA_URL,
  SHIMMER_BLUR_DATA_URL,
} from "../blur-placeholder";

describe("blur-placeholder", () => {
  describe("SHIMMER_BLUR_DATA_URL", () => {
    it("should be a valid data URL", () => {
      expect(SHIMMER_BLUR_DATA_URL).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    it("should contain base64 encoded SVG", () => {
      const base64Part = SHIMMER_BLUR_DATA_URL.replace(
        "data:image/svg+xml;base64,",
        "",
      );
      const decoded = Buffer.from(base64Part, "base64").toString("utf-8");
      expect(decoded).toContain("<svg");
      expect(decoded).toContain("</svg>");
    });
  });

  describe("NEUTRAL_BLUR_DATA_URL", () => {
    it("should be a valid data URL", () => {
      expect(NEUTRAL_BLUR_DATA_URL).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    it("should contain base64 encoded SVG", () => {
      const base64Part = NEUTRAL_BLUR_DATA_URL.replace(
        "data:image/svg+xml;base64,",
        "",
      );
      const decoded = Buffer.from(base64Part, "base64").toString("utf-8");
      expect(decoded).toContain("<svg");
      expect(decoded).toContain("rect");
    });
  });

  describe("getBlurPlaceholder", () => {
    it("should return neutral placeholder by default", () => {
      const result = getBlurPlaceholder();

      expect(result).toEqual({
        placeholder: "blur",
        blurDataURL: NEUTRAL_BLUR_DATA_URL,
      });
    });

    it("should return neutral placeholder when variant is neutral", () => {
      const result = getBlurPlaceholder("neutral");

      expect(result).toEqual({
        placeholder: "blur",
        blurDataURL: NEUTRAL_BLUR_DATA_URL,
      });
    });

    it("should return shimmer placeholder when variant is shimmer", () => {
      const result = getBlurPlaceholder("shimmer");

      expect(result).toEqual({
        placeholder: "blur",
        blurDataURL: SHIMMER_BLUR_DATA_URL,
      });
    });

    it("should return config compatible with Next.js Image props", () => {
      const result = getBlurPlaceholder();

      expect(result.placeholder).toBe("blur");
      expect(typeof result.blurDataURL).toBe("string");
      expect(result.blurDataURL.startsWith("data:")).toBe(true);
    });
  });
});
