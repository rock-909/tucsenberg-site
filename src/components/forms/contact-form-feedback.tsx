import { memo } from "react";
import {
  API_ERROR_CODES,
  FORM_NETWORK_ERROR,
} from "@/constants/api-error-codes";
import { type FormSubmissionStatus } from "@/lib/forms/form-submission-status";
import { translateApiError } from "@/lib/api/translate-error-code";
import { type ServerActionResult } from "@/lib/actions/server-action-utils";
import { type ContactFormResult } from "@/components/forms/use-contact-form";
import {
  StatusCallout,
  type StatusCalloutTone,
} from "@/components/ui/status-callout";

const CONTACT_FORM_API_ERROR_CODES = [
  API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
  API_ERROR_CODES.SERVICE_UNAVAILABLE,
  API_ERROR_CODES.INVALID_JSON_BODY,
  API_ERROR_CODES.PAYLOAD_TOO_LARGE,
  API_ERROR_CODES.CONTACT_VALIDATION_FAILED,
  API_ERROR_CODES.CONTACT_PROCESSING_ERROR,
  API_ERROR_CODES.CONTACT_SUBMISSION_EXPIRED,
  API_ERROR_CODES.TURNSTILE_REQUIRED,
  API_ERROR_CODES.TURNSTILE_REJECTED,
  API_ERROR_CODES.TURNSTILE_UNAVAILABLE,
  API_ERROR_CODES.UNKNOWN_ERROR,
] as const;

const CONTACT_FORM_API_ERROR_CODE_SET = new Set<string>(
  CONTACT_FORM_API_ERROR_CODES,
);

function normalizeContactFormApiErrorCode(errorCode: string): string {
  return CONTACT_FORM_API_ERROR_CODE_SET.has(errorCode)
    ? errorCode
    : API_ERROR_CODES.UNKNOWN_ERROR;
}

/**
 * 获取状态消息配置
 */
function getStatusConfig(
  status: FormSubmissionStatus,
  t: (key: string) => string,
): { message: string; tone: StatusCalloutTone } | undefined {
  switch (status) {
    case "success":
      return {
        message: t("submitSuccess"),
        tone: "success",
      };
    case "error":
      return {
        message: t("submitError"),
        tone: "error",
      };
    case "submitting":
      return {
        message: t("submitting"),
        tone: "info",
      };
    case "idle":
    default:
      return undefined;
  }
}

interface StatusMessageProps {
  status: FormSubmissionStatus;
  t: (key: string) => string;
}

function ContactSuccessCheckIcon() {
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center text-[var(--success-foreground)] duration-300 animate-in fade-in-0 zoom-in-95"
      data-slot="contact-success-check"
    >
      <svg
        aria-hidden="true"
        className="size-4"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M5 12.5 9.2 16.5 19 7"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.4}
        />
      </svg>
    </span>
  );
}

export const StatusMessage = memo(({ status, t }: StatusMessageProps) => {
  if (status === "idle") return null;

  const config = getStatusConfig(status, t);
  if (!config) return null;
  return (
    <StatusCallout
      data-testid="contact-form-status-message"
      tone={config.tone}
      translate="no"
    >
      <span className="flex items-start gap-2">
        {config.tone === "success" ? <ContactSuccessCheckIcon /> : null}
        <span data-testid="contact-form-status-message-text" translate="no">
          {config.message}
        </span>
      </span>
    </StatusCallout>
  );
});

StatusMessage.displayName = "StatusMessage";

interface ErrorDisplayProps {
  state: ServerActionResult<ContactFormResult> | null;
  translateForm: (key: string) => string;
  translateApi: (key: string) => string;
  containerRef?: (_node: HTMLDivElement | null) => void;
}

interface ErrorDisplayState {
  uniqueDetails: string[] | undefined;
  isValidationError: boolean;
  translatedError: string | undefined;
  hasRenderableError: boolean;
  shouldShowTranslatedMessage: boolean;
  shouldShowRawMessage: boolean;
}

function hasSubmittedError(
  state: ServerActionResult<ContactFormResult> | null,
): state is ServerActionResult<ContactFormResult> {
  return Boolean(state?.error || state?.errorCode || state?.details?.length);
}

function getErrorDisplayState(
  state: ServerActionResult<ContactFormResult>,
  translateForm: (key: string) => string,
  translateApi: (key: string) => string,
): ErrorDisplayState {
  const translatedDetails = state.details?.map((detail) =>
    detail.startsWith("errors.") ? translateForm(detail) : detail,
  );
  const uniqueDetails = translatedDetails
    ? Array.from(new Set(translatedDetails))
    : undefined;
  const isValidationError =
    state.errorCode === API_ERROR_CODES.CONTACT_VALIDATION_FAILED;
  const translatedError =
    state.errorCode === FORM_NETWORK_ERROR
      ? translateForm("networkError")
      : state.errorCode
        ? translateApiError(
            translateApi,
            normalizeContactFormApiErrorCode(state.errorCode),
          )
        : undefined;
  const shouldShowTranslatedMessage =
    translatedError !== undefined && !isValidationError;
  const shouldShowRawMessage = false;

  return {
    uniqueDetails,
    isValidationError,
    translatedError,
    hasRenderableError:
      shouldShowTranslatedMessage ||
      shouldShowRawMessage ||
      (uniqueDetails?.length ?? 0) > 0,
    shouldShowTranslatedMessage,
    shouldShowRawMessage,
  };
}

export function ErrorDisplay({
  state,
  translateForm,
  translateApi,
  containerRef,
}: ErrorDisplayProps) {
  if (!hasSubmittedError(state)) return null;

  const {
    uniqueDetails,
    translatedError,
    hasRenderableError,
    shouldShowTranslatedMessage,
    shouldShowRawMessage,
  } = getErrorDisplayState(state, translateForm, translateApi);

  if (!hasRenderableError) return null;

  return (
    <StatusCallout
      ref={containerRef}
      data-testid="contact-form-error-display"
      role="alert"
      tabIndex={-1}
      title={
        <span data-testid="contact-form-error-heading" translate="no">
          {translateForm("error")}
        </span>
      }
      tone="error"
      translate="no"
    >
      {shouldShowTranslatedMessage && (
        <p className="text-sm">{translatedError}</p>
      )}
      {shouldShowRawMessage && <p className="text-sm">{state.error}</p>}
      {uniqueDetails && uniqueDetails.length > 0 && (
        <ul className="mt-2 list-inside list-disc text-sm">
          {uniqueDetails.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
    </StatusCallout>
  );
}
