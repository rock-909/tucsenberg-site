export const FORM_STATUS_CLASS_NAMES = {
  success:
    "border-[var(--success-border)] bg-[var(--success-muted)] text-[var(--success-foreground)]",
  error:
    "border-[var(--error-border)] bg-[var(--error-muted)] text-[var(--error-foreground)]",
  submitting:
    "border-[var(--info-border)] bg-[var(--info-muted)] text-[var(--info-foreground)]",
  infoText: "text-[var(--info-foreground)]",
  warningText: "text-[var(--warning-foreground)]",
} as const;

export const FORM_FIELD_REQUIRED_CLASS_NAME =
  "after:ml-0.5 after:text-destructive after:content-['*']";
