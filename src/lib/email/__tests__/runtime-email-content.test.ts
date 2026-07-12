import { describe, expect, it } from "vitest";
import { EMAIL_COPY } from "@/emails/email-copy";
import type {
  EmailTemplateData,
  ProductInquiryEmailData,
} from "@/lib/email/email-data-schema";
import {
  buildContactFormEmailContent,
  buildProductInquiryEmailContent,
} from "@/lib/email/runtime-email-content";

describe("runtime email content", () => {
  const contactData: EmailTemplateData = {
    firstName: "Jane",
    lastName: "Buyer",
    email: "jane@example.com",
    company: "Example Co",
    phone: "+1 555 0100",
    subject: "Need a quote",
    message: "Line one\nLine two",
    submittedAt: "2026-05-30T08:30:00.000Z",
    marketingConsent: true,
  };

  it("renders contact fields in both HTML and plain text", () => {
    const content = buildContactFormEmailContent(contactData);

    expect(content.html).toContain("Jane Buyer");
    expect(content.html).toContain("jane@example.com");
    expect(content.html).toContain("Example Co");
    expect(content.html).toContain("+1 555 0100");
    expect(content.html).toContain("Need a quote");
    expect(content.html).toContain("Line one");
    expect(content.html).toContain("Line two");
    expect(content.html).toContain("2026-05-30 08:30 UTC");
    expect(content.html).toContain(EMAIL_COPY.common.marketingConsentAccepted);

    expect(content.text).toContain("Name: Jane Buyer");
    expect(content.text).toContain("Email: jane@example.com");
    expect(content.text).toContain("Company: Example Co");
    expect(content.text).toContain("Phone: +1 555 0100");
    expect(content.text).toContain("Subject: Need a quote");
    expect(content.text).toContain("Message: Line one\nLine two");
    expect(content.text).toContain("Submitted At: 2026-05-30 08:30 UTC");
    expect(content.text).toContain(
      `Marketing Consent: ${EMAIL_COPY.common.marketingConsentAccepted}`,
    );
  });

  it("omits optional contact labels when the fields are not provided", () => {
    const content = buildContactFormEmailContent({
      firstName: "Jane",
      lastName: "Buyer",
      email: "jane@example.com",
      message: "Only required fields",
      submittedAt: "2026-05-30T08:30:00.000Z",
    });

    expect(content.text).not.toContain("Company:");
    expect(content.text).not.toContain("Phone:");
    expect(content.text).not.toContain("Subject:");
    expect(content.text).not.toContain("Marketing Consent:");
    expect(content.html).not.toContain(EMAIL_COPY.common.fields.company);
    expect(content.html).not.toContain(EMAIL_COPY.common.fields.phone);
    expect(content.html).not.toContain(EMAIL_COPY.common.fields.subject);
    expect(content.html).not.toContain(
      EMAIL_COPY.common.fields.marketingConsent,
    );
  });

  it("escapes special characters in HTML while keeping readable text content", () => {
    const content = buildContactFormEmailContent({
      ...contactData,
      firstName: "J&ne",
      lastName: "<Buyer>",
      company: '"Quoted" Co',
      message: "Need <fast> & 'safe' output",
    });

    expect(content.html).toContain("J&amp;ne &lt;Buyer&gt;");
    expect(content.html).toContain("&quot;Quoted&quot; Co");
    expect(content.html).toContain(
      "Need &lt;fast&gt; &amp; &#39;safe&#39; output",
    );
    expect(content.html).not.toContain("Need <fast>");

    expect(content.text).toContain("Name: J&ne <Buyer>");
    expect(content.text).toContain('Company: "Quoted" Co');
    expect(content.text).toContain("Message: Need <fast> & 'safe' output");
  });

  it("renders product inquiry highlight and body fields without losing buyer details", () => {
    const inquiryData: ProductInquiryEmailData = {
      firstName: "Pat",
      lastName: "Lee",
      email: "pat@example.com",
      company: "Buyer LLC",
      productName: "Enterprise Widget",
      quantity: "500 units\nper month",
      requirements: "Line one\nLine two",
      marketingConsent: true,
    };

    const content = buildProductInquiryEmailContent(inquiryData);

    expect(content.html).toContain("Enterprise Widget");
    expect(content.html).toContain("500 units");
    expect(content.html).toContain("per month");
    expect(content.html).toContain("Pat Lee");
    expect(content.html).toContain("pat@example.com");
    expect(content.html).toContain("Buyer LLC");
    expect(content.html).toContain("Line one");
    expect(content.html).toContain("Line two");
    expect(content.html).toContain(EMAIL_COPY.common.marketingConsentAccepted);

    expect(content.text).toContain("Product: Enterprise Widget");
    expect(content.text).toContain("Quantity: 500 units\nper month");
    expect(content.text).toContain("Contact Name: Pat Lee");
    expect(content.text).toContain("Email: pat@example.com");
    expect(content.text).toContain("Company: Buyer LLC");
    expect(content.text).toContain("Requirements: Line one\nLine two");
  });
});
