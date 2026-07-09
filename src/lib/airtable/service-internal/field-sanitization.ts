const FORMULA_PREFIX_PATTERN = /^[=+\-@]/;

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
  if (FORMULA_PREFIX_PATTERN.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}
