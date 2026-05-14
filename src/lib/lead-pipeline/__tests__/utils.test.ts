/**
 * Lead Pipeline Utils Tests
 * Tests for utility functions
 */

import { describe, expect, it } from "vitest";
import {
  formatQuantity,
  generateLeadReferenceId,
  generateProductInquiryMessage,
  splitName,
} from "../utils";

describe("Lead Pipeline Utils", () => {
  describe("splitName", () => {
    it("should split two-word name into firstName and lastName", () => {
      const result = splitName("John Doe");
      expect(result).toEqual({ firstName: "John", lastName: "Doe" });
    });

    it("should handle single-word name (common for Chinese)", () => {
      const result = splitName("张三");
      expect(result).toEqual({ firstName: "张三", lastName: "" });
    });

    it("should handle three-word name (all but last becomes firstName)", () => {
      const result = splitName("John Van Doe");
      expect(result).toEqual({ firstName: "John Van", lastName: "Doe" });
    });

    it("should handle four-word name", () => {
      const result = splitName("Mary Jane Van Doe");
      expect(result).toEqual({ firstName: "Mary Jane Van", lastName: "Doe" });
    });

    it("should handle empty string", () => {
      const result = splitName("");
      expect(result).toEqual({ firstName: "", lastName: "" });
    });

    it("should handle whitespace-only string", () => {
      const result = splitName("   ");
      expect(result).toEqual({ firstName: "", lastName: "" });
    });

    it("should trim leading and trailing whitespace", () => {
      const result = splitName("  John Doe  ");
      expect(result).toEqual({ firstName: "John", lastName: "Doe" });
    });

    it("should handle multiple spaces between words", () => {
      const result = splitName("John    Doe");
      expect(result).toEqual({ firstName: "John", lastName: "Doe" });
    });

    it("should collapse repeated whitespace between more than two words", () => {
      const result = splitName("John   Van   Doe");
      expect(result).toEqual({ firstName: "John Van", lastName: "Doe" });
    });

    it("should handle Chinese full name with space", () => {
      const result = splitName("李 小明");
      expect(result).toEqual({ firstName: "李", lastName: "小明" });
    });

    it("should handle mixed language name", () => {
      const result = splitName("Michael 王");
      expect(result).toEqual({ firstName: "Michael", lastName: "王" });
    });
  });

  describe("formatQuantity", () => {
    it("should convert number to string", () => {
      expect(formatQuantity(100)).toBe("100");
    });

    it("should preserve string quantity", () => {
      expect(formatQuantity("500 units")).toBe("500 units");
    });

    it("should trim string quantity", () => {
      expect(formatQuantity("  100 pieces  ")).toBe("100 pieces");
    });

    it("should handle zero", () => {
      expect(formatQuantity(0)).toBe("0");
    });

    it("should handle decimal numbers", () => {
      expect(formatQuantity(10.5)).toBe("10.5");
    });
  });

  describe("generateProductInquiryMessage", () => {
    it("should generate message with product and quantity", () => {
      const message = generateProductInquiryMessage("Widget X", 100);
      expect(message).toBe("Product: Widget X\nQuantity: 100");
    });

    it("should include requirements when provided", () => {
      const message = generateProductInquiryMessage(
        "Widget X",
        "500 units",
        "Brand adaptation needed",
      );
      expect(message).toBe(
        "Product: Widget X\nQuantity: 500 units\nRequirements: Brand adaptation needed",
      );
    });

    it("should exclude requirements when empty", () => {
      const message = generateProductInquiryMessage("Widget X", 100, "");
      expect(message).toBe("Product: Widget X\nQuantity: 100");
    });

    it("should exclude requirements when whitespace only", () => {
      const message = generateProductInquiryMessage("Widget X", 100, "   ");
      expect(message).toBe("Product: Widget X\nQuantity: 100");
    });

    it("should trim requirements", () => {
      const message = generateProductInquiryMessage(
        "Widget X",
        100,
        "  Brand adaptation  ",
      );
      expect(message).toContain("Requirements: Brand adaptation");
    });
  });

  describe("generateLeadReferenceId", () => {
    it("should generate ID with correct prefix for contact", () => {
      const id = generateLeadReferenceId("contact");
      expect(id.startsWith("CON-")).toBe(true);
    });

    it("should generate ID with correct prefix for product", () => {
      const id = generateLeadReferenceId("product");
      expect(id.startsWith("PRO-")).toBe(true);
    });

    it("should generate ID with correct prefix for newsletter", () => {
      const id = generateLeadReferenceId("newsletter");
      expect(id.startsWith("NEW-")).toBe(true);
    });

    it("should generate unique IDs", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateLeadReferenceId("contact"));
      }
      expect(ids.size).toBe(100);
    });

    it("should match expected format", () => {
      const id = generateLeadReferenceId("contact");
      // Format: XXX-timestamp-random
      expect(id).toMatch(/^[A-Z]{3}-[a-z0-9]+-[a-z0-9]+$/);
    });
  });
});
