import { describe, expect, it } from "vitest";
import enCriticalMessages from "../../messages/en/critical.json";
import enDeferredMessages from "../../messages/en/deferred.json";
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

function mergeMessages(critical: JsonObject, deferred: JsonObject): JsonObject {
  const result: JsonObject = { ...critical };

  for (const [key, value] of Object.entries(deferred)) {
    const existingValue = result[key];
    result[key] =
      isJsonObject(existingValue) && isJsonObject(value)
        ? mergeMessages(existingValue, value)
        : value;
  }

  return result;
}

function getMessageValue(messages: JsonObject, keyPath: string): unknown {
  return keyPath.split(".").reduce<unknown>((current, key) => {
    if (!isJsonObject(current)) return undefined;
    return current[key];
  }, messages);
}

const runtimeMessages = mergeMessages(enCriticalMessages, enDeferredMessages);

const validBase = {
  type: LEAD_TYPES.PRODUCT,
  productInquiryKind: PRODUCT_INQUIRY_KINDS.GENERAL_RFQ,
  fullName: "Ada Lovelace",
  email: "ada@example.com",
} as const;

const inquiryFailureCases: ReadonlyArray<{
  label: string;
  input: Record<string, unknown>;
  expectedDetails: readonly string[];
}> = [
  {
    label: "missing fullName",
    input: { ...validBase, fullName: undefined },
    expectedDetails: ["errors.fullName.required"],
  },
  {
    label: "wrong-type fullName",
    input: { ...validBase, fullName: 42 },
    expectedDetails: ["errors.fullName.invalid"],
  },
  {
    label: "wrong-type company",
    input: { ...validBase, company: 42 },
    expectedDetails: ["errors.company.invalid"],
  },
  {
    label: "wrong-type requirements",
    input: { ...validBase, requirements: 42 },
    expectedDetails: ["errors.requirements.invalid"],
  },
  {
    label: "wrong-type buyerInterest",
    input: { ...validBase, buyerInterest: true },
    expectedDetails: ["errors.buyerInterest.invalid"],
  },
  {
    label: "catalog product without id",
    input: {
      ...validBase,
      productInquiryKind: PRODUCT_INQUIRY_KINDS.CATALOG_PRODUCT,
    },
    expectedDetails: ["errors.catalogProductId.required"],
  },
  {
    label: "invalid productInquiryKind",
    input: { ...validBase, productInquiryKind: "not-a-kind" },
    expectedDetails: ["errors.productInquiryKind.invalid"],
  },
  {
    label: "invalid quantity",
    input: { ...validBase, quantity: false },
    expectedDetails: ["errors.quantity.invalid"],
  },
];

describe("inquiry validation detail mapping", () => {
  it("maps wrong-type issues to .invalid instead of .required", () => {
    const parsed = productLeadSchema.safeParse({
      ...validBase,
      company: 123,
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

  it.each(inquiryFailureCases)(
    "emits message-backed details for $label",
    ({ input, expectedDetails }) => {
      const parsed = productLeadSchema.safeParse(input);
      expect(parsed.success).toBe(false);
      if (parsed.success) return;

      const details = mapInquiryValidationDetails(parsed.error.issues);
      expect(details).toEqual(expect.arrayContaining([...expectedDetails]));

      for (const detail of details) {
        expect(PRODUCT_INQUIRY_VALIDATION_DETAIL_KEYS).toContain(detail);
        const value = getMessageValue(
          runtimeMessages,
          `contact.form.${detail}`,
        );
        expect(typeof value, detail).toBe("string");
        expect(String(value).trim(), detail).not.toBe("");
      }
    },
  );

  it("keeps every declared inquiry detail key present in contact.form messages", () => {
    for (const detail of PRODUCT_INQUIRY_VALIDATION_DETAIL_KEYS) {
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
});
