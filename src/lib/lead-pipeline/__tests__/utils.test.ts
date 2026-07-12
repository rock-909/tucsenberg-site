/**
 * Lead Pipeline Utils Tests
 * Tests for utility functions
 */

import { describe, expect, it } from "vitest";
import {
  composeInquiryDescription,
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
      const message = generateProductInquiryMessage({
        productName: "Widget X",
        quantity: 100,
      });
      expect(message).toBe("Product: Widget X\nQuantity: 100");
    });

    it("should omit quantity when absent (general RFQ)", () => {
      const message = generateProductInquiryMessage({
        productName: "General RFQ (no catalog product)",
      });
      expect(message).toBe("Product: General RFQ (no catalog product)");
    });

    it("should include buyer interest as description, after quantity", () => {
      const message = generateProductInquiryMessage({
        productName: "Widget X",
        quantity: "500 units",
        buyerInterest: "Aluminum flood gates",
      });
      expect(message).toBe(
        "Product: Widget X\nQuantity: 500 units\nInterest: Aluminum flood gates",
      );
    });

    it("should include requirements when provided", () => {
      const message = generateProductInquiryMessage({
        productName: "Widget X",
        quantity: "500 units",
        requirements: "Brand adaptation needed",
      });
      expect(message).toBe(
        "Product: Widget X\nQuantity: 500 units\nRequirements: Brand adaptation needed",
      );
    });

    it("should exclude requirements when empty or whitespace only", () => {
      expect(
        generateProductInquiryMessage({
          productName: "Widget X",
          quantity: 100,
          requirements: "",
        }),
      ).toBe("Product: Widget X\nQuantity: 100");
      expect(
        generateProductInquiryMessage({
          productName: "Widget X",
          quantity: 100,
          requirements: "   ",
        }),
      ).toBe("Product: Widget X\nQuantity: 100");
    });

    it("should trim requirements", () => {
      const message = generateProductInquiryMessage({
        productName: "Widget X",
        quantity: 100,
        requirements: "  Brand adaptation  ",
      });
      expect(message).toContain("Requirements: Brand adaptation");
    });
  });

  describe("composeInquiryDescription", () => {
    it("labels buyer interest and appends requirements", () => {
      expect(
        composeInquiryDescription({
          buyerInterest: "Aluminum flood gates",
          requirements: "Need custom height",
        }),
      ).toBe("Interest: Aluminum flood gates\nNeed custom height");
    });

    it("returns undefined when neither is provided", () => {
      expect(composeInquiryDescription({})).toBeUndefined();
      expect(
        composeInquiryDescription({ buyerInterest: "  ", requirements: "  " }),
      ).toBeUndefined();
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
