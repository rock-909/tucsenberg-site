import type { CSSProperties } from "react";
import { Section, Text } from "react-email";
import type { EmailTemplateData } from "@/lib/email/email-data-schema";
import { ResendUtils } from "@/lib/resend-utils";
import { EmailLayout } from "@/emails/EmailLayout";
import { EMAIL_COPY } from "@/emails/email-copy";
import { COLORS, FONT_SIZES, SPACING } from "@/emails/theme";
import { SITE_CONFIG } from "@/config/paths/site-config";

const ACCENT_COLOR = COLORS.primary;
const CONTENT_BACKGROUND = COLORS.background;
const CURRENT_YEAR = new Date().getFullYear();

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
  const submittedAt = ResendUtils.formatDateTime(data.submittedAt);
  const summaryLines = EMAIL_COPY.confirmation.summaryLines(data, submittedAt);

  return (
    <EmailLayout
      title={EMAIL_COPY.confirmation.title}
      preview={EMAIL_COPY.confirmation.preview}
      accentColor={ACCENT_COLOR}
      footerText={EMAIL_COPY.confirmation.footer(
        CURRENT_YEAR,
        SITE_CONFIG.name,
      )}
      contentBackgroundColor={CONTENT_BACKGROUND}
    >
      <Text style={paragraphStyle}>
        {EMAIL_COPY.confirmation.greeting(data.firstName)}
      </Text>
      <Text style={paragraphStyle}>
        {EMAIL_COPY.confirmation.receivedMessage}
      </Text>
      <Text style={paragraphStyle}>{EMAIL_COPY.confirmation.summaryIntro}</Text>
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
        {EMAIL_COPY.confirmation.urgentHelp}
      </Text>
      <Text style={paragraphStyle}>{EMAIL_COPY.confirmation.signoff}</Text>
      {/* nosemgrep: object-injection-sink-spread-operator */}
      {/* Safe: paragraphStyle is a static CSSProperties object defined in this file */}
      <Text style={{ ...paragraphStyle, fontWeight: "bold" }}>
        {EMAIL_COPY.confirmation.teamName(SITE_CONFIG.name)}
      </Text>
    </EmailLayout>
  );
}
