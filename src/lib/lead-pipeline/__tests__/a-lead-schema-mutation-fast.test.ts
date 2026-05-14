import { describe, expect, it, vi } from "vitest";

import { LEAD_TYPES, productLeadSchema } from "../lead-schema";

vi.unmock("zod");

const validProductLead = {
  type: LEAD_TYPES.PRODUCT,
  fullName: "Fast Mutation Test",
  email: "fast@example.com",
  productSlug: "fast-product",
  productName: "Fast Product",
  quantity: "12",
};

describe("lead-schema mutation fast path", () => {
  it("keeps positive numeric strings as trimmed strings", () => {
    const result = productLeadSchema.safeParse({
      ...validProductLead,
      quantity: " 1 ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe("1");
      expect(typeof result.data.quantity).toBe("string");
    }
  });

  it("rejects zero and negative numeric strings with the explicit quantity message", () => {
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

  it("treats non-finite numeric strings as descriptive quantities", () => {
    const infinityQuantity = productLeadSchema.safeParse({
      ...validProductLead,
      quantity: "Infinity",
    });
    const overflowQuantity = productLeadSchema.safeParse({
      ...validProductLead,
      quantity: "1e400",
    });

    expect(infinityQuantity.success).toBe(true);
    expect(overflowQuantity.success).toBe(true);
    if (infinityQuantity.success && overflowQuantity.success) {
      expect(infinityQuantity.data.quantity).toBe("Infinity");
      expect(overflowQuantity.data.quantity).toBe("1e400");
    }
  });

  it("rejects zero, negative, and non-finite numeric quantities", () => {
    expect(
      productLeadSchema.safeParse({ ...validProductLead, quantity: 0 }).success,
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

  it("rejects boolean and object quantity inputs", () => {
    expect(
      productLeadSchema.safeParse({ ...validProductLead, quantity: true })
        .success,
    ).toBe(false);
    expect(
      productLeadSchema.safeParse({
        ...validProductLead,
        quantity: { amount: 1 },
      }).success,
    ).toBe(false);
  });

  it("keeps descriptive strings that merely end with digits", () => {
    const result = productLeadSchema.safeParse({
      ...validProductLead,
      quantity: "approx 500",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe("approx 500");
    }
  });
});
