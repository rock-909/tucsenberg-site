"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { BYTES_PER_MB } from "@/constants";
import { logger } from "@/lib/logger";

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
  const [submitState, setSubmitState] = useState<QuoteSubmitState>({
    status: "idle",
  });
  const inFlightRef = useRef(false);

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
        setTurnstileToken("");
      } catch (error) {
        logger.warn("RFQ quote submission failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
        setSubmitState({ status: "error", errorCode: "FORM_NETWORK_ERROR" });
        setTurnstileToken("");
      } finally {
        inFlightRef.current = false;
      }
    },
    [context, file, turnstileToken, values],
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
      submitState,
      canSubmit,
      handleSubmit,
    ],
  );
}
