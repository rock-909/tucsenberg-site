"use client";

import { type FormEvent, useState } from "react";
import { trackGenerateLead } from "@/lib/marketing/lead-event";
import { appendAttributionToFormData } from "@/lib/marketing/utm";
import type { RequestQuoteFormCopy } from "@/app/[locale]/request-quote/request-quote-form-copy";
import { createRequestQuotePayload } from "@/app/[locale]/request-quote/request-quote-payload";
import {
  RequestQuoteContactFields,
  RequestQuoteProjectFields,
  RequestQuoteTradeMarkerField,
} from "@/app/[locale]/request-quote/request-quote-form-fields";
import {
  RequestQuoteSubmitControls,
  type RequestQuoteSubmitState,
} from "@/app/[locale]/request-quote/request-quote-submit-controls";

interface InquiryApiSuccessResponse {
  success: true;
  data: {
    referenceId: string;
  };
}

interface InquiryApiErrorResponse {
  success: false;
  errorCode?: string;
  details?: string[];
}

type InquiryApiResponse = InquiryApiSuccessResponse | InquiryApiErrorResponse;

export function RequestQuoteForm({ copy }: { copy: RequestQuoteFormCopy }) {
  const [turnstileToken, setTurnstileToken] = useState("");
  const [state, setState] = useState<RequestQuoteSubmitState>({
    status: "idle",
  });
  const isSubmitting = state.status === "submitting";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!turnstileToken) {
      setState({
        status: "error",
        message: copy.turnstilePending,
      });
      return;
    }

    const formData = new FormData(event.currentTarget);
    appendAttributionToFormData(formData);
    setState({ status: "submitting" });

    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          createRequestQuotePayload(formData, turnstileToken, copy.payload),
        ),
      });
      const payload = (await response.json()) as InquiryApiResponse;

      if (response.ok && payload.success) {
        setState({
          status: "success",
          referenceId: payload.data.referenceId,
        });
        trackGenerateLead("rfq");
        return;
      }

      setState({
        status: "error",
        message: copy.genericError,
      });
    } catch {
      setState({
        status: "error",
        message: copy.networkError,
      });
    }
  };

  return (
    <section className="surface-card p-6 md:p-8">
      <h2 className="mb-6 text-2xl font-semibold">{copy.title}</h2>
      <form
        aria-label={copy.ariaLabel}
        className="space-y-6"
        data-analytics-event="rfq_submit"
        data-lead-path="api-inquiry"
        onSubmit={handleSubmit}
      >
        <RequestQuoteProjectFields copy={copy} />
        <RequestQuoteContactFields copy={copy} />
        <RequestQuoteTradeMarkerField copy={copy} />
        <RequestQuoteSubmitControls
          copy={copy}
          isSubmitting={isSubmitting}
          onTurnstileError={() => {
            setTurnstileToken("");
          }}
          onTurnstileSuccess={setTurnstileToken}
          state={state}
          turnstileToken={turnstileToken}
        />
      </form>
    </section>
  );
}
