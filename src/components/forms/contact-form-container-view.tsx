import { useFormStatus } from "react-dom";
import type { FormSubmissionStatus } from "@/lib/forms/form-submission-status";
import type { ServerActionResult } from "@/lib/actions/server-action-utils";
import type {
  ContactFormResult,
  TurnstileStatus,
} from "@/components/forms/use-contact-form";
import { Button } from "@/components/ui/button";
import { ContactFormShell } from "@/components/ui/contact-form-shell";
import {
  ErrorDisplay,
  StatusMessage,
} from "@/components/forms/contact-form-feedback";
import { FormFields } from "@/components/forms/contact-form-fields";
import { FORM_STATUS_CLASS_NAMES } from "@/components/forms/form-status-styles";
import { LazyTurnstile } from "@/components/forms/lazy-turnstile";

export interface ContactFormContainerViewProps {
  state: ServerActionResult<ContactFormResult> | null;
  formAction: (formData: FormData) => void;
  isPending: boolean;
  submitStatus: FormSubmissionStatus;
  turnstileToken: string;
  turnstileStatus: TurnstileStatus;
  isRateLimited: boolean;
  translateForm: (key: string) => string;
  translateApi: (key: string) => string;
  turnstileLabels: {
    unavailable: string;
    loadFailed: string;
    devBypass: string;
    testMode: string;
  };
  onTurnstileSuccess: (token: string) => void;
  onTurnstileError: () => void;
  onTurnstileExpire: () => void;
  onTurnstileLoad: () => void;
  errorContainerRef?: (node: HTMLDivElement | null) => void;
}

const TURNSTILE_STATUS_MESSAGE_KEYS: Record<TurnstileStatus, string> = {
  loading: "turnstilePending",
  verified: "turnstilePending",
  error: "turnstileFailed",
  expired: "turnstileExpired",
};

interface SubmitButtonProps {
  disabled: boolean;
  idleLabel: string;
  pendingLabel: string;
}

function SubmitButton({
  disabled,
  idleLabel,
  pendingLabel,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <Button
      type="submit"
      className="w-full"
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={pending}
      data-testid="contact-form-submit-button"
      translate="no"
    >
      <span data-testid="contact-form-submit-label" translate="no">
        {pending ? pendingLabel : idleLabel}
      </span>
    </Button>
  );
}

export function ContactFormContainerView({
  state,
  formAction,
  isPending,
  submitStatus,
  turnstileToken,
  turnstileStatus,
  isRateLimited,
  translateForm,
  translateApi,
  turnstileLabels,
  onTurnstileSuccess,
  onTurnstileError,
  onTurnstileExpire,
  onTurnstileLoad,
  errorContainerRef,
}: ContactFormContainerViewProps) {
  const shouldShowTurnstilePendingMessage = Boolean(
    !turnstileToken && !isPending && !isRateLimited,
  );
  const turnstileStatusMessageKey =
    TURNSTILE_STATUS_MESSAGE_KEYS[turnstileStatus];
  const submitDisabledReason = Boolean(
    isPending || !turnstileToken || isRateLimited,
  );

  return (
    <ContactFormShell>
      <form
        action={formAction}
        aria-busy={isPending}
        className="space-y-6 p-6"
        noValidate
      >
        <StatusMessage status={submitStatus} t={translateForm} />

        <ErrorDisplay
          state={state}
          translateForm={translateForm}
          translateApi={translateApi}
          {...(errorContainerRef ? { containerRef: errorContainerRef } : {})}
        />

        <FormFields t={translateForm} isPending={isPending} />

        <LazyTurnstile
          labels={turnstileLabels}
          onSuccess={onTurnstileSuccess}
          onError={onTurnstileError}
          onExpire={onTurnstileExpire}
          onLoad={onTurnstileLoad}
        />

        {shouldShowTurnstilePendingMessage ? (
          <p
            className={`text-center text-sm ${FORM_STATUS_CLASS_NAMES.infoText}`}
            aria-live="polite"
            data-testid="contact-form-turnstile-status"
            translate="no"
          >
            {translateForm(turnstileStatusMessageKey)}
          </p>
        ) : null}

        <SubmitButton
          disabled={submitDisabledReason}
          idleLabel={translateForm("submit")}
          pendingLabel={translateForm("submitting")}
        />

        {isRateLimited ? (
          <p
            className={`text-center text-sm ${FORM_STATUS_CLASS_NAMES.warningText}`}
            aria-live="polite"
          >
            {translateForm("rateLimitMessage")}
          </p>
        ) : null}
      </form>
    </ContactFormShell>
  );
}
