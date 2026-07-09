/**
 * 安全验证工具
 * Security validation utilities
 */

/**
 * Normalize plain text input: collapse whitespace and trim.
 *
 * Deliberately does NOT strip angle brackets or protocol-like substrings —
 * buyer text like "width < 900mm" must survive intact. Injection defense
 * lives at the sinks: escapeHtml in runtime-email-content.ts and
 * formula-prefix escaping in airtable/service-internal/field-sanitization.ts.
 *
 * Use this for: names, messages, company names, requirements, etc.
 */
export function sanitizePlainText(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input.replace(/\s+/g, " ").trim();
}
