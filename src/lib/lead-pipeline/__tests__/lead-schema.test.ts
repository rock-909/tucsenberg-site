/**
 * Lead Schema Tests
 * Tests for unified lead pipeline Zod schemas
 */

import { describe, expect, it, vi } from "vitest";
import {
  contactLeadSchema,
  isContactLead,
  isNewsletterLead,
  isProductLead,
  LEAD_TYPES,
  leadSchema,
  newsletterLeadSchema,
  productLeadSchema,
  type ContactLeadInput,
  type NewsletterLeadInput,
  type ProductLeadInput,
} from "../lead-schema";

// Ensure real Zod is used, not mocked
vi.unmock("zod");

describe("Lead Schema", () => {
  describe("contactLeadSchema", () => {
    const validContactLead = {
      type: LEAD_TYPES.CONTACT,
      fullName: "John Doe",
      email: "john@example.com",
      subject: "Product inquiry",
      message: "This is a test message with enough characters.",
      turnstileToken: "valid-token",
      company: "Test Company",
      marketingConsent: true,
    };

    it("should validate a complete contact lead", () => {
      const result = contactLeadSchema.safeParse(validContactLead);
      expect(result.success).toBe(true);
    });

    it("should validate contact lead without optional fields", () => {
      const minimalLead = {
        type: LEAD_TYPES.CONTACT,
        fullName: "John Doe",
        email: "john@example.com",
        subject: "General question",
        message: "Test message with enough characters.",
        turnstileToken: "token",
      };
      const result = contactLeadSchema.safeParse(minimalLead);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.marketingConsent).toBe(false);
      }
    });

    it("should reject contact lead with invalid email", () => {
      const invalidLead = { ...validContactLead, email: "invalid-email" };
      const result = contactLeadSchema.safeParse(invalidLead);
      expect(result.success).toBe(false);
    });

    it("should reject contact lead with too short message", () => {
      const invalidLead = { ...validContactLead, message: "short" };
      const result = contactLeadSchema.safeParse(invalidLead);
      expect(result.success).toBe(false);
    });

    it("should reject contact lead with too-short subject", () => {
      const invalidLead = { ...validContactLead, subject: "Hey" };
      const result = contactLeadSchema.safeParse(invalidLead);
      expect(result.success).toBe(false);
    });

    it("should trim fullName", () => {
      const leadWithSpaces = { ...validContactLead, fullName: "  John Doe  " };
      const result = contactLeadSchema.safeParse(leadWithSpaces);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fullName).toBe("John Doe");
      }
    });

    it("should accept buyer-entered subject text", () => {
      const lead = {
        ...validContactLead,
        subject: "Need custom distributor website quote",
      };

      const result = contactLeadSchema.safeParse(lead);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.subject).toBe(
          "Need custom distributor website quote",
        );
      }
    });
  });

  describe("productLeadSchema", () => {
    const validProductLead = {
      type: LEAD_TYPES.PRODUCT,
      fullName: "Jane Smith",
      email: "jane@example.com",
      productSlug: "showcase-plan-basic",
      productName: "Showcase Plan Basic",
      quantity: "500 units",
      company: "Example Company",
      requirements: "Need brand adaptation",
      marketingConsent: false,
    };

    it("should validate a complete product lead", () => {
      const result = productLeadSchema.safeParse(validProductLead);
      expect(result.success).toBe(true);
    });

    it("should validate product lead with numeric quantity", () => {
      const leadWithNumericQty = { ...validProductLead, quantity: 100 };
      const result = productLeadSchema.safeParse(leadWithNumericQty);
      expect(result.success).toBe(true);
    });

    it("should reject non-positive or non-finite numeric quantities", () => {
      expect(
        productLeadSchema.safeParse({ ...validProductLead, quantity: 0 })
          .success,
      ).toBe(false);
      expect(
        productLeadSchema.safeParse({ ...validProductLead, quantity: -1 })
          .success,
      ).toBe(false);
      expect(
        productLeadSchema.safeParse({
          ...validProductLead,
          quantity: Number.POSITIVE_INFINITY,
        }).success,
      ).toBe(false);
    });

    it("should trim product slug and quantity strings", () => {
      const leadWithSpacing = {
        ...validProductLead,
        productSlug: "  showcase-plan-basic  ",
        quantity: "  500 units  ",
      };
      const result = productLeadSchema.safeParse(leadWithSpacing);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.productSlug).toBe("showcase-plan-basic");
        expect(result.data.quantity).toBe("500 units");
        expect(result.data.marketingConsent).toBe(false);
      }
    });

    it("should reject product lead without productSlug", () => {
      const { productSlug: _, ...invalidLead } = validProductLead;
      const result = productLeadSchema.safeParse(invalidLead);
      expect(result.success).toBe(false);
    });

    it("should reject non-string, non-number quantity values", () => {
      expect(
        productLeadSchema.safeParse({
          ...validProductLead,
          quantity: true,
        }).success,
      ).toBe(false);
      expect(
        productLeadSchema.safeParse({
          ...validProductLead,
          quantity: { value: 10 },
        }).success,
      ).toBe(false);
    });

    it("should reject product lead with a whitespace-only productSlug", () => {
      const invalidLead = { ...validProductLead, productSlug: "   " };
      const result = productLeadSchema.safeParse(invalidLead);
      expect(result.success).toBe(false);
    });

    it("should reject product lead without productName", () => {
      const { productName: _, ...invalidLead } = validProductLead;
      const result = productLeadSchema.safeParse(invalidLead);
      expect(result.success).toBe(false);
    });

    it("should accept product lead without optional requirements", () => {
      const { requirements: _, ...minimalLead } = validProductLead;
      const result = productLeadSchema.safeParse(minimalLead);
      expect(result.success).toBe(true);
    });

    it("should reject product lead with a whitespace-only quantity string", () => {
      const invalidLead = { ...validProductLead, quantity: "   " };
      const result = productLeadSchema.safeParse(invalidLead);
      expect(result.success).toBe(false);
    });

    it("should reject numeric quantity strings that are zero or negative", () => {
      const zeroQuantity = productLeadSchema.safeParse({
        ...validProductLead,
        quantity: "0",
      });
      const paddedZeroQuantity = productLeadSchema.safeParse({
        ...validProductLead,
        quantity: "00",
      });
      const decimalZeroQuantity = productLeadSchema.safeParse({
        ...validProductLead,
        quantity: "0.00",
      });
      const negativeQuantity = productLeadSchema.safeParse({
        ...validProductLead,
        quantity: "-1",
      });
      const negativeDecimalQuantity = productLeadSchema.safeParse({
        ...validProductLead,
        quantity: "-0.5",
      });

      expect(zeroQuantity.success).toBe(false);
      expect(paddedZeroQuantity.success).toBe(false);
      expect(decimalZeroQuantity.success).toBe(false);
      expect(negativeQuantity.success).toBe(false);
      expect(negativeDecimalQuantity.success).toBe(false);
      if (
        !zeroQuantity.success &&
        !paddedZeroQuantity.success &&
        !decimalZeroQuantity.success &&
        !negativeQuantity.success &&
        !negativeDecimalQuantity.success
      ) {
        expect(zeroQuantity.error.issues[0]?.message).toBe(
          "Quantity must be positive when using a numeric string",
        );
        expect(paddedZeroQuantity.error.issues[0]?.message).toBe(
          "Quantity must be positive when using a numeric string",
        );
        expect(decimalZeroQuantity.error.issues[0]?.message).toBe(
          "Quantity must be positive when using a numeric string",
        );
        expect(negativeQuantity.error.issues[0]?.message).toBe(
          "Quantity must be positive when using a numeric string",
        );
        expect(negativeDecimalQuantity.error.issues[0]?.message).toBe(
          "Quantity must be positive when using a numeric string",
        );
      }
    });

    it("should still accept descriptive quantity strings and positive numeric strings", () => {
      const singleDigitQuantity = productLeadSchema.safeParse({
        ...validProductLead,
        quantity: "1",
      });
      const numericStringQuantity = productLeadSchema.safeParse({
        ...validProductLead,
        quantity: "12",
      });
      const descriptiveQuantity = productLeadSchema.safeParse({
        ...validProductLead,
        quantity: "500 units per month",
      });
      const trailingNumericDescription = productLeadSchema.safeParse({
        ...validProductLead,
        quantity: "approx 500",
      });

      expect(singleDigitQuantity.success).toBe(true);
      expect(numericStringQuantity.success).toBe(true);
      expect(descriptiveQuantity.success).toBe(true);
      expect(trailingNumericDescription.success).toBe(true);
      if (
        singleDigitQuantity.success &&
        numericStringQuantity.success &&
        descriptiveQuantity.success &&
        trailingNumericDescription.success
      ) {
        expect(singleDigitQuantity.data.quantity).toBe("1");
        expect(typeof singleDigitQuantity.data.quantity).toBe("string");
        expect(numericStringQuantity.data.quantity).toBe("12");
        expect(typeof numericStringQuantity.data.quantity).toBe("string");
        expect(descriptiveQuantity.data.quantity).toBe("500 units per month");
        expect(trailingNumericDescription.data.quantity).toBe("approx 500");
      }
    });
  });

  describe("newsletterLeadSchema", () => {
    it("should validate a valid newsletter subscription", () => {
      const validNewsletter = {
        type: LEAD_TYPES.NEWSLETTER,
        email: "subscriber@example.com",
      };
      const result = newsletterLeadSchema.safeParse(validNewsletter);
      expect(result.success).toBe(true);
    });

    it("should reject newsletter with invalid email", () => {
      const invalidNewsletter = {
        type: LEAD_TYPES.NEWSLETTER,
        email: "not-an-email",
      };
      const result = newsletterLeadSchema.safeParse(invalidNewsletter);
      expect(result.success).toBe(false);
    });

    it("should reject newsletter without email", () => {
      const invalidNewsletter = { type: LEAD_TYPES.NEWSLETTER };
      const result = newsletterLeadSchema.safeParse(invalidNewsletter);
      expect(result.success).toBe(false);
    });
  });

  describe("leadSchema (discriminated union)", () => {
    it("should correctly discriminate contact lead", () => {
      const contactLead = {
        type: LEAD_TYPES.CONTACT,
        fullName: "Test User",
        email: "test@example.com",
        subject: "General question",
        message: "Test message with enough length.",
        turnstileToken: "token",
      };
      const result = leadSchema.safeParse(contactLead);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe(LEAD_TYPES.CONTACT);
      }
    });

    it("should correctly discriminate product lead", () => {
      const productLead = {
        type: LEAD_TYPES.PRODUCT,
        fullName: "Test User",
        email: "test@example.com",
        productSlug: "test-product",
        productName: "Test Product",
        quantity: 10,
      };
      const result = leadSchema.safeParse(productLead);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe(LEAD_TYPES.PRODUCT);
      }
    });

    it("should correctly discriminate newsletter lead", () => {
      const newsletterLead = {
        type: LEAD_TYPES.NEWSLETTER,
        email: "test@example.com",
      };
      const result = leadSchema.safeParse(newsletterLead);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe(LEAD_TYPES.NEWSLETTER);
      }
    });

    it("should reject unknown lead type", () => {
      const invalidLead = {
        type: "unknown",
        email: "test@example.com",
      };
      const result = leadSchema.safeParse(invalidLead);
      expect(result.success).toBe(false);
    });

    it("should keep all three discriminated union variants registered", () => {
      expect(leadSchema.options).toHaveLength(3);
    });
  });

  describe("Type Guards", () => {
    it("isContactLead should correctly identify contact leads", () => {
      const contactLead: ContactLeadInput = {
        type: LEAD_TYPES.CONTACT,
        fullName: "Test",
        email: "test@example.com",
        subject: "General question",
        message: "Test message.",
        turnstileToken: "token",
        marketingConsent: false,
      };
      expect(isContactLead(contactLead)).toBe(true);
      expect(isProductLead(contactLead)).toBe(false);
      expect(isNewsletterLead(contactLead)).toBe(false);
    });

    it("isProductLead should correctly identify product leads", () => {
      const productLead: ProductLeadInput = {
        type: LEAD_TYPES.PRODUCT,
        fullName: "Test",
        email: "test@example.com",
        productSlug: "test",
        productName: "Test",
        quantity: 1,
        marketingConsent: false,
      };
      expect(isProductLead(productLead)).toBe(true);
      expect(isContactLead(productLead)).toBe(false);
      expect(isNewsletterLead(productLead)).toBe(false);
    });

    it("isNewsletterLead should correctly identify newsletter leads", () => {
      const newsletterLead: NewsletterLeadInput = {
        type: LEAD_TYPES.NEWSLETTER,
        email: "test@example.com",
      };
      expect(isNewsletterLead(newsletterLead)).toBe(true);
      expect(isContactLead(newsletterLead)).toBe(false);
      expect(isProductLead(newsletterLead)).toBe(false);
    });
  });
});
