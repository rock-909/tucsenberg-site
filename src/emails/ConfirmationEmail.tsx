import type { CSSProperties } from "react";
import { Section, Text } from "react-email";
import type { EmailTemplateData } from "@/lib/email/email-data-schema";
import { ResendUtils } from "@/lib/resend-utils";
import { EmailLayout } from "@/emails/EmailLayout";
import { COLORS, FONT_SIZES, SPACING } from "@/emails/theme";
import { SITE_CONFIG } from "@/config/paths/site-config";

const ACCENT_COLOR = COLORS.primary;
const CONTENT_BACKGROUND = COLORS.background;
const PREVIEW_TEXT = "We received your message and will reply within 24 hours.";
const CURRENT_YEAR = new Date().getFullYear();
const FOOTER_TEXT = `© ${CURRENT_YEAR} ${SITE_CONFIG.name}. All rights reserved.`;

const paragraphStyle: CSSProperties = {
  margin: `0 0 ${SPACING.md} 0`,
  fontSize: FONT_SIZES.md,
  lineHeight: "1.6",
};

const summaryLineStyle: CSSProperties = {
  margin: "0 0 6px 0",
  fontSize: FONT_SIZES.sm,
};

export function ConfirmationEmail(data: EmailTemplateData) {
  const summaryLines = [
    `Name: ${data.firstName} ${data.lastName}`,
    data.company ? `Company: ${data.company}` : null,
    `Email: ${data.email}`,
    data.subject ? `Subject: ${data.subject}` : null,
    `Submitted: ${ResendUtils.formatDateTime(data.submittedAt)}`,
  ].filter((line): line is string => Boolean(line));

  return (
    <EmailLayout
      title="Thank You for Contacting Us"
      preview={PREVIEW_TEXT}
      accentColor={ACCENT_COLOR}
      footerText={FOOTER_TEXT}
      contentBackgroundColor={CONTENT_BACKGROUND}
    >
      <Text style={paragraphStyle}>Dear {data.firstName},</Text>
      <Text style={paragraphStyle}>
        Thank you for reaching out to us. We have received your message and will
        get back to you within 24 hours.
      </Text>
      <Text style={paragraphStyle}>Here is a summary of your submission:</Text>
      <Section>
        {summaryLines.map((line) => (
          <Text key={line} style={summaryLineStyle}>
            - {line}
          </Text>
        ))}
      </Section>
      {/* nosemgrep: object-injection-sink-spread-operator */}
      {/* Safe: paragraphStyle is a static CSSProperties object defined in this file */}
      <Text style={{ ...paragraphStyle, marginTop: SPACING.lg }}>
        If you have any urgent questions, please do not hesitate to contact us
        directly.
      </Text>
      <Text style={paragraphStyle}>Best regards,</Text>
      {/* nosemgrep: object-injection-sink-spread-operator */}
      {/* Safe: paragraphStyle is a static CSSProperties object defined in this file */}
      <Text style={{ ...paragraphStyle, fontWeight: "bold" }}>
        The {SITE_CONFIG.name} Team
      </Text>
    </EmailLayout>
  );
}
