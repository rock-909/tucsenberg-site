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
 * Build an optional `subject` property from possibly-empty input.
 *
 * Returns `{ subject }` with a trimmed value when non-empty, otherwise an empty
 * object so callers can spread it without emitting an `undefined` subject.
 */
export function createOptionalSubject(
  subject: string | undefined,
): { subject: string } | Record<string, never> {
  const trimmedSubject = subject?.trim();
  return trimmedSubject ? { subject: trimmedSubject } : {};
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
 * Parts of a product inquiry, as resolved server-side, used to compose the
 * CRM/email message. `productName` is the server-resolved display name (catalog
 * label or general-RFQ label), never a client-supplied string.
 */
export interface ProductInquiryMessageParts {
  productName: string;
  quantity?: string | number | undefined;
  buyerInterest?: string | undefined;
  requirements?: string | undefined;
}

function hasQuantity(quantity: string | number | undefined): boolean {
  if (quantity === undefined) return false;
  return String(quantity).trim().length > 0;
}

/**
 * Generate a structured message from product inquiry data for CRM/email.
 *
 * Every line is server-composed. `buyerInterest` is included only as descriptive
 * free text; it is never used as product attribution.
 */
export function generateProductInquiryMessage(
  parts: ProductInquiryMessageParts,
): string {
  const lines = [`Product: ${parts.productName}`];

  if (hasQuantity(parts.quantity)) {
    lines.push(
      `Quantity: ${formatQuantity(parts.quantity as string | number)}`,
    );
  }

  if (parts.buyerInterest?.trim()) {
    lines.push(`Interest: ${parts.buyerInterest.trim()}`);
  }

  if (parts.requirements?.trim()) {
    lines.push(`Requirements: ${parts.requirements.trim()}`);
  }

  return lines.join("\n");
}

/**
 * Compose the buyer's free-text description for the owner email's requirements
 * block: the stated interest (labelled) followed by any requirements text.
 * Product name and quantity are rendered separately, so they are excluded here.
 * Returns undefined when the buyer supplied neither.
 */
export function composeInquiryDescription(parts: {
  buyerInterest?: string | undefined;
  requirements?: string | undefined;
}): string | undefined {
  const lines: string[] = [];

  if (parts.buyerInterest?.trim()) {
    lines.push(`Interest: ${parts.buyerInterest.trim()}`);
  }

  if (parts.requirements?.trim()) {
    lines.push(parts.requirements.trim());
  }

  return lines.length > 0 ? lines.join("\n") : undefined;
}

/**
 * Generate a reference ID for lead tracking
 *
 * Uses cryptographically secure random bytes instead of Math.random()
 * for better uniqueness guarantees (not for security purposes).
 *
 * @param type - Lead type (contact, product)
 * @returns Unique reference ID
 */
export function generateLeadReferenceId(type: string): string {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(4).toString("hex");
  const prefix = type.substring(0, 3).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
