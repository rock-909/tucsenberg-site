/**
 * Lead Pipeline Utility Functions
 */

import { randomBytes } from "crypto";

/**
 * Result of name splitting operation
 */
export interface SplitNameResult {
  firstName: string;
  lastName: string;
}

/**
 * Split a full name into first name and last name
 *
 * Logic:
 * - Single word: firstName = word, lastName = ""
 * - Two words: firstName = first, lastName = second
 * - Three+ words: firstName = all but last, lastName = last word
 *
 * Examples:
 * - "张三" → { firstName: "张三", lastName: "" }
 * - "John Doe" → { firstName: "John", lastName: "Doe" }
 * - "John Van Doe" → { firstName: "John Van", lastName: "Doe" }
 *
 * @param fullName - The full name to split
 * @returns Object containing firstName and lastName
 */
export function splitName(fullName: string): SplitNameResult {
  const normalizedName = fullName.trim();
  const parts = normalizedName.split(/\s+/);

  if (parts.length === 1) {
    return { firstName: parts[0]!, lastName: "" };
  }

  const lastName = parts.pop()!;
  return { firstName: parts.join(" "), lastName };
}

/**
 * Format quantity for display and storage
 * Handles both numeric and string quantities
 *
 * @param quantity - Quantity value (string or number)
 * @returns Formatted quantity string
 */
export function formatQuantity(quantity: string | number): string {
  if (typeof quantity === "number") {
    return quantity.toString();
  }
  return quantity.trim();
}

/**
 * Generate a structured message from product inquiry data
 *
 * @param productName - Name of the product
 * @param quantity - Requested quantity
 * @param requirements - Optional requirements text
 * @returns Formatted message string for CRM/email
 */
export function generateProductInquiryMessage(
  productName: string,
  quantity: string | number,
  requirements?: string,
): string {
  const lines = [
    `Product: ${productName}`,
    `Quantity: ${formatQuantity(quantity)}`,
  ];

  if (requirements?.trim()) {
    lines.push(`Requirements: ${requirements.trim()}`);
  }

  return lines.join("\n");
}

/**
 * Generate a reference ID for lead tracking
 *
 * Uses cryptographically secure random bytes instead of Math.random()
 * for better uniqueness guarantees (not for security purposes).
 *
 * @param type - Lead type (contact, product, newsletter)
 * @returns Unique reference ID
 */
export function generateLeadReferenceId(type: string): string {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(4).toString("hex");
  const prefix = type.substring(0, 3).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
