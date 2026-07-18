import { isValidLeadPhone } from "@/lib/form-schema/lead-phone-grammar";
import { hasSpreadsheetFormulaPrefix } from "@/lib/security/spreadsheet-formula";

/**
 * Neutralize spreadsheet formula injection before writing to Airtable.
 *
 * The value is already whitespace-normalized at the lead-schema boundary
 * (single-line via sanitizePlainText, multiline via sanitizeMultilineText), so
 * this sink must NOT collapse whitespace again — doing so would flatten the
 * buyer's multi-line message/requirements. It only trims surrounding whitespace
 * and prefixes a leading `= + - @` with `'` so spreadsheets treat it as text.
 */
export function sanitizeAirtableTextField(value: string): string {
  const trimmed = value.trim();
  if (hasSpreadsheetFormulaPrefix(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

/**
 * Phone numbers are dialable content, not spreadsheet formulas. International
 * numbers beginning with `+` that pass shared lead phone grammar stay unchanged
 * so Airtable stores a callable value without a leading apostrophe. All other
 * spreadsheet formula prefixes use the shared prefix truth.
 */
export function sanitizeAirtablePhoneField(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("+") && isValidLeadPhone(trimmed)) {
    return trimmed;
  }
  if (hasSpreadsheetFormulaPrefix(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}
