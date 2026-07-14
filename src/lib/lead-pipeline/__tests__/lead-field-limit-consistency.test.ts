import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  MAX_LEAD_COMPANY_LENGTH,
  MAX_LEAD_EMAIL_LENGTH,
  MAX_LEAD_NAME_LENGTH,
  MAX_LEAD_REQUIREMENTS_LENGTH,
} from "@/constants/validation-limits";
import { CONTACT_FORM_VALIDATION_CONSTANTS } from "@/config/contact-form-config";
import { RequestQuoteMessageField } from "@/app/[locale]/request-quote/request-quote-form-fields";
import { createRequestQuoteRequirements } from "@/app/[locale]/request-quote/request-quote-payload";
import { createTestRequestQuoteFormCopy } from "@/test/request-quote-test-messages";

/**
 * The same buyer-visible fields (name / email / company) are length-limited in
 * two independently maintained places:
 *
 * - product-inquiry lead schema → `validation-limits.ts` (MAX_LEAD_*),
 * - contact lead schema → `contact-form-config.ts`
 *   (CONTACT_FORM_VALIDATION_CONSTANTS).
 *
 * Two centrally-managed truths for one concept will silently drift. The harmful
 * direction is the contact path accepting input the product-inquiry path would
 * reject, so we pin the invariant "product-inquiry max ≥ contact max" for every
 * shared field. This does not force the two to be equal (product inquiries do
 * allow longer values by design) — it only stops the limits from crossing.
 */
describe("lead field length limit consistency", () => {
  const sharedFieldLimits = [
    {
      field: "email",
      productInquiryMax: MAX_LEAD_EMAIL_LENGTH,
      contactMax: CONTACT_FORM_VALIDATION_CONSTANTS.EMAIL_MAX_LENGTH,
    },
    {
      field: "name",
      productInquiryMax: MAX_LEAD_NAME_LENGTH,
      contactMax: CONTACT_FORM_VALIDATION_CONSTANTS.NAME_MAX_LENGTH,
    },
    {
      field: "company",
      productInquiryMax: MAX_LEAD_COMPANY_LENGTH,
      contactMax: CONTACT_FORM_VALIDATION_CONSTANTS.COMPANY_MAX_LENGTH,
    },
  ] as const;

  it.each(sharedFieldLimits)(
    "keeps product-inquiry $field max ≥ contact $field max",
    ({ productInquiryMax, contactMax }) => {
      expect(productInquiryMax).toBeGreaterThanOrEqual(contactMax);
    },
  );
});

/**
 * The RFQ page's `message` textarea has its own client-side `maxLength`,
 * independent from the server-side `requirements` schema limit
 * (`MAX_LEAD_REQUIREMENTS_LENGTH`). `request-quote-payload.ts` prefixes every
 * buyer message with a fixed source line before it becomes `requirements`, so
 * a buyer who fills the textarea to its rendered limit must still produce a
 * `requirements` value the server accepts. This renders the real field and
 * builds `requirements` through the real payload builder — it fails the
 * moment the two limits drift, regardless of which one changes.
 */
describe("RFQ message field length vs server-side requirements limit", () => {
  it("keeps a max-length RFQ message within the requirements limit", () => {
    const copy = createTestRequestQuoteFormCopy();
    render(createElement(RequestQuoteMessageField, { copy }));

    const textarea = screen.getByLabelText(
      copy.fields.message,
    ) as HTMLTextAreaElement;

    const formData = new FormData();
    formData.set("message", "x".repeat(textarea.maxLength));

    const requirements = createRequestQuoteRequirements(formData, copy.payload);

    expect(requirements.length).toBeLessThanOrEqual(
      MAX_LEAD_REQUIREMENTS_LENGTH,
    );
  });
});
