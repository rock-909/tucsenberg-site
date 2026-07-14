import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FormPrivacyNotice } from "@/components/forms/form-privacy-notice";
import { LazyTurnstile } from "@/components/forms/lazy-turnstile";
import { buttonVariants } from "@/components/ui/button-variants";
import { Link } from "@/i18n/routing";
import type { RequestQuoteFormCopy } from "@/app/[locale]/request-quote/request-quote-form-copy";

export interface RequestQuoteSubmitState {
  readonly status: "idle" | "submitting" | "success" | "error";
  readonly message?: string;
  readonly referenceId?: string;
}

const STATUS_TONE_CLASS_NAMES = {
  info: "border-[var(--info-border)] bg-[var(--info-muted)] text-[var(--info-foreground)]",
  success:
    "border-[var(--success-border)] bg-[var(--success-muted)] text-[var(--success-foreground)]",
  error:
    "border-[var(--error-border)] bg-[var(--error-muted)] text-[var(--error-foreground)]",
} satisfies Record<"error" | "info" | "success", string>;

function RequestQuoteStatusCallout({
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

function RequestQuoteStatusMessage({
  copy,
  state,
}: {
  copy: RequestQuoteFormCopy;
  state: RequestQuoteSubmitState;
}) {
  if (state.status === "idle") {
    return null;
  }

  if (state.status === "success") {
    return (
      <RequestQuoteStatusCallout tone="success">
        <p>
          {copy.success} {copy.referenceLabel}: {state.referenceId}
        </p>
        <p className="mt-2">
          {copy.successReading}{" "}
          <Link
            className="font-medium underline underline-offset-4 hover:no-underline"
            href="/guides/flood-barrier-materials-guide"
          >
            {copy.successReadingLinkLabel}
          </Link>
        </p>
      </RequestQuoteStatusCallout>
    );
  }

  if (state.status === "error") {
    return (
      <RequestQuoteStatusCallout tone="error">
        {state.message ?? copy.genericError}
      </RequestQuoteStatusCallout>
    );
  }

  return (
    <RequestQuoteStatusCallout>{copy.submitting}</RequestQuoteStatusCallout>
  );
}

export interface RequestQuoteSubmitControlsProps {
  readonly copy: RequestQuoteFormCopy;
  readonly isSubmitting: boolean;
  readonly state: RequestQuoteSubmitState;
  readonly turnstileToken: string;
  readonly onTurnstileError: () => void;
  readonly onTurnstileSuccess: (token: string) => void;
  readonly onTurnstileReadyRef?: (reset: () => void) => (() => void) | void;
}

export function RequestQuoteSubmitControls({
  copy,
  isSubmitting,
  state,
  turnstileToken,
  onTurnstileError,
  onTurnstileSuccess,
  onTurnstileReadyRef,
}: RequestQuoteSubmitControlsProps) {
  return (
    <>
      <LazyTurnstile
        action="product_inquiry"
        onError={onTurnstileError}
        onExpire={onTurnstileError}
        onSuccess={onTurnstileSuccess}
        {...(onTurnstileReadyRef ? { onReadyRef: onTurnstileReadyRef } : {})}
      />

      <RequestQuoteStatusMessage copy={copy} state={state} />

      <FormPrivacyNotice text={copy.privacyNotice} />

      <button
        className={buttonVariants({ className: "w-full" })}
        disabled={isSubmitting || !turnstileToken}
        type="submit"
      >
        {isSubmitting ? copy.submitting : copy.submit}
      </button>
    </>
  );
}
