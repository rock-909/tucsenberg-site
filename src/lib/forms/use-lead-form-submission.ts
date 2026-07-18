import { useRef, useState } from "react";
import { logger } from "@/lib/logger";
import {
  trackGenerateLead,
  type LeadEventMethod,
} from "@/lib/marketing/lead-event";
import { appendAttributionToFormData } from "@/lib/marketing/utm";
import { type FormSubmissionStatus } from "@/lib/forms/form-submission-status";

/**
 * Shared behavior kernel for buyer inquiry forms (Contact and Request Quote).
 *
 * It owns only the lifecycle both forms genuinely duplicate:
 * - submit lock (a ref-based in-flight guard against double submit);
 * - Turnstile token lifecycle (acquire on success; clear token and reset the
 *   widget after every submit settlement — success or failure — and on
 *   error/expire callbacks from the widget);
 * - attribution wiring (append UTM/click-id fields before the body is built);
 * - fetch + decode dispatch to the lead API;
 * - the idle -> submitting -> success/error state machine, plus the
 *   `generate_lead` analytics event on success.
 *
 * It deliberately does NOT own each form's fields, copy, wire payload, error
 * shape, or progressive-enhancement wiring. Those stay per-form and compose on
 * top of this hook. `TResult` is the form-defined decoded result (for example
 * `InquirySubmitState`), so this is not a config-driven universal form
 * component.
 */
export interface LeadSubmissionConfig<TResult> {
  /** Lead API endpoint. Production forms post to `/api/inquiry`. */
  readonly endpoint: string;
  /** `generate_lead` analytics method fired on success. */
  readonly leadEventTag: LeadEventMethod;
  /** Build the JSON request body from the submitted form + verified token. */
  readonly buildBody: (formData: FormData, turnstileToken: string) => unknown;
  /** Decode the API response into the form's own result shape. */
  readonly decode: (response: Response) => Promise<TResult>;
  /** Whether a decoded result counts as a successful submission. */
  readonly isSuccess: (result: TResult) => boolean;
  /** Result to store when the request never reaches a decodable response. */
  readonly toNetworkError: () => TResult;
  /** Optional success side effect, e.g. recording the rate-limit timestamp. */
  readonly onSuccess?: () => void;
}

export interface LeadFormSubmission<TResult> {
  readonly status: FormSubmissionStatus;
  readonly result: TResult | null;
  readonly isSubmitting: boolean;
  readonly turnstileToken: string;
  readonly acquireTurnstileToken: (token: string) => void;
  readonly resetTurnstileToken: () => void;
  /**
   * Register the live widget reset callback. Returns an unregister function
   * so remounts do not leave a stale widget ref in the kernel.
   */
  readonly registerTurnstileReset: (reset: () => void) => () => void;
  readonly submit: (formData: FormData) => Promise<void>;
  /** Seed a client-side error into the state machine without submitting. */
  readonly fail: (result: TResult) => void;
}

interface DecodedSubmission<TResult> {
  readonly result: TResult;
  readonly success: boolean;
}

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

/**
 * Platform adapter: post the built body and decode the response. A request that
 * never produces a decodable response degrades to the form's network-error
 * result rather than throwing.
 */
async function postLead<TResult>(
  config: LeadSubmissionConfig<TResult>,
  formData: FormData,
  turnstileToken: string,
): Promise<DecodedSubmission<TResult>> {
  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(config.buildBody(formData, turnstileToken)),
    });
    const decoded = await config.decode(response);
    return { result: decoded, success: config.isSuccess(decoded) };
  } catch {
    return { result: config.toNetworkError(), success: false };
  }
}

export function useLeadFormSubmission<TResult>(
  config: LeadSubmissionConfig<TResult>,
): LeadFormSubmission<TResult> {
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<FormSubmissionStatus>("idle");
  const [result, setResult] = useState<TResult | null>(null);
  const isSubmittingRef = useRef(false);
  const turnstileResetRef = useRef<(() => void) | null>(null);

  const registerTurnstileReset = (reset: () => void): (() => void) => {
    turnstileResetRef.current = reset;
    return () => {
      if (turnstileResetRef.current === reset) {
        turnstileResetRef.current = null;
      }
    };
  };

  const clearTurnstileAfterSettlement = () => {
    setTurnstileToken("");
    turnstileResetRef.current?.();
  };

  const submit = async (formData: FormData): Promise<void> => {
    // Defensive: the submit button is disabled without a token, but a form can
    // still be submitted via Enter. Never post without verification.
    if (!turnstileToken) {
      logger.warn("Lead form submission attempted without Turnstile token", {
        endpoint: config.endpoint,
      });
      return;
    }

    // In-flight guard: ignore duplicate submits while a request is running.
    if (isSubmittingRef.current) {
      return;
    }
    isSubmittingRef.current = true;
    setStatus("submitting");
    appendAttributionToFormData(formData);

    try {
      const { result: decoded, success } = await postLead(
        config,
        formData,
        turnstileToken,
      );
      setResult(decoded);
      setStatus(success ? "success" : "error");
      if (success) {
        trackGenerateLead(config.leadEventTag);
        config.onSuccess?.();
      }
    } finally {
      isSubmittingRef.current = false;
      clearTurnstileAfterSettlement();
    }
  };

  return {
    status,
    result,
    isSubmitting: status === "submitting",
    turnstileToken,
    acquireTurnstileToken: (token: string) => setTurnstileToken(token),
    resetTurnstileToken: () => setTurnstileToken(""),
    registerTurnstileReset,
    submit,
    fail: (nextResult: TResult) => {
      setResult(nextResult);
      setStatus("error");
    },
  };
}
