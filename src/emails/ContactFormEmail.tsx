import type { CSSProperties } from "react";
import { Text } from "react-email";
import type { EmailTemplateData } from "@/lib/email/email-data-schema";
import { ResendUtils } from "@/lib/resend-utils";
import { EmailField } from "@/emails/EmailField";
import { EmailLayout } from "@/emails/EmailLayout";
import { EMAIL_COPY } from "@/emails/email-copy";
import { COLORS, FONT_SIZES } from "@/emails/theme";
import { SITE_CONFIG } from "@/config/paths/site-config";

const ACCENT_COLOR = COLORS.primary;
const CONTENT_BACKGROUND = COLORS.contentBackground;

const valueTextStyle: CSSProperties = {
  margin: "0",
  lineHeight: "1.5",
};

const messageLineStyle: CSSProperties = {
  margin: "0 0 6px 0",
};

function getMessageLineKey(line: string, index: number): string {
  return `message-line-${index}-${line.length}-${line.slice(0, 16)}`;
}

export function ContactFormEmail(data: EmailTemplateData) {
  const messageLines = data.message.split("\n");
  const submittedAt = ResendUtils.formatDateTime(data.submittedAt);

  return (
    <EmailLayout
      title={EMAIL_COPY.contact.title}
      preview={EMAIL_COPY.contact.preview(data)}
      accentColor={ACCENT_COLOR}
      footerText={EMAIL_COPY.contact.footer(SITE_CONFIG.name)}
      contentBackgroundColor={CONTENT_BACKGROUND}
    >
      <EmailField label={EMAIL_COPY.common.fields.name}>
        <Text
          style={valueTextStyle}
        >{`${data.firstName} ${data.lastName}`}</Text>
      </EmailField>
      <EmailField label={EMAIL_COPY.common.fields.email}>
        <Text style={valueTextStyle}>{data.email}</Text>
      </EmailField>
      {data.company ? (
        <EmailField label={EMAIL_COPY.common.fields.company}>
          <Text style={valueTextStyle}>{data.company}</Text>
        </EmailField>
      ) : null}
      {data.phone ? (
        <EmailField label={EMAIL_COPY.common.fields.phone}>
          <Text style={valueTextStyle}>{data.phone}</Text>
        </EmailField>
      ) : null}
      {data.subject ? (
        <EmailField label={EMAIL_COPY.common.fields.subject}>
          <Text style={valueTextStyle}>{data.subject}</Text>
        </EmailField>
      ) : null}
      <EmailField label={EMAIL_COPY.common.fields.message}>
        {messageLines.map((line, index) => (
          <Text key={getMessageLineKey(line, index)} style={messageLineStyle}>
            {line || " "}
          </Text>
        ))}
      </EmailField>
      <EmailField label={EMAIL_COPY.common.fields.submittedAt}>
        <Text style={valueTextStyle}>{submittedAt}</Text>
      </EmailField>
      {data.marketingConsent ? (
        <EmailField label={EMAIL_COPY.common.fields.marketingConsent}>
          {/* nosemgrep: object-injection-sink-spread-operator */}
          {/* Safe: valueTextStyle is a static CSSProperties object defined in this file */}
          <Text
            style={{
              ...valueTextStyle,
              color: COLORS.success,
              fontSize: FONT_SIZES.sm,
            }}
          >
            {EMAIL_COPY.common.marketingConsentAccepted}
          </Text>
        </EmailField>
      ) : null}
    </EmailLayout>
  );
}
