import { memo } from "react";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import { type FormSubmissionStatus } from "@/lib/forms/form-submission-status";
import { translateApiError } from "@/lib/api/translate-error-code";
import { type ServerActionResult } from "@/lib/actions/server-action-utils";
import { type ContactFormResult } from "@/components/forms/use-contact-form";
import { FORM_STATUS_CLASS_NAMES } from "@/components/forms/form-status-styles";

const FORM_NETWORK_ERROR_CODE = "FORM_NETWORK_ERROR";

/**
 * 获取状态消息配置
 */
function getStatusConfig(
  status: FormSubmissionStatus,
  t: (key: string) => string,
): { className: string; message: string } | undefined {
  switch (status) {
    case "success":
      return {
        className: FORM_STATUS_CLASS_NAMES.success,
        message: t("submitSuccess"),
      };
    case "error":
      return {
        className: FORM_STATUS_CLASS_NAMES.error,
        message: t("submitError"),
      };
    case "submitting":
      return {
        className: FORM_STATUS_CLASS_NAMES.submitting,
        message: t("submitting"),
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

export const StatusMessage = memo(({ status, t }: StatusMessageProps) => {
  if (status === "idle") return null;

  const config = getStatusConfig(status, t);
  if (!config) return null;
  const isError = status === "error";

  return (
    <div
      className={`rounded-md border p-4 ${config.className}`}
      data-testid="contact-form-status-message"
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      translate="no"
    >
      <span data-testid="contact-form-status-message-text" translate="no">
        {config.message}
      </span>
    </div>
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
  containerClass: string;
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
    state.errorCode === FORM_NETWORK_ERROR_CODE
      ? translateForm("networkError")
      : state.errorCode
        ? translateApiError(translateApi, state.errorCode)
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
    containerClass: `rounded-lg border p-4 ${FORM_STATUS_CLASS_NAMES.error}`,
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
    containerClass,
  } = getErrorDisplayState(state, translateForm, translateApi);

  if (!hasRenderableError) return null;

  return (
    <div
      ref={containerRef}
      className={containerClass}
      data-testid="contact-form-error-display"
      role="alert"
      aria-live="assertive"
      tabIndex={-1}
      translate="no"
    >
      <p
        className="font-medium"
        data-testid="contact-form-error-heading"
        translate="no"
      >
        {translateForm("error")}
      </p>
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
    </div>
  );
}
