import type { CSSProperties } from "react";
import { Section, Text } from "react-email";
import type { ProductInquiryEmailData } from "@/lib/email/email-data-schema";
import { EmailField } from "@/emails/EmailField";
import { EmailLayout } from "@/emails/EmailLayout";
import { COLORS, FONT_SIZES, SPACING } from "@/emails/theme";

const ACCENT_COLOR = COLORS.success;
const CONTENT_BACKGROUND = COLORS.contentBackground;
const PREVIEW_TEXT = "New product inquiry received.";

const highlightStyle: CSSProperties = {
  backgroundColor: COLORS.successLight,
  borderLeft: `4px solid ${COLORS.success}`,
  padding: SPACING.md,
  marginBottom: SPACING.lg,
};

const highlightLabelStyle: CSSProperties = {
  margin: "0 0 6px 0",
  fontWeight: "bold",
  color: COLORS.textLight,
  fontSize: FONT_SIZES.sm,
};

const productNameStyle: CSSProperties = {
  margin: "0 0 10px 0",
  fontSize: FONT_SIZES.lg,
  fontWeight: "bold",
};

const quantityStyle: CSSProperties = {
  margin: "0",
  fontSize: FONT_SIZES.md,
  fontWeight: "bold",
  color: COLORS.success,
};

const valueTextStyle: CSSProperties = {
  margin: "0",
  lineHeight: "1.5",
};

const requirementLineStyle: CSSProperties = {
  margin: "0 0 6px 0",
};

function getRequirementLineKey(line: string, index: number): string {
  return `requirement-line-${index}-${line.length}-${line.slice(0, 16)}`;
}

export function ProductInquiryEmail(data: ProductInquiryEmailData) {
  const quantity =
    typeof data.quantity === "number"
      ? data.quantity.toString()
      : data.quantity;
  const requirementLines = data.requirements
    ? data.requirements.split("\n")
    : [];
  const footerText = `This inquiry was submitted from the product page: ${data.productSlug}`;

  return (
    <EmailLayout
      title="New Product Inquiry"
      preview={PREVIEW_TEXT}
      accentColor={ACCENT_COLOR}
      footerText={footerText}
      contentBackgroundColor={CONTENT_BACKGROUND}
    >
      <Section style={highlightStyle}>
        <Text style={highlightLabelStyle}>Product</Text>
        <Text style={productNameStyle}>{data.productName}</Text>
        <Text style={highlightLabelStyle}>Quantity</Text>
        <Text style={quantityStyle}>{quantity}</Text>
      </Section>
      <EmailField label="Contact Name">
        <Text
          style={valueTextStyle}
        >{`${data.firstName} ${data.lastName}`}</Text>
      </EmailField>
      <EmailField label="Email">
        <Text style={valueTextStyle}>{data.email}</Text>
      </EmailField>
      {data.company ? (
        <EmailField label="Company">
          <Text style={valueTextStyle}>{data.company}</Text>
        </EmailField>
      ) : null}
      {data.requirements ? (
        <EmailField label="Requirements">
          {requirementLines.map((line, index) => (
            <Text
              key={getRequirementLineKey(line, index)}
              style={requirementLineStyle}
            >
              {line || " "}
            </Text>
          ))}
        </EmailField>
      ) : null}
      {data.marketingConsent ? (
        <EmailField label="Marketing Consent">
          {/* nosemgrep: object-injection-sink-spread-operator */}
          {/* Safe: valueTextStyle is a static CSSProperties object defined in this file */}
          <Text
            style={{
              ...valueTextStyle,
              color: COLORS.success,
              fontSize: FONT_SIZES.sm,
            }}
          >
            Yes, agreed to receive marketing communications
          </Text>
        </EmailField>
      ) : null}
    </EmailLayout>
  );
}
