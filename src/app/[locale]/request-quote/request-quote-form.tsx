"use client";

import { type FormEvent, useEffect } from "react";
import { useLeadFormSubmission } from "@/lib/forms/use-lead-form-submission";
import type { RequestQuoteFormCopy } from "@/app/[locale]/request-quote/request-quote-form-copy";
import { createRequestQuotePayload } from "@/app/[locale]/request-quote/request-quote-payload";
import { parseInquiryResponse } from "@/app/[locale]/request-quote/request-quote-response";
import {
  RequestQuoteContactFields,
  RequestQuoteMessageField,
} from "@/app/[locale]/request-quote/request-quote-form-fields";
import {
  RequestQuoteSubmitControls,
  type RequestQuoteSubmitState,
} from "@/app/[locale]/request-quote/request-quote-submit-controls";

// Cap for the `?config=` prefill coming from product estimators; the message
// field itself allows more, but a URL-borne prefill should stay short.
const CONFIG_PREFILL_MAX_LENGTH = 500;

async function decodeInquiryState(
  response: Response,
  copy: RequestQuoteFormCopy,
): Promise<RequestQuoteSubmitState> {
  const parsed = parseInquiryResponse(response.ok, await response.text());
  if ("success" in parsed) {
    return { status: "success", referenceId: parsed.referenceId };
  }
  return { status: "error", message: copy.genericError };
}

export function RequestQuoteForm({ copy }: { copy: RequestQuoteFormCopy }) {
  const kernel = useLeadFormSubmission<RequestQuoteSubmitState>({
    endpoint: "/api/inquiry",
    leadEventTag: "rfq",
    buildBody: (formData, turnstileToken) => {
      // Any product-line hint the buyer arrived with is carried as free text,
      // never as product attribution (see behavior contract BC-013).
      const interest = new URLSearchParams(window.location.search).get(
        "interest",
      );
      if (interest) {
        formData.set("interest", interest);
      }
      return createRequestQuotePayload(formData, turnstileToken, copy.payload);
    },
    decode: (response) => decodeInquiryState(response, copy),
    isSuccess: (result) => result.status === "success",
    toNetworkError: () => ({ status: "error", message: copy.networkError }),
  });

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // The submit button is disabled without a token, but Enter can still submit
    // the form; surface the pending-verification message instead of posting.
    if (!kernel.turnstileToken) {
      kernel.fail({ status: "error", message: copy.turnstilePending });
      return;
    }

    kernel.submit(new FormData(event.currentTarget)).catch(() => undefined);
  };

  const displayState: RequestQuoteSubmitState = kernel.isSubmitting
    ? { status: "submitting" }
    : (kernel.result ?? { status: "idle" });

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
          isSubmitting={kernel.isSubmitting}
          onTurnstileError={kernel.resetTurnstileToken}
          onTurnstileSuccess={kernel.acquireTurnstileToken}
          onTurnstileReadyRef={kernel.registerTurnstileReset}
          state={displayState}
          turnstileToken={kernel.turnstileToken}
        />
      </form>
    </section>
  );
}
