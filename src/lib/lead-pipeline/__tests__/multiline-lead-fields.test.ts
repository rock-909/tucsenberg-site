/**
 * Multiline lead field preservation
 *
 * A buyer's multi-line message/requirements must keep their line breaks all the
 * way from the schema boundary into the Airtable field value and the multi-line
 * email rendering. Single-line fields must still collapse internal whitespace.
 */

import { describe, expect, it } from "vitest";
import { sanitizeAirtableTextField } from "@/lib/airtable/service-internal/field-sanitization";
import { buildContactFormEmailContent } from "@/lib/email/runtime-email-content";
import {
  contactLeadSchema,
  LEAD_TYPES,
  productLeadSchema,
} from "@/lib/lead-pipeline/lead-schema";

describe("multiline lead fields", () => {
  it("keeps newlines in a contact message through schema, Airtable, and email", () => {
    const parsed = contactLeadSchema.parse({
      type: LEAD_TYPES.CONTACT,
      fullName: "Jane Buyer",
      email: "jane@example.com",
      subject: "Product inquiry",
      message: "Line one\nLine two\nLine three",
      turnstileToken: "token",
    });

    // Schema boundary keeps the line breaks.
    expect(parsed.message).toBe("Line one\nLine two\nLine three");

    // Airtable sink keeps the line breaks (no formula prefix expected here).
    expect(sanitizeAirtableTextField(parsed.message)).toBe(
      "Line one\nLine two\nLine three",
    );

    // Email body renders each line as its own paragraph.
    const email = buildContactFormEmailContent({
      firstName: "Jane",
      lastName: "Buyer",
      email: parsed.email,
      message: parsed.message,
      submittedAt: "2026-05-30T08:30:00.000Z",
    });
    expect(email.text).toContain("Line one\nLine two\nLine three");
    expect(email.html).toContain("Line one");
    expect(email.html).toContain("Line two");
    expect(email.html).toContain("Line three");
  });

  it("keeps newlines in product requirements at the schema boundary", () => {
    const parsed = productLeadSchema.parse({
      type: LEAD_TYPES.PRODUCT,
      productInquiryKind: "catalog-product",
      fullName: "Pat Lee",
      email: "pat@example.com",
      catalogProductId: "abs-flood-barriers",
      quantity: "500 units",
      requirements: "Need custom height\nStainless finish",
    });

    expect(parsed.requirements).toBe("Need custom height\nStainless finish");
    expect(sanitizeAirtableTextField(parsed.requirements!)).toBe(
      "Need custom height\nStainless finish",
    );
  });

  it("still collapses runs of spaces/tabs within a multiline field", () => {
    const parsed = contactLeadSchema.parse({
      type: LEAD_TYPES.CONTACT,
      fullName: "Jane Buyer",
      email: "jane@example.com",
      subject: "Product inquiry",
      message: "Line   one\t\thas   gaps\n\n\n\nLine two",
      turnstileToken: "token",
    });

    // Intra-line whitespace runs collapse; newlines survive; blank-line runs cap.
    expect(parsed.message).toBe("Line one has gaps\n\nLine two");
  });

  it("still collapses newlines in single-line fields like fullName", () => {
    const parsed = contactLeadSchema.parse({
      type: LEAD_TYPES.CONTACT,
      fullName: "Jane\nBuyer",
      email: "jane@example.com",
      subject: "Product inquiry",
      message: "This is a long enough message.",
      turnstileToken: "token",
    });

    expect(parsed.fullName).toBe("Jane Buyer");
  });
});
