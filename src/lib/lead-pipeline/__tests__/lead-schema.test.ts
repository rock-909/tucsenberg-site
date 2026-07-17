/**
 * Lead Schema Tests
 * Tests for unified lead pipeline Zod schemas
 */

import { describe, expect, it } from "vitest";
import { CONTACT_FORM_VALIDATION_CONSTANTS } from "@/config/contact-form-config";
import {
  contactLeadSchema,
  isCatalogProductInquiry,
  isContactLead,
  isProductLead,
  LEAD_TYPES,
  leadSchema,
  PRODUCT_INQUIRY_KINDS,
  productLeadSchema,
  type ContactLeadInput,
  type ProductLeadInput,
} from "../lead-schema";

// A real catalog product slug, validated server-side against the registry.
const CATALOG_PRODUCT_ID = "abs-flood-barriers";

describe("Lead Schema", () => {
  it.each([
    [
      contactLeadSchema,
      {
        type: LEAD_TYPES.CONTACT,
        fullName: "Buyer Name",
        email: "buyer+rfq@example.com",
        subject: "Product inquiry",
        message: "This is a test message with enough characters.",
        turnstileToken: "valid-token",
      },
    ],
    [
      productLeadSchema,
      {
        type: LEAD_TYPES.PRODUCT,
        productInquiryKind: PRODUCT_INQUIRY_KINDS.CATALOG_PRODUCT,
        fullName: "Buyer Name",
        email: "buyer+rfq@example.com",
        catalogProductId: CATALOG_PRODUCT_ID,
        quantity: 10,
      },
    ],
  ])(
    "preserves plus-addressing accepted by Airtable's Email field",
    (schema, lead) => {
      const result = schema.safeParse(lead);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("buyer+rfq@example.com");
      }
    },
  );

  it.each(["=cmd@example.com", "+cmd@example.com", "-cmd@example.com"])(
    "rejects formula-capable email %s before the Airtable boundary",
    (email) => {
      expect(
        contactLeadSchema.safeParse({
          type: LEAD_TYPES.CONTACT,
          fullName: "Buyer Name",
          email,
          subject: "Product inquiry",
          message: "This is a test message with enough characters.",
          turnstileToken: "valid-token",
        }).success,
      ).toBe(false);
    },
  );

  describe("contactLeadSchema", () => {
    const validContactLead = {
      type: LEAD_TYPES.CONTACT,
      fullName: "John Doe",
      email: "john@example.com",
      subject: "Product inquiry",
      message: "This is a test message with enough characters.",
      turnstileToken: "valid-token",
      company: "Test Company",
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

    it("uses the contact form length limits for contact leads", () => {
      const tooLongName = {
        ...validContactLead,
        fullName: "A".repeat(
          CONTACT_FORM_VALIDATION_CONSTANTS.NAME_MAX_LENGTH + 1,
        ),
      };
      const tooLongMessage = {
        ...validContactLead,
        message: "A".repeat(
          CONTACT_FORM_VALIDATION_CONSTANTS.MESSAGE_MAX_LENGTH + 1,
        ),
      };
      const tooLongCompany = {
        ...validContactLead,
        company: "A".repeat(
          CONTACT_FORM_VALIDATION_CONSTANTS.COMPANY_MAX_LENGTH + 1,
        ),
      };

      expect(contactLeadSchema.safeParse(tooLongName).success).toBe(false);
      expect(contactLeadSchema.safeParse(tooLongMessage).success).toBe(false);
      expect(contactLeadSchema.safeParse(tooLongCompany).success).toBe(false);
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
    const validCatalogProductLead = {
      type: LEAD_TYPES.PRODUCT,
      productInquiryKind: PRODUCT_INQUIRY_KINDS.CATALOG_PRODUCT,
      fullName: "Jane Smith",
      email: "jane@example.com",
      catalogProductId: CATALOG_PRODUCT_ID,
      quantity: "500 units",
      company: "Example Company",
      requirements: "Need brand adaptation",
    };

    const validGeneralRfqLead = {
      type: LEAD_TYPES.PRODUCT,
      productInquiryKind: PRODUCT_INQUIRY_KINDS.GENERAL_RFQ,
      fullName: "Rita Buyer",
      email: "rita@example.com",
      requirements: "Submitted via the request-quote form.",
    };

    it("validates a complete catalog product lead", () => {
      expect(productLeadSchema.safeParse(validCatalogProductLead).success).toBe(
        true,
      );
    });

    it("validates a general RFQ with no product identity and no quantity", () => {
      const result = productLeadSchema.safeParse(validGeneralRfqLead);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.catalogProductId).toBeUndefined();
        expect(result.data.quantity).toBeUndefined();
      }
    });

    it("keeps buyerInterest as description-only free text, never identity", () => {
      const result = productLeadSchema.safeParse({
        ...validGeneralRfqLead,
        buyerInterest: "Aluminum flood gates for a garage",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.buyerInterest).toBe(
          "Aluminum flood gates for a garage",
        );
        expect(result.data.catalogProductId).toBeUndefined();
      }
    });

    it("validates a catalog product lead with numeric quantity", () => {
      expect(
        productLeadSchema.safeParse({
          ...validCatalogProductLead,
          quantity: 100,
        }).success,
      ).toBe(true);
    });

    it("rejects a catalog product id that is not in the registry", () => {
      expect(
        productLeadSchema.safeParse({
          ...validCatalogProductLead,
          catalogProductId: "not-a-real-product",
        }).success,
      ).toBe(false);
    });

    it("rejects a catalog product lead with no catalogProductId", () => {
      const { catalogProductId: _omitted, ...invalidLead } =
        validCatalogProductLead;
      expect(productLeadSchema.safeParse(invalidLead).success).toBe(false);
    });

    it("rejects a catalog product lead with a whitespace-only catalogProductId", () => {
      expect(
        productLeadSchema.safeParse({
          ...validCatalogProductLead,
          catalogProductId: "   ",
        }).success,
      ).toBe(false);
    });

    it("rejects a general RFQ that smuggles a catalog product identity", () => {
      expect(
        productLeadSchema.safeParse({
          ...validGeneralRfqLead,
          catalogProductId: CATALOG_PRODUCT_ID,
        }).success,
      ).toBe(false);
    });

    it("trims catalogProductId and quantity strings", () => {
      const result = productLeadSchema.safeParse({
        ...validCatalogProductLead,
        catalogProductId: `  ${CATALOG_PRODUCT_ID}  `,
        quantity: "  500 units  ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.catalogProductId).toBe(CATALOG_PRODUCT_ID);
        expect(result.data.quantity).toBe("500 units");
      }
    });

    it("rejects non-string, non-number quantity values", () => {
      expect(
        productLeadSchema.safeParse({
          ...validCatalogProductLead,
          quantity: true,
        }).success,
      ).toBe(false);
      expect(
        productLeadSchema.safeParse({
          ...validCatalogProductLead,
          quantity: { value: 10 },
        }).success,
      ).toBe(false);
    });

    it("rejects non-positive or non-finite numeric quantities", () => {
      expect(
        productLeadSchema.safeParse({ ...validCatalogProductLead, quantity: 0 })
          .success,
      ).toBe(false);
      expect(
        productLeadSchema.safeParse({
          ...validCatalogProductLead,
          quantity: -1,
        }).success,
      ).toBe(false);
      expect(
        productLeadSchema.safeParse({
          ...validCatalogProductLead,
          quantity: Number.POSITIVE_INFINITY,
        }).success,
      ).toBe(false);
    });

    it("accepts a catalog product lead without optional requirements", () => {
      const { requirements: _omitted, ...minimalLead } =
        validCatalogProductLead;
      expect(productLeadSchema.safeParse(minimalLead).success).toBe(true);
    });

    it("rejects a blank quantity string when quantity is supplied", () => {
      expect(
        productLeadSchema.safeParse({
          ...validCatalogProductLead,
          quantity: "   ",
        }).success,
      ).toBe(false);
    });

    it("rejects numeric quantity strings that are zero or negative", () => {
      for (const quantity of ["0", "00", "0.00", "-1", "-0.5"]) {
        const result = productLeadSchema.safeParse({
          ...validCatalogProductLead,
          quantity,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            "Quantity must be positive when using a numeric string",
          );
        }
      }
    });

    it("still accepts descriptive quantity strings and positive numeric strings", () => {
      for (const quantity of ["1", "12", "500 units per month", "approx 500"]) {
        const result = productLeadSchema.safeParse({
          ...validCatalogProductLead,
          quantity,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.quantity).toBe(quantity);
          expect(typeof result.data.quantity).toBe("string");
        }
      }
    });

    it("classifies the two inquiry states via isCatalogProductInquiry", () => {
      const catalog = productLeadSchema.parse(validCatalogProductLead);
      const general = productLeadSchema.parse(validGeneralRfqLead);
      expect(isCatalogProductInquiry(catalog)).toBe(true);
      expect(isCatalogProductInquiry(general)).toBe(false);
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
        productInquiryKind: PRODUCT_INQUIRY_KINDS.CATALOG_PRODUCT,
        fullName: "Test User",
        email: "test@example.com",
        catalogProductId: CATALOG_PRODUCT_ID,
        quantity: 10,
      };
      const result = leadSchema.safeParse(productLead);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe(LEAD_TYPES.PRODUCT);
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

    it("should keep both discriminated union variants registered", () => {
      expect(leadSchema.options).toHaveLength(2);
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
      };
      expect(isContactLead(contactLead)).toBe(true);
      expect(isProductLead(contactLead)).toBe(false);
    });

    it("isProductLead should correctly identify product leads", () => {
      const productLead: ProductLeadInput = {
        type: LEAD_TYPES.PRODUCT,
        productInquiryKind: PRODUCT_INQUIRY_KINDS.CATALOG_PRODUCT,
        fullName: "Test",
        email: "test@example.com",
        catalogProductId: CATALOG_PRODUCT_ID,
        quantity: 1,
      };
      expect(isProductLead(productLead)).toBe(true);
      expect(isContactLead(productLead)).toBe(false);
    });
  });
});
