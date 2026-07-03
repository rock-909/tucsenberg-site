import type { CSSProperties, ReactNode } from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";
import {
  COLORS,
  FONT_FAMILY,
  FONT_SIZES,
  SIZES,
  SPACING,
} from "@/emails/theme";

interface EmailLayoutProps {
  title: string;
  preview: string;
  accentColor?: string;
  footerText: string;
  children: ReactNode;
  contentBackgroundColor?: string;
}

const bodyStyle: CSSProperties = {
  fontFamily: FONT_FAMILY,
  lineHeight: "1.6",
  color: COLORS.text,
  backgroundColor: COLORS.background,
  margin: "0",
  padding: "0",
};

const containerStyle: CSSProperties = {
  maxWidth: SIZES.maxWidth,
  margin: "0 auto",
  padding: SPACING.lg,
};

const headerStyle: CSSProperties = {
  padding: SPACING.lg,
  textAlign: "center",
  color: COLORS.headerText,
  borderRadius: `${SIZES.borderRadius} ${SIZES.borderRadius} 0 0`,
};

const headingStyle: CSSProperties = {
  margin: "0",
  fontSize: FONT_SIZES.xl,
};

const footerStyle: CSSProperties = {
  padding: SPACING.lg,
  textAlign: "center",
};

const footerTextStyle: CSSProperties = {
  margin: "0",
  fontSize: FONT_SIZES.xs,
  color: COLORS.muted,
};

function buildContentStyle(contentBackgroundColor?: string): CSSProperties {
  return {
    padding: SPACING.lg,
    backgroundColor: contentBackgroundColor ?? COLORS.contentBackground,
    borderRadius: `0 0 ${SIZES.borderRadius} ${SIZES.borderRadius}`,
  };
}

export function EmailLayout({
  title,
  preview,
  accentColor = COLORS.primary,
  footerText,
  children,
  contentBackgroundColor,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* nosemgrep: object-injection-sink-spread-operator */}
          {/* Safe: headerStyle is a static CSSProperties object, accentColor is a validated color string */}
          <Section style={{ ...headerStyle, backgroundColor: accentColor }}>
            <Heading style={headingStyle}>{title}</Heading>
          </Section>
          <Section style={buildContentStyle(contentBackgroundColor)}>
            {children}
          </Section>
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>{footerText}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
