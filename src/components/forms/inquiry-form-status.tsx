import { type ReactNode } from "react";
import { type InquiryFormCopy } from "@/components/forms/inquiry-form-copy";
import { type InquirySubmitState } from "@/components/forms/inquiry-response";
import { FormPrivacyNotice } from "@/components/forms/form-privacy-notice";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

const STATUS_TONE_CLASS_NAMES = {
  info: "border-[var(--info-border)] bg-[var(--info-muted)] text-[var(--info-foreground)]",
  success:
    "border-[var(--success-border)] bg-[var(--success-muted)] text-[var(--success-foreground)]",
  error:
    "border-[var(--error-border)] bg-[var(--error-muted)] text-[var(--error-foreground)]",
} as const;

function InquiryStatusCallout({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: keyof typeof STATUS_TONE_CLASS_NAMES;
}) {
  const isError = tone === "error";

  return (
    <div
      aria-live={isError ? "assertive" : "polite"}
      className={cn(
        "rounded-lg border p-4 text-sm",
        STATUS_TONE_CLASS_NAMES[tone],
      )}
      role={isError ? "alert" : "status"}
    >
      {children}
    </div>
  );
}

function getErrorSummary(
  copy: InquiryFormCopy,
  state: InquirySubmitState,
): string | null {
  if (state.status !== "error" || !state.errorKind) {
    return null;
  }

  switch (state.errorKind) {
    case "field":
      return copy.errors.fieldSummary;
    case "security":
      return copy.errors.securitySummary;
    case "server":
      return copy.errors.serverSummary;
    default:
      return copy.errors.serverSummary;
  }
}

export function InquiryFormStatus({
  copy,
  displayState,
  isSubmitting,
  turnstileReady,
}: {
  copy: InquiryFormCopy;
  displayState: InquirySubmitState;
  isSubmitting: boolean;
  turnstileReady: boolean;
}) {
  const errorSummary = getErrorSummary(copy, displayState);

  return (
    <>
      {displayState.status === "success" ? (
        <InquiryStatusCallout tone="success">
          <p>
            {copy.success} {copy.referenceLabel}: {displayState.referenceId}
          </p>
        </InquiryStatusCallout>
      ) : null}

      {errorSummary ? (
        <InquiryStatusCallout tone="error">{errorSummary}</InquiryStatusCallout>
      ) : null}

      {displayState.status === "submitting" ? (
        <InquiryStatusCallout>{copy.submitting}</InquiryStatusCallout>
      ) : null}

      <FormPrivacyNotice text={copy.privacyNotice} />

      <button
        className={buttonVariants({ className: "w-full" })}
        disabled={isSubmitting || !turnstileReady}
        type="submit"
      >
        {isSubmitting ? copy.submitting : copy.submit}
      </button>
    </>
  );
}
