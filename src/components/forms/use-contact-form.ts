import { useState } from "react";
import {
  API_ERROR_CODES,
  FORM_NETWORK_ERROR,
} from "@/constants/api-error-codes";
import { pickAttributionFieldsFromFormData } from "@/lib/marketing/attribution-fields";
import { readLeadReferenceId } from "@/lib/forms/lead-response";
import { useRateLimit } from "@/components/forms/use-rate-limit";
import { type FormSubmissionStatus } from "@/lib/forms/form-submission-status";
import { useLeadFormSubmission } from "@/lib/forms/use-lead-form-submission";
import { type ServerActionResult } from "@/lib/actions/server-action-utils";

export interface ContactFormResult {
  referenceId?: string | null;
}

export type TurnstileStatus = "loading" | "verified" | "error" | "expired";

export interface UseContactFormResult {
  state: ServerActionResult<ContactFormResult> | null;
  formAction: (formData: FormData) => Promise<void>;
  isPending: boolean;
  submitStatus: FormSubmissionStatus;
  turnstileToken: string;
  setTurnstileToken: (token: string) => void;
  turnstileStatus: TurnstileStatus;
  setTurnstileStatus: (status: TurnstileStatus) => void;
  isRateLimited: boolean;
}

/**
 * 管理联系表单状态和提交流程。
 *
 * 共享的提交生命周期（提交锁、Turnstile 令牌、归因、请求解码、状态机）来自
 * `useLeadFormSubmission`；联系表单在其之上保留自己的字段解码、错误形状
 * (`ServerActionResult`)、速率限制与 Turnstile 状态枚举等独有关注点。
 */
export function useContactForm(): UseContactFormResult {
  const [turnstileStatus, setTurnstileStatus] =
    useState<TurnstileStatus>("loading");
  const { isRateLimited, setLastSubmissionTime } = useRateLimit();

  const kernel = useLeadFormSubmission<ServerActionResult<ContactFormResult>>({
    endpoint: "/api/contact",
    leadEventTag: "contact",
    buildBody: (formData, turnstileToken) =>
      createContactRequestBody(
        formData,
        turnstileToken,
        new Date().toISOString(),
      ),
    decode: async (response) => {
      const payload: unknown = await response.json();
      return deriveContactResultState(
        response.ok,
        payload,
        new Date().toISOString(),
      );
    },
    isSuccess: (result) => result.success === true,
    toNetworkError: () => ({
      success: false,
      errorCode: FORM_NETWORK_ERROR,
      timestamp: new Date().toISOString(),
    }),
    onSuccess: () => {
      setLastSubmissionTime(new Date());
    },
  });

  // The container drives success/clear through a single token setter, so map an
  // empty token to a reset and any real token to an acquisition.
  const setTurnstileToken = (token: string) => {
    if (token) {
      kernel.acquireTurnstileToken(token);
    } else {
      kernel.resetTurnstileToken();
    }
  };

  // Rate limiting stays a contact-only concern layered on the shared submit.
  const formAction = async (formData: FormData) => {
    if (isRateLimited) {
      return;
    }
    await kernel.submit(formData);
  };

  return {
    state: kernel.result,
    formAction,
    isPending: kernel.isSubmitting,
    submitStatus: kernel.status,
    turnstileToken: kernel.turnstileToken,
    setTurnstileToken,
    turnstileStatus,
    setTurnstileStatus,
    isRateLimited,
  };
}

interface ContactApiErrorResponse {
  success: false;
  errorCode?: string;
  details?: string[];
}

function getOptionalString(
  formData: FormData,
  key: string,
): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getRequiredString(formData: FormData, key: string): string {
  return getOptionalString(formData, key) ?? "";
}

function createContactRequestBody(
  formData: FormData,
  turnstileToken: string,
  submittedAt: string,
) {
  return {
    fullName: getRequiredString(formData, "fullName"),
    email: getRequiredString(formData, "email"),
    company: getRequiredString(formData, "company"),
    phone: getOptionalString(formData, "phone"),
    subject: getOptionalString(formData, "subject"),
    message: getRequiredString(formData, "message"),
    website: getOptionalString(formData, "website") ?? "",
    turnstileToken,
    submittedAt,
    ...pickAttributionFieldsFromFormData(formData),
  };
}

function isContactErrorResponse(
  payload: unknown,
): payload is ContactApiErrorResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    (payload as { success?: unknown }).success === false
  );
}

/**
 * Turn a contact API response into form state.
 *
 * The shared success shape (`ok` + `success` + `data.referenceId`) is read via
 * `readLeadReferenceId`. A non-ok status or a malformed body is treated as a
 * failure with a concrete error code, so the UI always shows an error instead
 * of silently returning to idle. A well-shaped failure keeps its own error code
 * and validation details.
 */
export function deriveContactResultState(
  ok: boolean,
  payload: unknown,
  timestamp: string,
): ServerActionResult<ContactFormResult> {
  const referenceId = readLeadReferenceId(ok, payload);
  if (referenceId !== null) {
    return {
      success: true,
      data: { referenceId },
      timestamp,
    };
  }

  const errorPayload: ContactApiErrorResponse = isContactErrorResponse(payload)
    ? payload
    : {
        success: false,
        errorCode: API_ERROR_CODES.CONTACT_PROCESSING_ERROR,
      };

  const errorState = createContactErrorState(errorPayload, timestamp);
  if (!errorState.errorCode) {
    errorState.errorCode = API_ERROR_CODES.CONTACT_PROCESSING_ERROR;
  }

  return errorState;
}

function createContactErrorState(
  payload: ContactApiErrorResponse,
  timestamp: string,
): ServerActionResult<ContactFormResult> {
  const errorState: ServerActionResult<ContactFormResult> = {
    success: false,
    errorCode: payload.errorCode,
    timestamp,
  };

  if (payload.details && payload.details.length > 0) {
    errorState.details = payload.details;
  }

  return errorState;
}
