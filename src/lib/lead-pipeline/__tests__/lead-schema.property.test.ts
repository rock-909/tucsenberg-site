import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  contactLeadSchema,
  isContactLead,
  isNewsletterLead,
  isProductLead,
  LEAD_TYPES,
} from "../lead-schema";

const SAFE_SUBMITTED_AT_MIN = new Date("2000-01-01T00:00:00.000Z");
const SAFE_SUBMITTED_AT_MAX = new Date("2100-12-31T23:59:59.999Z");
const SAFE_SUBMITTED_AT_MIN_MS = SAFE_SUBMITTED_AT_MIN.getTime();
const SAFE_SUBMITTED_AT_MAX_MS = SAFE_SUBMITTED_AT_MAX.getTime();
const contactSubjectArb = fc.stringMatching(
  /^[A-Za-z0-9][A-Za-z0-9 .,'-]{4,79}$/,
);
const contactLeadArb = fc
  .record({
    type: fc.constant(LEAD_TYPES.CONTACT),
    fullName: fc.string({ minLength: 1, maxLength: 24 }),
    email: fc.emailAddress(),
    subject: contactSubjectArb,
    message: fc.string({ minLength: 20, maxLength: 120 }),
    turnstileToken: fc.string({ minLength: 1, maxLength: 48 }),
    marketingConsent: fc.boolean(),
  })
  .chain((base) =>
    fc
      .record({
        company: fc.option(fc.string({ minLength: 1, maxLength: 32 }), {
          nil: undefined,
        }),
        submittedAt: fc.option(
          fc.oneof(
            fc
              .integer({
                min: SAFE_SUBMITTED_AT_MIN_MS,
                max: SAFE_SUBMITTED_AT_MAX_MS,
              })
              .map((value) => new Date(value).toISOString()),
            fc.string().filter((value) => value.length > 0),
          ),
          { nil: undefined },
        ),
      })
      .map(({ company, submittedAt }) => ({
        ...base,
        ...(company !== undefined ? { company } : {}),
        ...(submittedAt !== undefined ? { submittedAt } : {}),
      })),
  );

const productLeadArb = fc
  .record({
    type: fc.constant(LEAD_TYPES.PRODUCT),
    productInquiryKind: fc.constantFrom("catalog-product", "general-rfq"),
    fullName: fc.string({ minLength: 1, maxLength: 24 }),
    email: fc.emailAddress(),
    catalogProductId: fc.constant("abs-flood-barriers"),
    quantity: fc.oneof(
      fc.integer({ min: 1, max: 10000 }),
      fc.string({ minLength: 1, maxLength: 24 }),
    ),
    marketingConsent: fc.boolean(),
  })
  .chain((base) =>
    fc
      .record({
        company: fc.option(fc.string({ minLength: 1, maxLength: 32 }), {
          nil: undefined,
        }),
        buyerInterest: fc.option(fc.string({ minLength: 1, maxLength: 32 }), {
          nil: undefined,
        }),
        requirements: fc.option(fc.string({ minLength: 1, maxLength: 80 }), {
          nil: undefined,
        }),
      })
      .map(({ company, buyerInterest, requirements }) => ({
        ...base,
        ...(company !== undefined ? { company } : {}),
        ...(buyerInterest !== undefined ? { buyerInterest } : {}),
        ...(requirements !== undefined ? { requirements } : {}),
      })),
  );

const newsletterLeadArb = fc.record({
  type: fc.constant(LEAD_TYPES.NEWSLETTER),
  email: fc.emailAddress(),
});

const leadInputArb = fc.oneof(
  contactLeadArb,
  productLeadArb,
  newsletterLeadArb,
);

describe("lead-schema property tests", () => {
  it("type guards are mutually exclusive for any valid LeadInput", () => {
    fc.assert(
      fc.property(leadInputArb, (lead) => {
        const matches = [
          isContactLead(lead),
          isProductLead(lead),
          isNewsletterLead(lead),
        ].filter(Boolean);

        expect(matches).toHaveLength(1);
      }),
    );
  });

  it("contactLeadSchema.safeParse never throws for fuzzed input", () => {
    fc.assert(
      fc.property(fc.anything({ maxDepth: 2, maxKeys: 5 }), (value) => {
        expect(() => contactLeadSchema.safeParse(value)).not.toThrow();
      }),
    );
  });

  it("contactLeadSchema rejects strings that are not email-shaped", () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[a-z]{1,48}$/), (invalidEmail) => {
        const result = contactLeadSchema.safeParse({
          type: LEAD_TYPES.CONTACT,
          fullName: "Jane Doe",
          email: invalidEmail,
          subject: "General question",
          message: "This message is definitely long enough.",
          turnstileToken: "token",
        });

        expect(result.success).toBe(false);
      }),
    );
  });
});
