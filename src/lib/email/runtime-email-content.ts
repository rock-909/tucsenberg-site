import { SITE_CONFIG } from "@/config/paths/site-config";
import { EMAIL_COPY } from "@/emails/email-copy";
import {
  COLORS,
  FONT_FAMILY,
  FONT_SIZES,
  SIZES,
  SPACING,
} from "@/emails/theme";
import type {
  EmailTemplateData,
  ProductInquiryEmailData,
} from "@/lib/email/email-data-schema";
import { formatQuantity } from "@/lib/lead-pipeline/utils";
import { ResendUtils } from "@/lib/resend-utils";

export interface RuntimeEmailContent {
  html: string;
  text: string;
}

interface EmailFieldContent {
  label: string;
  value: string;
  multiline?: boolean;
}

interface EmailDocumentOptions {
  title: string;
  preview: string;
  accentColor: string;
  footerText: string;
  contentBackgroundColor: string;
  bodyHtml: string;
  bodyText: string;
}

const CURRENT_YEAR = new Date().getFullYear();

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function compactFields(
  fields: Array<EmailFieldContent | null | undefined>,
): EmailFieldContent[] {
  return fields.filter((field): field is EmailFieldContent => Boolean(field));
}

function renderParagraph(text: string): string {
  return `<p style="margin:0 0 ${SPACING.md} 0;font-size:${FONT_SIZES.md};line-height:1.6;">${escapeHtml(text)}</p>`;
}

function renderField({ label, value, multiline }: EmailFieldContent): string {
  const valueHtml = multiline
    ? value
        .split(/\r?\n/u)
        .map(
          (line) =>
            `<p style="margin:0 0 6px 0;line-height:1.5;">${escapeHtml(
              line || " ",
            )}</p>`,
        )
        .join("")
    : `<p style="margin:0;line-height:1.5;">${escapeHtml(value)}</p>`;

  return [
    `<section style="margin-bottom:${SPACING.md};">`,
    `<p style="font-weight:bold;color:${COLORS.textLight};margin:0 0 5px 0;">${escapeHtml(label)}</p>`,
    `<section style="margin:0;padding:${SPACING.sm};background-color:${COLORS.background};border-radius:${SIZES.borderRadius};">`,
    valueHtml,
    "</section>",
    "</section>",
  ].join("");
}

function renderFields(fields: readonly EmailFieldContent[]): string {
  return fields.map((field) => renderField(field)).join("");
}

function renderPlainFields(fields: readonly EmailFieldContent[]): string {
  return fields.map((field) => `${field.label}: ${field.value}`).join("\n");
}

function renderEmailDocument({
  title,
  preview,
  accentColor,
  footerText,
  contentBackgroundColor,
  bodyHtml,
  bodyText,
}: EmailDocumentOptions): RuntimeEmailContent {
  const html = [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    `<title>${escapeHtml(title)}</title>`,
    "</head>",
    `<body style="font-family:${FONT_FAMILY};line-height:1.6;color:${COLORS.text};background-color:${COLORS.background};margin:0;padding:0;">`,
    `<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preview)}</div>`,
    `<main style="max-width:${SIZES.maxWidth};margin:0 auto;padding:${SPACING.lg};">`,
    `<section style="padding:${SPACING.lg};text-align:center;color:${COLORS.headerText};border-radius:${SIZES.borderRadius} ${SIZES.borderRadius} 0 0;background-color:${accentColor};">`,
    `<h1 style="margin:0;font-size:${FONT_SIZES.xl};">${escapeHtml(title)}</h1>`,
    "</section>",
    `<section style="padding:${SPACING.lg};background-color:${contentBackgroundColor};border-radius:0 0 ${SIZES.borderRadius} ${SIZES.borderRadius};">`,
    bodyHtml,
    "</section>",
    `<footer style="padding:${SPACING.lg};text-align:center;">`,
    `<p style="margin:0;font-size:${FONT_SIZES.xs};color:${COLORS.muted};">${escapeHtml(footerText)}</p>`,
    "</footer>",
    "</main>",
    "</body>",
    "</html>",
  ].join("");

  return {
    html,
    text: [title, "", preview, "", bodyText, "", footerText].join("\n"),
  };
}

export function buildContactFormEmailContent(
  data: EmailTemplateData,
): RuntimeEmailContent {
  const submittedAt = ResendUtils.formatDateTime(data.submittedAt);
  const fields = compactFields([
    {
      label: EMAIL_COPY.common.fields.name,
      value: `${data.firstName} ${data.lastName}`,
    },
    { label: EMAIL_COPY.common.fields.email, value: data.email },
    data.company
      ? { label: EMAIL_COPY.common.fields.company, value: data.company }
      : null,
    data.phone
      ? { label: EMAIL_COPY.common.fields.phone, value: data.phone }
      : null,
    data.subject
      ? { label: EMAIL_COPY.common.fields.subject, value: data.subject }
      : null,
    {
      label: EMAIL_COPY.common.fields.message,
      value: data.message,
      multiline: true,
    },
    { label: EMAIL_COPY.common.fields.submittedAt, value: submittedAt },
    data.marketingConsent
      ? {
          label: EMAIL_COPY.common.fields.marketingConsent,
          value: EMAIL_COPY.common.marketingConsentAccepted,
        }
      : null,
  ]);

  return renderEmailDocument({
    title: EMAIL_COPY.contact.title,
    preview: EMAIL_COPY.contact.preview(data),
    accentColor: COLORS.primary,
    footerText: EMAIL_COPY.contact.footer(SITE_CONFIG.name),
    contentBackgroundColor: COLORS.contentBackground,
    bodyHtml: renderFields(fields),
    bodyText: renderPlainFields(fields),
  });
}

export function buildConfirmationEmailContent(
  data: EmailTemplateData,
): RuntimeEmailContent {
  const submittedAt = ResendUtils.formatDateTime(data.submittedAt);
  const summaryLines = EMAIL_COPY.confirmation.summaryLines(data, submittedAt);
  const bodyText = [
    EMAIL_COPY.confirmation.greeting(data.firstName),
    "",
    EMAIL_COPY.confirmation.receivedMessage,
    "",
    EMAIL_COPY.confirmation.summaryIntro,
    ...summaryLines.map((line) => `- ${line}`),
    "",
    EMAIL_COPY.confirmation.urgentHelp,
    "",
    EMAIL_COPY.confirmation.signoff,
    EMAIL_COPY.confirmation.teamName(SITE_CONFIG.name),
  ].join("\n");
  const bodyHtml = [
    renderParagraph(EMAIL_COPY.confirmation.greeting(data.firstName)),
    renderParagraph(EMAIL_COPY.confirmation.receivedMessage),
    renderParagraph(EMAIL_COPY.confirmation.summaryIntro),
    "<section>",
    ...summaryLines.map(
      (line) =>
        `<p style="margin:0 0 6px 0;font-size:${FONT_SIZES.sm};">- ${escapeHtml(
          line,
        )}</p>`,
    ),
    "</section>",
    renderParagraph(EMAIL_COPY.confirmation.urgentHelp),
    renderParagraph(EMAIL_COPY.confirmation.signoff),
    `<p style="margin:0 0 ${SPACING.md} 0;font-size:${FONT_SIZES.md};line-height:1.6;font-weight:bold;">${escapeHtml(
      EMAIL_COPY.confirmation.teamName(SITE_CONFIG.name),
    )}</p>`,
  ].join("");

  return renderEmailDocument({
    title: EMAIL_COPY.confirmation.title,
    preview: EMAIL_COPY.confirmation.preview,
    accentColor: COLORS.primary,
    footerText: EMAIL_COPY.confirmation.footer(CURRENT_YEAR, SITE_CONFIG.name),
    contentBackgroundColor: COLORS.background,
    bodyHtml,
    bodyText,
  });
}

export function buildProductInquiryEmailContent(
  data: ProductInquiryEmailData,
): RuntimeEmailContent {
  const quantity =
    data.quantity !== undefined ? formatQuantity(data.quantity) : undefined;
  const fields = compactFields([
    { label: EMAIL_COPY.common.fields.product, value: data.productName },
    quantity
      ? { label: EMAIL_COPY.common.fields.quantity, value: quantity }
      : null,
    {
      label: EMAIL_COPY.common.fields.contactName,
      value: `${data.firstName} ${data.lastName}`,
    },
    { label: EMAIL_COPY.common.fields.email, value: data.email },
    data.company
      ? { label: EMAIL_COPY.common.fields.company, value: data.company }
      : null,
    data.requirements
      ? {
          label: EMAIL_COPY.common.fields.requirements,
          value: data.requirements,
          multiline: true,
        }
      : null,
    data.marketingConsent
      ? {
          label: EMAIL_COPY.common.fields.marketingConsent,
          value: EMAIL_COPY.common.marketingConsentAccepted,
        }
      : null,
  ]);
  const highlightHtml = [
    `<section style="background-color:${COLORS.successLight};border-left:4px solid ${COLORS.success};padding:${SPACING.md};margin-bottom:${SPACING.lg};">`,
    `<p style="margin:0 0 6px 0;font-weight:bold;color:${COLORS.textLight};font-size:${FONT_SIZES.sm};">${escapeHtml(
      EMAIL_COPY.common.fields.product,
    )}</p>`,
    `<p style="margin:0 0 10px 0;font-size:${FONT_SIZES.lg};font-weight:bold;">${escapeHtml(
      data.productName,
    )}</p>`,
    ...(quantity
      ? [
          `<p style="margin:0 0 6px 0;font-weight:bold;color:${COLORS.textLight};font-size:${FONT_SIZES.sm};">${escapeHtml(
            EMAIL_COPY.common.fields.quantity,
          )}</p>`,
          `<p style="margin:0;font-size:${FONT_SIZES.md};font-weight:bold;color:${COLORS.success};">${escapeHtml(
            quantity,
          )}</p>`,
        ]
      : []),
    "</section>",
  ].join("");
  const bodyFields = fields.filter(
    (field) =>
      field.label !== EMAIL_COPY.common.fields.product &&
      field.label !== EMAIL_COPY.common.fields.quantity,
  );

  return renderEmailDocument({
    title: EMAIL_COPY.productInquiry.title,
    preview: EMAIL_COPY.productInquiry.preview,
    accentColor: COLORS.success,
    footerText: EMAIL_COPY.productInquiry.footer(),
    contentBackgroundColor: COLORS.contentBackground,
    bodyHtml: `${highlightHtml}${renderFields(bodyFields)}`,
    bodyText: renderPlainFields(fields),
  });
}
