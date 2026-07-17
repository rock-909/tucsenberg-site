import { type ZodIssue } from "zod";

export type ValidationFieldErrorKeys = Partial<Record<string, string>>;

const FALLBACK_VALIDATION_DETAIL = "errors.generic";

function getBaseValidationKey(
  issue: ZodIssue,
  fieldKeys: ValidationFieldErrorKeys,
): string {
  const [rawField] = issue.path;
  if (typeof rawField !== "string") {
    return FALLBACK_VALIDATION_DETAIL;
  }

  return fieldKeys[rawField] ?? FALLBACK_VALIDATION_DETAIL;
}

function isRequiredMinimum(issue: ZodIssue): boolean {
  return (
    "minimum" in issue &&
    typeof issue.minimum === "number" &&
    issue.minimum <= 1
  );
}

function isMissingRequiredInvalidType(issue: ZodIssue): boolean {
  // Zod 4 invalid_type issues often omit `input`. Only treat as missing when
  // the issue text says undefined was received — wrong types map to .invalid.
  return (
    issue.code === "invalid_type" &&
    issue.message.toLowerCase().includes("received undefined")
  );
}

function isBlankRequiredIssue(issue: ZodIssue): boolean {
  return (
    "input" in issue &&
    typeof issue.input === "string" &&
    issue.input.trim().length === 0
  );
}

function mapZodIssueToValidationDetail(
  issue: ZodIssue,
  fieldKeys: ValidationFieldErrorKeys,
): string {
  const baseKey = getBaseValidationKey(issue, fieldKeys);

  switch (issue.code) {
    case "too_small":
      return isRequiredMinimum(issue) || isBlankRequiredIssue(issue)
        ? `${baseKey}.required`
        : `${baseKey}.tooShort`;
    case "too_big":
      return `${baseKey}.tooLong`;
    case "invalid_type":
      return isMissingRequiredInvalidType(issue)
        ? `${baseKey}.required`
        : `${baseKey}.invalid`;
    case "custom":
      return issue.message.toLowerCase().includes("required")
        ? `${baseKey}.required`
        : `${baseKey}.invalid`;
    default:
      return baseKey === FALLBACK_VALIDATION_DETAIL
        ? FALLBACK_VALIDATION_DETAIL
        : `${baseKey}.invalid`;
  }
}

export function mapZodIssuesToValidationDetails(
  issues: readonly ZodIssue[],
  fieldKeys: ValidationFieldErrorKeys,
): string[] {
  const details = Array.from(
    new Set(
      issues.map((issue) => mapZodIssueToValidationDetail(issue, fieldKeys)),
    ),
  );

  return details.filter((detail) => {
    if (!detail.endsWith(".invalid")) return true;
    const baseKey = detail.slice(0, -".invalid".length);
    return !details.includes(`${baseKey}.required`);
  });
}
