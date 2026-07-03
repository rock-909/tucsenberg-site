import type { CSSProperties, ReactNode } from "react";
import { Section, Text } from "react-email";
import { COLORS, SIZES, SPACING } from "@/emails/theme";

interface EmailFieldProps {
  label: string;
  children: ReactNode;
}

const fieldStyle: CSSProperties = {
  marginBottom: SPACING.md,
};

const labelStyle: CSSProperties = {
  fontWeight: "bold",
  color: COLORS.textLight,
  margin: "0 0 5px 0",
};

const valueContainerStyle: CSSProperties = {
  margin: "0",
  padding: SPACING.sm,
  backgroundColor: COLORS.background,
  borderRadius: SIZES.borderRadius,
};

export function EmailField({ label, children }: EmailFieldProps) {
  return (
    <Section style={fieldStyle}>
      <Text style={labelStyle}>{label}</Text>
      <Section style={valueContainerStyle}>{children}</Section>
    </Section>
  );
}
