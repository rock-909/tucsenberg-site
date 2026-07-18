/**
 * Canonical low-friction inquiry buyer fields shared by /api/inquiry and
 * downstream lead delivery. Legacy Contact/RFQ adapters map older payloads
 * into this contract; they must not define separate validation rules.
 */

import { z } from "zod";
import { PHONE_MAX_DIGITS } from "@/constants/count";
import {
  MAX_LEAD_EMAIL_LENGTH,
  MAX_LEAD_MESSAGE_LENGTH,
  MAX_LEAD_NAME_LENGTH,
  MAX_LEAD_PHONE_LENGTH,
} from "@/constants/validation-limits";
import { hasSpreadsheetFormulaPrefix } from "@/lib/security/spreadsheet-formula";
import {
  sanitizeMultilineText,
  sanitizePlainText,
} from "@/lib/security/validation";

const sanitizedString = () => z.string().overwrite(sanitizePlainText);

export function isValidLeadPhone(value: string): boolean {
  const normalized = value.replace(/[\s\-()]/g, "");
  if (!/^[+]?[0-9]+$/.test(normalized)) {
    return false;
  }
  const digitsOnly = normalized.replace("+", "");
  return digitsOnly.length > 0 && digitsOnly.length <= PHONE_MAX_DIGITS;
}

function normalizeOptionalInput(value: unknown): unknown {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === "string" && value.trim().length === 0) {
    return undefined;
  }
  return typeof value === "string" ? value.trim() : value;
}

export const canonicalBuyerFullNameSchema = sanitizedString()
  .min(1)
  .max(MAX_LEAD_NAME_LENGTH);

export const canonicalBuyerEmailSchema = z
  .email()
  .trim()
  .min(1)
  .max(MAX_LEAD_EMAIL_LENGTH)
  .refine((email) => !hasSpreadsheetFormulaPrefix(email));

export const canonicalBuyerPhoneSchema: z.ZodType<string | undefined> = z
  .unknown()
  .transform(normalizeOptionalInput)
  .refine((value) => value === undefined || typeof value === "string", {
    error: "Invalid phone number",
  })
  .refine(
    (value) =>
      value === undefined ||
      (typeof value === "string" &&
        value.length <= MAX_LEAD_PHONE_LENGTH &&
        isValidLeadPhone(value)),
    { error: "Invalid phone number" },
  )
  .transform((value) => (typeof value === "string" ? value : undefined));

export const canonicalBuyerMessageSchema: z.ZodType<string | undefined> = z
  .unknown()
  .transform(normalizeOptionalInput)
  .pipe(
    z.union([
      z.undefined(),
      z.string().overwrite(sanitizeMultilineText).max(MAX_LEAD_MESSAGE_LENGTH),
    ]),
  );
