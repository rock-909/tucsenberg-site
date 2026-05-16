"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { BYTES_PER_MB } from "@/constants";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import { logger } from "@/lib/logger";

/**
 * Error codes the route returns BEFORE Cloudflare Turnstile is verified
 * (`/api/quote` runs body parse + Zod validation, then Turnstile). A failure
 * with one of these means the single-use token was NOT consumed server-side,
 * so it stays valid: the buyer can fix the rejected field and resubmit with
 * the same token. Any other failure (security/Turnstile errors, processing
 * errors, network errors, the post-Turnstile composed-lead re-validation, or
 * an unknown code) means the token is consumed or genuinely invalid and the
 * widget must re-issue a fresh one.
 */
const TOKEN_PRESERVING_ERROR_CODES: ReadonlySet<string> = new Set([
  API_ERROR_CODES.INQUIRY_VALIDATION_FAILED,
  API_ERROR_CODES.INVALID_JSON_BODY,
  API_ERROR_CODES.INVALID_REQUEST,
  API_ERROR_CODES.PAYLOAD_TOO_LARGE,
]);

/**
 * RFQ quote form state.
 *
 * Mirrors the contact form's fetch/error/success contract but for the rich
 * `/api/quote` (`type: "rfq"`) payload. File uploads are client-side only: the
 * endpoint accepts JSON, so a selected file's name + size ride in `notes`.
 */

export const RFQ_MATERIALS = ["epdm", "tpu", "not-sure"] as const;
export type RfqMaterial = (typeof RFQ_MATERIALS)[number];

const MAX_UPLOAD_BYTES = 10 * BYTES_PER_MB;
const ACCEPTED_UPLOAD_TYPES =
  "text/csv,application/pdf,image/jpeg,image/png,.csv,.pdf,.jpg,.jpeg,.png";

export interface QuoteFormValues {
  partNumbers: string;
  quantity: string;
  fullName: string;
  email: string;
  company: string;
  country: string;
  material: "" | RfqMaterial;
  shutdownDate: string;
  notes: string;
}

export interface QuoteContext {
  brand?: string;
  model?: string;
  product?: string;
}

export interface QuoteSubmitState {
  status: "idle" | "submitting" | "success" | "error";
  referenceId?: string;
  errorCode?: string;
}

interface QuoteApiSuccess {
  success: true;
  data: { referenceId: string };
}

interface QuoteApiError {
  success: false;
  errorCode?: string;
}

type QuoteApiResponse = QuoteApiSuccess | QuoteApiError;

function createInitialValues(
  prefill: Partial<QuoteFormValues>,
): QuoteFormValues {
  return {
    partNumbers: prefill.partNumbers ?? "",
    quantity: prefill.quantity ?? "",
    fullName: "",
    email: "",
    company: "",
    country: "",
    material: "",
    shutdownDate: "",
    notes: "",
  };
}

function buildNotes(notes: string, file: File | null): string | undefined {
  const trimmed = notes.trim();
  if (!file) {
    return trimmed.length > 0 ? trimmed : undefined;
  }

  const fileLine = `Attachment: ${file.name} (${Math.round(
    file.size / BYTES_PER_MB,
  )} MB, ${file.size} bytes)`;
  return trimmed.length > 0 ? `${trimmed}\n${fileLine}` : fileLine;
}

interface RequestBodyArgs {
  values: QuoteFormValues;
  file: File | null;
  turnstileToken: string;
  context: QuoteContext;
}

function buildRequestBody({
  values,
  file,
  turnstileToken,
  context,
}: RequestBodyArgs): Record<string, unknown> {
  const optional = (value: string) =>
    value.trim().length > 0 ? value.trim() : undefined;

  return {
    type: "rfq",
    turnstileToken,
    fullName: values.fullName.trim(),
    email: values.email.trim(),
    partNumbers: values.partNumbers.trim(),
    company: optional(values.company),
    country: optional(values.country),
    quantity: optional(values.quantity),
    material: values.material === "" ? undefined : values.material,
    shutdownDate: optional(values.shutdownDate),
    notes: buildNotes(values.notes, file),
    sourceBrand: context.brand ? context.brand.trim() : undefined,
    sourceModel: context.model ? context.model.trim() : undefined,
    sourceProduct: context.product ? context.product.trim() : undefined,
  };
}

function isAcceptableFile(file: File): boolean {
  return file.size <= MAX_UPLOAD_BYTES;
}

export interface UseQuoteFormResult {
  values: QuoteFormValues;
  setField: (field: keyof QuoteFormValues, value: string) => void;
  file: File | null;
  fileError: boolean;
  selectFile: (file: File | null) => void;
  turnstileToken: string;
  setTurnstileToken: (token: string) => void;
  /** Clear the token without remounting (widget lifecycle: expire/error/load). */
  clearTurnstileToken: () => void;
  /**
   * Remount key for the Turnstile widget. Bumped only when a consumed/invalid
   * token must be discarded so the widget unmounts and re-issues a fresh
   * single-use token; left stable for buyer-correctable validation errors so
   * the still-valid token (and the solved widget) survive the retry.
   */
  turnstileResetKey: number;
  submitState: QuoteSubmitState;
  canSubmit: boolean;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  acceptedUploadTypes: string;
}

const EMPTY_QUOTE_CONTEXT: QuoteContext = {};

export function useQuoteForm(
  prefill: Partial<QuoteFormValues>,
  context: QuoteContext = EMPTY_QUOTE_CONTEXT,
): UseQuoteFormResult {
  const [values, setValues] = useState<QuoteFormValues>(() =>
    createInitialValues(prefill),
  );
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [submitState, setSubmitState] = useState<QuoteSubmitState>({
    status: "idle",
  });
  const inFlightRef = useRef(false);

  /**
   * Discard the current token AND force the Turnstile widget to remount so it
   * issues a fresh single-use token. Used for every failure class where the
   * existing token can no longer produce a successful submit.
   */
  const resetTurnstile = useCallback(() => {
    setTurnstileToken("");
    setTurnstileResetKey((key) => key + 1);
  }, []);

  // Widget-driven token loss (expire/error/load): clear the token so submit
  // re-gates, but do NOT remount — the live widget owns its own re-challenge
  // and bumping the key mid-challenge would fight it.
  const clearTurnstileToken = useCallback(() => {
    setTurnstileToken("");
  }, []);

  const setField = useCallback(
    (field: keyof QuoteFormValues, value: string) => {
      setValues((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const selectFile = useCallback((next: File | null) => {
    if (next && !isAcceptableFile(next)) {
      setFile(null);
      setFileError(true);
      return;
    }
    setFileError(false);
    setFile(next);
  }, []);

  const canSubmit =
    submitState.status !== "submitting" &&
    turnstileToken.length > 0 &&
    values.partNumbers.trim().length > 0 &&
    values.fullName.trim().length > 0 &&
    values.email.trim().length > 0;

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!turnstileToken || inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;
      setSubmitState({ status: "submitting" });

      try {
        const response = await fetch("/api/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            buildRequestBody({ values, file, turnstileToken, context }),
          ),
        });
        const payload = (await response.json()) as QuoteApiResponse;

        if (payload.success) {
          setSubmitState({
            status: "success",
            referenceId: payload.data.referenceId,
          });
          return;
        }

        setSubmitState({
          status: "error",
          ...(payload.errorCode ? { errorCode: payload.errorCode } : {}),
        });
        // The route validates the body (size + Zod) BEFORE verifying
        // Turnstile. A pre-Turnstile rejection leaves the single-use token
        // unconsumed, so keep it (and the solved widget) and let the buyer fix
        // the field and resubmit. Any other failure means the token is
        // consumed/invalid — remount the widget for a fresh token instead of
        // stranding the buyer behind a disabled submit on the main RFQ path.
        if (
          !payload.errorCode ||
          !TOKEN_PRESERVING_ERROR_CODES.has(payload.errorCode)
        ) {
          resetTurnstile();
        }
      } catch (error) {
        logger.warn("RFQ quote submission failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
        setSubmitState({ status: "error", errorCode: "FORM_NETWORK_ERROR" });
        // Request never reached server validation deterministically; treat the
        // token as spent and re-issue so a retry is not blocked.
        resetTurnstile();
      } finally {
        inFlightRef.current = false;
      }
    },
    [context, file, resetTurnstile, turnstileToken, values],
  );

  return useMemo(
    () => ({
      values,
      setField,
      file,
      fileError,
      selectFile,
      turnstileToken,
      setTurnstileToken,
      clearTurnstileToken,
      turnstileResetKey,
      submitState,
      canSubmit,
      handleSubmit,
      acceptedUploadTypes: ACCEPTED_UPLOAD_TYPES,
    }),
    [
      values,
      setField,
      file,
      fileError,
      selectFile,
      turnstileToken,
      clearTurnstileToken,
      turnstileResetKey,
      submitState,
      canSubmit,
      handleSubmit,
    ],
  );
}
