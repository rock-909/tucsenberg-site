import { describe, expect, it } from "vitest";
import {
  MAX_LEAD_COMPANY_LENGTH,
  MAX_LEAD_EMAIL_LENGTH,
  MAX_LEAD_NAME_LENGTH,
} from "@/constants/validation-limits";
import { CONTACT_FORM_VALIDATION_CONSTANTS } from "@/config/contact-form-config";

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
