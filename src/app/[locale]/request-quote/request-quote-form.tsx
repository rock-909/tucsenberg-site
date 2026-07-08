"use client";

import { type FormEvent, useEffect, useState } from "react";
import { trackGenerateLead } from "@/lib/marketing/lead-event";
import { appendAttributionToFormData } from "@/lib/marketing/utm";
import type { RequestQuoteFormCopy } from "@/app/[locale]/request-quote/request-quote-form-copy";
import { createRequestQuotePayload } from "@/app/[locale]/request-quote/request-quote-payload";
import {
  RequestQuoteContactFields,
  RequestQuoteMessageField,
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

// Cap for the `?config=` prefill coming from product estimators; the message
// field itself allows more, but a URL-borne prefill should stay short.
const CONFIG_PREFILL_MAX_LENGTH = 500;

export function RequestQuoteForm({ copy }: { copy: RequestQuoteFormCopy }) {
  const [turnstileToken, setTurnstileToken] = useState("");
  const [state, setState] = useState<RequestQuoteSubmitState>({
    status: "idle",
  });
  const isSubmitting = state.status === "submitting";

  // Product estimators (e.g. the boxwall unit calculator) hand their result
  // over via `?config=`; surface it in the message field so the buyer sees
  // and can edit what they're sending.
  useEffect(() => {
    const config = new URLSearchParams(window.location.search).get("config");
    if (!config) return;
    const field = document.getElementById("rfq-message");
    if (field instanceof HTMLTextAreaElement && field.value === "") {
      field.value = config.slice(0, CONFIG_PREFILL_MAX_LENGTH);
    }
  }, []);

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
    const interest = new URLSearchParams(window.location.search).get(
      "interest",
    );
    if (interest) {
      formData.set("interest", interest);
    }
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
        <RequestQuoteContactFields copy={copy} />
        <RequestQuoteMessageField copy={copy} />
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
