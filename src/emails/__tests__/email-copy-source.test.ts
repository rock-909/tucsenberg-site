import { describe, expect, it } from "vitest";
import baseEnglishDeferredMessages from "@messages/base/en/deferred.json";
import { EMAIL_COPY } from "@/emails/email-copy";
import type {
  EmailTemplateData,
  ProductInquiryEmailData,
} from "@/lib/email/email-data-schema";

interface EmailTemplates {
  common: {
    unknownSubmissionTime: string;
    marketingConsentAccepted: string;
    fields: typeof EMAIL_COPY.common.fields;
  };
  confirmation: {
    title: string;
    preview: string;
    receivedMessage: string;
    summaryIntro: string;
    urgentHelp: string;
    signoff: string;
    greeting: string;
    teamName: string;
    footer: string;
    subject: string;
    summaryLines: {
      name: string;
      company: string;
      email: string;
      subject: string;
      submitted: string;
    };
  };
  contact: {
    title: string;
    preview: string;
    footer: string;
    subjectWithTopic: string;
    subjectWithoutTopic: string;
  };
  productInquiry: {
    title: string;
    preview: string;
    footer: string;
    subject: string;
  };
}

const contactEmailData: EmailTemplateData = {
  firstName: "Jane",
  lastName: "Smith",
  email: "jane.smith@example.com",
  company: "Smith Industries",
  phone: "+1 555 0100",
  subject: "showcase offer example quote",
  message: "Need a distributor quote.",
  submittedAt: "2026-04-29T12:00:00.000Z",
  marketingConsent: true,
};

const contactEmailDataWithoutSubject: EmailTemplateData = {
  firstName: "Jane",
  lastName: "Smith",
  email: "jane.smith@example.com",
  company: "Smith Industries",
  phone: "+1 555 0100",
  message: "Need a distributor quote.",
  submittedAt: "2026-04-29T12:00:00.000Z",
  marketingConsent: true,
};

const productInquiryEmailData: ProductInquiryEmailData = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  company: "Example Industries",
  productName: "Hydraulic Pump Station",
  quantity: 10,
  requirements: "Need urgent delivery.",
  marketingConsent: true,
};

const contactEmailDataWithPlaceholderLikeInput: EmailTemplateData = {
  firstName: "{lastName}",
  lastName: "Smith",
  email: "placeholder.input@example.com",
  company: "Placeholder Inputs Ltd.",
  phone: "+1 555 0100",
  subject: "{submittedAt}",
  message: "Need a distributor quote.",
  submittedAt: "2026-04-29T12:00:00.000Z",
  marketingConsent: true,
};

const productInquiryEmailDataWithPlaceholderLikeInput: ProductInquiryEmailData =
  {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    productName: "{quantity}",
    quantity: 10,
  };

const contactEmailDataWithoutCompanyOrSubject: EmailTemplateData = {
  firstName: "Jane",
  lastName: "Smith",
  email: "jane.smith@example.com",
  phone: "+1 555 0100",
  message: "Need a distributor quote.",
  submittedAt: "2026-04-29T12:00:00.000Z",
  marketingConsent: true,
};

const UNRESOLVED_PLACEHOLDER_PATTERN = /\{[^}]+\}/;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getEmailTemplates(): EmailTemplates {
  const messagePack = baseEnglishDeferredMessages as unknown as {
    emailTemplates?: unknown;
  };

  if (!isObjectRecord(messagePack.emailTemplates)) {
    throw new Error(
      "messages/base/en/deferred.json must define emailTemplates before EMAIL_COPY can use message-pack authoring.",
    );
  }

  return messagePack.emailTemplates as unknown as EmailTemplates;
}

function formatTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return Object.entries(values).reduce(
    (formatted, [key, value]) =>
      formatted.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function expectNoUnresolvedPlaceholders(value: string | string[]): void {
  const values = Array.isArray(value) ? value : [value];

  for (const renderedValue of values) {
    expect(renderedValue).not.toMatch(UNRESOLVED_PLACEHOLDER_PATTERN);
  }
}

describe("email copy source", () => {
  it("uses default English message-pack copy for common field labels", () => {
    const emailTemplates = getEmailTemplates();

    expect(EMAIL_COPY.common.unknownSubmissionTime).toBe(
      emailTemplates.common.unknownSubmissionTime,
    );
    expect(EMAIL_COPY.common.marketingConsentAccepted).toBe(
      emailTemplates.common.marketingConsentAccepted,
    );
    expect(EMAIL_COPY.common.fields).toEqual(emailTemplates.common.fields);
  });

  it("uses default English message-pack copy for confirmation email copy", () => {
    const emailTemplates = getEmailTemplates();
    const submittedAt = "2026-04-29 12:00 UTC";
    const siteName = "Example Pumps";
    const year = 2026;

    expect(EMAIL_COPY.confirmation.title).toBe(
      emailTemplates.confirmation.title,
    );
    expect(EMAIL_COPY.confirmation.preview).toBe(
      emailTemplates.confirmation.preview,
    );
    expect(EMAIL_COPY.confirmation.receivedMessage).toBe(
      emailTemplates.confirmation.receivedMessage,
    );
    expect(EMAIL_COPY.confirmation.summaryIntro).toBe(
      emailTemplates.confirmation.summaryIntro,
    );
    expect(EMAIL_COPY.confirmation.urgentHelp).toBe(
      emailTemplates.confirmation.urgentHelp,
    );
    expect(EMAIL_COPY.confirmation.signoff).toBe(
      emailTemplates.confirmation.signoff,
    );
    expect(EMAIL_COPY.confirmation.greeting(contactEmailData.firstName)).toBe(
      formatTemplate(emailTemplates.confirmation.greeting, {
        firstName: contactEmailData.firstName,
      }),
    );
    expect(EMAIL_COPY.confirmation.teamName(siteName)).toBe(
      formatTemplate(emailTemplates.confirmation.teamName, { siteName }),
    );
    expect(EMAIL_COPY.confirmation.footer(year, siteName)).toBe(
      formatTemplate(emailTemplates.confirmation.footer, { year, siteName }),
    );
    expect(EMAIL_COPY.confirmation.subject(siteName)).toBe(
      formatTemplate(emailTemplates.confirmation.subject, { siteName }),
    );
    expect(
      EMAIL_COPY.confirmation.summaryLines(contactEmailData, submittedAt),
    ).toEqual([
      formatTemplate(emailTemplates.confirmation.summaryLines.name, {
        firstName: contactEmailData.firstName,
        lastName: contactEmailData.lastName,
      }),
      formatTemplate(emailTemplates.confirmation.summaryLines.company, {
        company: contactEmailData.company ?? "",
      }),
      formatTemplate(emailTemplates.confirmation.summaryLines.email, {
        email: contactEmailData.email,
      }),
      formatTemplate(emailTemplates.confirmation.summaryLines.subject, {
        subject: contactEmailData.subject ?? "",
      }),
      formatTemplate(emailTemplates.confirmation.summaryLines.submitted, {
        submittedAt,
      }),
    ]);
  });

  it("uses default English message-pack copy for owner notification copy", () => {
    const emailTemplates = getEmailTemplates();
    const siteName = "Example Pumps";

    expect(EMAIL_COPY.contact.title).toBe(emailTemplates.contact.title);
    expect(EMAIL_COPY.contact.preview(contactEmailData)).toBe(
      formatTemplate(emailTemplates.contact.preview, {
        firstName: contactEmailData.firstName,
        lastName: contactEmailData.lastName,
      }),
    );
    expect(EMAIL_COPY.contact.footer(siteName)).toBe(
      formatTemplate(emailTemplates.contact.footer, { siteName }),
    );
    expect(EMAIL_COPY.contact.subject(contactEmailData)).toBe(
      formatTemplate(emailTemplates.contact.subjectWithTopic, {
        subject: contactEmailData.subject ?? "",
      }),
    );
    expect(EMAIL_COPY.contact.subject(contactEmailDataWithoutSubject)).toBe(
      formatTemplate(emailTemplates.contact.subjectWithoutTopic, {
        firstName: contactEmailDataWithoutSubject.firstName,
        lastName: contactEmailDataWithoutSubject.lastName,
      }),
    );
    expect(EMAIL_COPY.productInquiry.title).toBe(
      emailTemplates.productInquiry.title,
    );
    expect(EMAIL_COPY.productInquiry.preview).toBe(
      emailTemplates.productInquiry.preview,
    );
    expect(EMAIL_COPY.productInquiry.footer()).toBe(
      emailTemplates.productInquiry.footer,
    );
    expect(EMAIL_COPY.productInquiry.subject(productInquiryEmailData)).toBe(
      formatTemplate(emailTemplates.productInquiry.subject, {
        productName: productInquiryEmailData.productName,
      }),
    );
  });

  it("resolves every dynamic email template placeholder before rendering", () => {
    const submittedAt = "2026-04-29 12:00 UTC";
    const siteName = "Example Pumps";
    const year = 2026;

    expectNoUnresolvedPlaceholders([
      EMAIL_COPY.confirmation.greeting(contactEmailData.firstName),
      EMAIL_COPY.confirmation.teamName(siteName),
      EMAIL_COPY.confirmation.footer(year, siteName),
      EMAIL_COPY.confirmation.subject(siteName),
      ...EMAIL_COPY.confirmation.summaryLines(contactEmailData, submittedAt),
      EMAIL_COPY.contact.preview(contactEmailData),
      EMAIL_COPY.contact.footer(siteName),
      EMAIL_COPY.contact.subject(contactEmailData),
      EMAIL_COPY.contact.subject(contactEmailDataWithoutSubject),
      EMAIL_COPY.productInquiry.footer(),
      EMAIL_COPY.productInquiry.subject(productInquiryEmailData),
    ]);
  });

  it("preserves user input that looks like later template placeholders", () => {
    const submittedAt = "2026-04-29 12:00 UTC";
    const summaryLines = EMAIL_COPY.confirmation.summaryLines(
      contactEmailDataWithPlaceholderLikeInput,
      submittedAt,
    );

    expect(summaryLines).toContain("Name: {lastName} Smith");
    expect(summaryLines).not.toContain("Name: Smith Smith");
    expect(summaryLines).toContain("Subject: {submittedAt}");
    expect(summaryLines).not.toContain(`Subject: ${submittedAt}`);
    expect(
      EMAIL_COPY.contact.preview(contactEmailDataWithPlaceholderLikeInput),
    ).toBe("New contact form submission from {lastName} Smith");
    expect(
      EMAIL_COPY.productInquiry.subject(
        productInquiryEmailDataWithPlaceholderLikeInput,
      ),
    ).toBe("Product Inquiry: {quantity}");
  });

  it("omits optional company and subject summary lines when values are absent", () => {
    const emailTemplates = getEmailTemplates();
    const submittedAt = "2026-04-29 12:00 UTC";
    const summaryLines = EMAIL_COPY.confirmation.summaryLines(
      contactEmailDataWithoutCompanyOrSubject,
      submittedAt,
    );

    expect(summaryLines).toEqual([
      formatTemplate(emailTemplates.confirmation.summaryLines.name, {
        firstName: contactEmailDataWithoutCompanyOrSubject.firstName,
        lastName: contactEmailDataWithoutCompanyOrSubject.lastName,
      }),
      formatTemplate(emailTemplates.confirmation.summaryLines.email, {
        email: contactEmailDataWithoutCompanyOrSubject.email,
      }),
      formatTemplate(emailTemplates.confirmation.summaryLines.submitted, {
        submittedAt,
      }),
    ]);
    expect(summaryLines).toHaveLength(3);
    expect(summaryLines.join("\n")).not.toContain("Company:");
    expect(summaryLines.join("\n")).not.toContain("Subject:");
    expect(summaryLines).not.toContain(
      emailTemplates.confirmation.summaryLines.company,
    );
    expect(summaryLines).not.toContain(
      emailTemplates.confirmation.summaryLines.subject,
    );
    expectNoUnresolvedPlaceholders(summaryLines);
  });
});
