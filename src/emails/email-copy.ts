import type {
  EmailTemplateData,
  ProductInquiryEmailData,
} from "@/lib/email/email-data-schema";
import { SITE_CONFIG } from "@/config/paths/site-config";
import baseEnglishDeferredMessages from "@messages/base/en/deferred.json";

const emailTemplateCopy = baseEnglishDeferredMessages.emailTemplates;
const TEMPLATE_PLACEHOLDER_PATTERN = /\{([A-Za-z][A-Za-z0-9]*)\}/g;

function formatTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(
    TEMPLATE_PLACEHOLDER_PATTERN,
    (placeholder: string, key: string) => {
      const value = values[key];

      return value === undefined ? placeholder : String(value);
    },
  );
}

export const EMAIL_COPY = {
  common: {
    unknownSubmissionTime: emailTemplateCopy.common.unknownSubmissionTime,
    fields: emailTemplateCopy.common.fields,
  },
  confirmation: {
    title: emailTemplateCopy.confirmation.title,
    preview: emailTemplateCopy.confirmation.preview,
    receivedMessage: emailTemplateCopy.confirmation.receivedMessage,
    summaryIntro: emailTemplateCopy.confirmation.summaryIntro,
    urgentHelp: emailTemplateCopy.confirmation.urgentHelp,
    signoff: emailTemplateCopy.confirmation.signoff,
    greeting: (firstName: string) =>
      formatTemplate(emailTemplateCopy.confirmation.greeting, { firstName }),
    teamName: (siteName = SITE_CONFIG.name) =>
      formatTemplate(emailTemplateCopy.confirmation.teamName, { siteName }),
    footer: (year: number, siteName = SITE_CONFIG.name) =>
      formatTemplate(emailTemplateCopy.confirmation.footer, { year, siteName }),
    subject: (siteName = SITE_CONFIG.name) =>
      formatTemplate(emailTemplateCopy.confirmation.subject, { siteName }),
    summaryLines: (data: EmailTemplateData, submittedAt: string) =>
      [
        formatTemplate(emailTemplateCopy.confirmation.summaryLines.name, {
          firstName: data.firstName,
          lastName: data.lastName,
        }),
        data.company
          ? formatTemplate(
              emailTemplateCopy.confirmation.summaryLines.company,
              {
                company: data.company,
              },
            )
          : null,
        formatTemplate(emailTemplateCopy.confirmation.summaryLines.email, {
          email: data.email,
        }),
        data.subject
          ? formatTemplate(
              emailTemplateCopy.confirmation.summaryLines.subject,
              {
                subject: data.subject,
              },
            )
          : null,
        formatTemplate(emailTemplateCopy.confirmation.summaryLines.submitted, {
          submittedAt,
        }),
      ].filter((line): line is string => Boolean(line)),
  },
  contact: {
    title: emailTemplateCopy.contact.title,
    preview: (data: EmailTemplateData) =>
      formatTemplate(emailTemplateCopy.contact.preview, {
        firstName: data.firstName,
        lastName: data.lastName,
      }),
    footer: (siteName = SITE_CONFIG.name) =>
      formatTemplate(emailTemplateCopy.contact.footer, { siteName }),
    subject: (data: EmailTemplateData) =>
      data.subject
        ? formatTemplate(emailTemplateCopy.contact.subjectWithTopic, {
            subject: data.subject,
          })
        : formatTemplate(emailTemplateCopy.contact.subjectWithoutTopic, {
            firstName: data.firstName,
            lastName: data.lastName,
          }),
  },
  productInquiry: {
    title: emailTemplateCopy.productInquiry.title,
    preview: emailTemplateCopy.productInquiry.preview,
    // Neutral footer: an inquiry may be a catalog-product enquiry or a general
    // RFQ, so it must not claim a specific product page or slug.
    footer: () => emailTemplateCopy.productInquiry.footer,
    subject: (data: ProductInquiryEmailData) =>
      formatTemplate(emailTemplateCopy.productInquiry.subject, {
        productName: data.productName,
      }),
  },
} as const;
