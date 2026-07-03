import { useRef, useState, useTransition } from "react";
import { logger } from "@/lib/logger";
import { appendAttributionToFormData } from "@/lib/marketing/utm";
import { useRateLimit } from "@/components/forms/use-rate-limit";
import { type FormSubmissionStatus } from "@/lib/forms/form-submission-status";
import { type ServerActionResult } from "@/lib/actions/server-action-utils";

export interface ContactFormResult {
  referenceId?: string | null;
}

export type TurnstileStatus = "loading" | "verified" | "error" | "expired";

interface SubmitStatusInput {
  isPending: boolean;
  stateSuccess: boolean | undefined;
  stateError: string | undefined;
  stateErrorCode: string | undefined;
}

function computeSubmitStatus(input: SubmitStatusInput): FormSubmissionStatus {
  if (input.isPending) return "submitting";
  if (input.stateSuccess) return "success";
  if (input.stateError || input.stateErrorCode) return "error";
  return "idle";
}

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
 */
export function useContactForm(): UseContactFormResult {
  const [state, setState] =
    useState<ServerActionResult<ContactFormResult> | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [turnstileStatus, setTurnstileStatus] =
    useState<TurnstileStatus>("loading");
  const [isPendingTransition, startTransition] = useTransition();
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const isSubmittingRef = useRef(false);
  const isSubmitting = isSubmittingRequest || isPendingTransition;
  const { isRateLimited, setLastSubmissionTime } = useRateLimit();

  const submitStatus = computeSubmitStatus({
    isPending: isSubmitting,
    stateSuccess: state?.success,
    stateError: state?.error,
    stateErrorCode: state?.errorCode,
  });

  const enhancedFormAction = async (formData: FormData) => {
    if (!turnstileToken) {
      logger.warn("Form submission attempted without Turnstile token");
      return;
    }

    if (isSubmittingRef.current || isRateLimited) {
      return;
    }

    isSubmittingRef.current = true;
    formData.append("turnstileToken", turnstileToken);
    formData.append("submittedAt", new Date().toISOString());
    appendAttributionToFormData(formData);

    setIsSubmittingRequest(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createContactRequestBody(formData)),
      });
      const payload = (await response.json()) as ContactApiResponse;
      const nextState = createContactStateFromResponse(payload);

      if (nextState.success) {
        setLastSubmissionTime(new Date());
      }

      startTransition(() => {
        setState(nextState);
      });
    } catch {
      startTransition(() => {
        setState({
          success: false,
          errorCode: "FORM_NETWORK_ERROR",
          timestamp: new Date().toISOString(),
        });
      });
    } finally {
      isSubmittingRef.current = false;
      setIsSubmittingRequest(false);
    }
  };

  return {
    state,
    formAction: enhancedFormAction,
    isPending: isSubmitting,
    submitStatus,
    turnstileToken,
    setTurnstileToken,
    turnstileStatus,
    setTurnstileStatus,
    isRateLimited,
  };
}

interface ContactApiSuccessResponse {
  success: true;
  data: {
    referenceId: string;
  };
}

interface ContactApiErrorResponse {
  success: false;
  errorCode?: string;
  details?: string[];
}

type ContactApiResponse = ContactApiSuccessResponse | ContactApiErrorResponse;

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

function getBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "true" || value === "on" || value === "1";
}

function createContactRequestBody(formData: FormData) {
  return {
    fullName: getRequiredString(formData, "fullName"),
    email: getRequiredString(formData, "email"),
    company: getRequiredString(formData, "company"),
    phone: getOptionalString(formData, "phone"),
    subject: getOptionalString(formData, "subject"),
    message: getRequiredString(formData, "message"),
    acceptPrivacy: getBoolean(formData, "acceptPrivacy"),
    marketingConsent: getBoolean(formData, "marketingConsent"),
    website: getOptionalString(formData, "website") ?? "",
    turnstileToken: getRequiredString(formData, "turnstileToken"),
    submittedAt: getRequiredString(formData, "submittedAt"),
  };
}

function createContactStateFromResponse(
  payload: ContactApiResponse,
): ServerActionResult<ContactFormResult> {
  const timestamp = new Date().toISOString();

  if (payload.success) {
    return {
      success: true,
      data: {
        referenceId: payload.data.referenceId,
      },
      timestamp,
    };
  }

  return createContactErrorState(payload, timestamp);
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
