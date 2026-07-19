import { type ZodIssue } from "zod";
import {
  mapZodIssuesToValidationDetails,
  type ValidationFieldErrorKeys,
} from "@/lib/api/validation-error-details";

/**
 * Inquiry field → contact.form error namespace prefixes.
 * Contact form has its own FIELD_ERROR_KEY_PREFIX; do not merge the two.
 */
export const PRODUCT_INQUIRY_FIELD_ERROR_KEYS = {
  fullName: "errors.fullName",
  email: "errors.email",
  message: "errors.message",
} as const satisfies ValidationFieldErrorKeys;

/**
 * Detail leaves the inquiry mapper can emit for productLeadSchema.
 * Usage gate binds this list — keep it aligned with behavior tests.
 */
export const PRODUCT_INQUIRY_VALIDATION_DETAIL_KEYS = [
  "errors.generic",
  "errors.fullName.required",
  "errors.fullName.invalid",
  "errors.fullName.tooLong",
  "errors.email.required",
  "errors.email.invalid",
  "errors.email.tooLong",
  "errors.message.invalid",
  "errors.message.tooLong",
] as const;

export function mapInquiryValidationDetails(
  issues: readonly ZodIssue[],
  source: Record<string, unknown> = {},
): string[] {
  return mapZodIssuesToValidationDetails(
    issues,
    PRODUCT_INQUIRY_FIELD_ERROR_KEYS,
    source,
  );
}
