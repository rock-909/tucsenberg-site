import { describe, expect, it } from "vitest";
import { getComposedMessages } from "@/lib/i18n/composed-messages";
import {
  mapInquiryValidationDetails,
  PRODUCT_INQUIRY_VALIDATION_DETAIL_KEYS,
} from "@/lib/api/inquiry-validation-details";
import { mapZodIssuesToValidationDetails } from "@/lib/api/validation-error-details";
import {
  LEAD_TYPES,
  PRODUCT_INQUIRY_KINDS,
  productLeadSchema,
} from "@/lib/lead-pipeline/lead-schema";

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getMessageValue(messages: JsonObject, keyPath: string): unknown {
  return keyPath.split(".").reduce<unknown>((current, key) => {
    if (!isJsonObject(current)) return undefined;
    return current[key];
  }, messages);
}

const runtimeMessages = getComposedMessages("en");

const validBase = {
  type: LEAD_TYPES.PRODUCT,
  productInquiryKind: PRODUCT_INQUIRY_KINDS.GENERAL_RFQ,
  fullName: "Ada Lovelace",
  email: "ada@example.com",
} as const;

const inquiryFailureInputs: ReadonlyArray<Record<string, unknown>> = [
  { ...validBase, fullName: undefined },
  { ...validBase, fullName: "" },
  { ...validBase, fullName: 42 },
  { ...validBase, fullName: "A".repeat(300) },
  { ...validBase, email: undefined },
  { ...validBase, email: "" },
  { ...validBase, email: 42 },
  { ...validBase, email: "not-an-email" },
  { ...validBase, email: `a@${"x".repeat(300)}.com` },
  { ...validBase, company: 42 },
  { ...validBase, company: "A".repeat(300) },
  { ...validBase, productInquiryKind: undefined },
  { ...validBase, productInquiryKind: "not-a-kind" },
  { ...validBase, productInquiryKind: 1 },
  {
    type: LEAD_TYPES.PRODUCT,
    productInquiryKind: PRODUCT_INQUIRY_KINDS.CATALOG_PRODUCT,
    fullName: "Ada Lovelace",
    email: "ada@example.com",
  },
  {
    ...validBase,
    productInquiryKind: PRODUCT_INQUIRY_KINDS.CATALOG_PRODUCT,
    catalogProductId: "not-real",
  },
  { ...validBase, catalogProductId: "abs-flood-barriers" },
  { ...validBase, buyerInterest: 123 },
  { ...validBase, buyerInterest: "A".repeat(500) },
  { ...validBase, quantity: false },
  { ...validBase, quantity: {} },
  { ...validBase, phone: "not-a-phone" },
  { ...validBase, phone: "A".repeat(40) },
  { ...validBase, message: 123 },
  { ...validBase, message: "A".repeat(5000) },
  { ...validBase, requirements: 123 },
  { ...validBase, requirements: "A".repeat(5000) },
  { ...validBase, utmSource: "x".repeat(257) },
  { ...validBase, utmSource: 42 },
  { ...validBase, gclid: true },
];

describe("inquiry validation detail mapping", () => {
  it("accepts blank quantity as omitted optional input", () => {
    const parsed = productLeadSchema.safeParse({
      ...validBase,
      quantity: "",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.quantity).toBeUndefined();
    }
  });

  it("maps canonical message too_long to errors.message.tooLong after normalization", () => {
    const tooLong = productLeadSchema.safeParse({
      ...validBase,
      message: "A".repeat(5000),
    });
    const wrongType = productLeadSchema.safeParse({
      ...validBase,
      message: 123,
    });

    expect(tooLong.success).toBe(false);
    expect(wrongType.success).toBe(false);
    if (tooLong.success || wrongType.success) return;

    expect(mapInquiryValidationDetails(tooLong.error.issues)).toEqual([
      "errors.message.tooLong",
    ]);
    expect(mapInquiryValidationDetails(wrongType.error.issues)).toEqual([
      "errors.message.invalid",
    ]);
  });

  it("maps wrong-type issues to .invalid instead of .required", () => {
    const parsed = productLeadSchema.safeParse({
      ...validBase,
      company: 123,
      phone: true,
      message: 999,
      requirements: 456,
      buyerInterest: 789,
    });

    expect(parsed.success).toBe(false);
    if (parsed.success) return;

    expect(mapInquiryValidationDetails(parsed.error.issues)).toEqual(
      expect.arrayContaining([
        "errors.company.invalid",
        "errors.requirements.invalid",
        "errors.buyerInterest.invalid",
        "errors.phone.invalid",
        "errors.message.invalid",
      ]),
    );
    expect(mapInquiryValidationDetails(parsed.error.issues)).not.toEqual(
      expect.arrayContaining([
        "errors.company.required",
        "errors.requirements.required",
        "errors.buyerInterest.required",
      ]),
    );
  });

  it("maps unregistered attribution fields to errors.generic only", () => {
    const tooLong = productLeadSchema.safeParse({
      ...validBase,
      utmSource: "x".repeat(257),
    });
    const wrongType = productLeadSchema.safeParse({
      ...validBase,
      utmSource: 42,
    });

    expect(tooLong.success).toBe(false);
    expect(wrongType.success).toBe(false);
    if (tooLong.success || wrongType.success) return;

    expect(mapInquiryValidationDetails(tooLong.error.issues)).toEqual([
      "errors.generic",
    ]);
    expect(mapInquiryValidationDetails(wrongType.error.issues)).toEqual([
      "errors.generic",
    ]);
  });

  it("keeps emitted details equal to the declared inquiry contract", () => {
    const emitted = new Set<string>();

    for (const input of inquiryFailureInputs) {
      const parsed = productLeadSchema.safeParse(input);
      if (parsed.success) {
        throw new Error(`expected failure for ${JSON.stringify(input)}`);
      }

      for (const detail of mapInquiryValidationDetails(parsed.error.issues)) {
        emitted.add(detail);
      }
    }

    expect([...emitted].sort()).toEqual(
      [...PRODUCT_INQUIRY_VALIDATION_DETAIL_KEYS].sort(),
    );

    for (const detail of emitted) {
      const value = getMessageValue(runtimeMessages, `contact.form.${detail}`);
      expect(typeof value, detail).toBe("string");
      expect(String(value).trim(), detail).not.toBe("");
    }
  });
});

describe("shared zod validation detail mapping", () => {
  it("only treats invalid_type as required when undefined was received", () => {
    const requiredIssue = {
      code: "invalid_type",
      path: ["company"],
      message: "Invalid input: expected string, received undefined",
    } as const;
    const wrongTypeIssue = {
      code: "invalid_type",
      path: ["company"],
      message: "Invalid input: expected string, received number",
    } as const;

    expect(
      mapZodIssuesToValidationDetails([requiredIssue], {
        company: "errors.company",
      }),
    ).toEqual(["errors.company.required"]);

    expect(
      mapZodIssuesToValidationDetails([wrongTypeIssue], {
        company: "errors.company",
      }),
    ).toEqual(["errors.company.invalid"]);
  });

  it("keeps unregistered fields on errors.generic without suffixes", () => {
    expect(
      mapZodIssuesToValidationDetails(
        [
          {
            code: "too_big",
            path: ["utmSource"],
            message: "Too big",
          } as never,
        ],
        {},
      ),
    ).toEqual(["errors.generic"]);
  });
});
