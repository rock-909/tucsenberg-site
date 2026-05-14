import { sanitizePlainText } from "@/lib/security/validation";

const FORMULA_PREFIX_PATTERN = /^[=+\-@]/;

export function sanitizeAirtableTextField(value: string): string {
  const plain = sanitizePlainText(value);
  const trimmedStart = plain.trimStart();
  if (FORMULA_PREFIX_PATTERN.test(trimmedStart)) {
    return `'${plain}`;
  }
  return plain;
}
