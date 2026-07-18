import { PHONE_MAX_DIGITS } from "@/constants/count";

/**
 * Shared lead phone grammar for canonical inquiry and Contact forms.
 * Client and server may import this helper; it performs no I/O or sanitization.
 */
export function isValidLeadPhone(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return false;
  }

  if (trimmed.startsWith("-") || trimmed.endsWith("-")) {
    return false;
  }
  if (trimmed.includes("--")) {
    return false;
  }
  if (trimmed.includes("+")) {
    if (!trimmed.startsWith("+") || trimmed.indexOf("+", 1) !== -1) {
      return false;
    }
  }
  if (!/^\+?[\d\s\-()]+$/.test(trimmed)) {
    return false;
  }

  const normalized = trimmed.replace(/[\s\-()]/g, "");
  if (!/^\+?[0-9]+$/.test(normalized)) {
    return false;
  }

  const digitsOnly = normalized.replace("+", "");
  return digitsOnly.length > 0 && digitsOnly.length <= PHONE_MAX_DIGITS;
}
