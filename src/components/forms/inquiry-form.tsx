"use client";

import { type FormEvent, useMemo, useSyncExternalStore } from "react";
import {
  InquiryBuyerInterestContext,
  InquiryFormFields,
} from "@/components/forms/inquiry-form-fields";
import {
  type InquiryFormCopy,
  type InquiryFormSource,
} from "@/components/forms/inquiry-form-copy";
import { InquiryFormStaticFallback } from "@/components/forms/inquiry-form-static-fallback";
import { InquiryFormStatus } from "@/components/forms/inquiry-form-status";
import {
  capBuyerInterest,
  capConfigPrefill,
  createInquiryPayload,
  getInquiryMessageMaxLength,
} from "@/components/forms/inquiry-payload";
import {
  decodeInquirySubmitState,
  type InquirySubmitState,
} from "@/components/forms/inquiry-response";
import { LazyTurnstile } from "@/components/forms/lazy-turnstile";
import { useLeadFormSubmission } from "@/lib/forms/use-lead-form-submission";

export type { InquiryFormSource } from "@/components/forms/inquiry-form-copy";
export type { InquiryFormCopy } from "@/components/forms/inquiry-form-copy";

export interface InquiryFormProps {
  readonly source: InquiryFormSource;
  readonly copy: InquiryFormCopy;
}

const unsubscribeHydration = () => undefined;
const subscribeHydration = () => unsubscribeHydration;
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

function readRequestQuoteUrlContext(): {
  buyerInterest?: string | undefined;
  configPrefill?: string | undefined;
} {
  const params = new URLSearchParams(window.location.search);
  const buyerInterest = capBuyerInterest(params.get("interest"));
  const configPrefill = capConfigPrefill(params.get("config"));

  return {
    ...(buyerInterest ? { buyerInterest } : {}),
    ...(configPrefill ? { configPrefill } : {}),
  };
}

function InquiryFormLive({
  source,
  copy,
}: {
  source: InquiryFormSource;
  copy: InquiryFormCopy;
}) {
  const urlContext = useMemo(
    () => (source === "request-quote" ? readRequestQuoteUrlContext() : {}),
    [source],
  );
  const { buyerInterest, configPrefill } = urlContext;

  const kernel = useLeadFormSubmission<InquirySubmitState>({
    endpoint: "/api/inquiry",
    leadEventTag: source === "contact" ? "contact" : "rfq",
    buildBody: (formData, turnstileToken) =>
      createInquiryPayload(formData, turnstileToken, buyerInterest),
    decode: decodeInquirySubmitState,
    isSuccess: (result) => result.status === "success",
    toNetworkError: () => ({ status: "error", errorKind: "server" }),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!kernel.turnstileToken) {
      kernel.fail({ status: "error", errorKind: "security" });
      return;
    }

    kernel.submit(new FormData(event.currentTarget)).catch(() => undefined);
  };

  const displayState: InquirySubmitState = kernel.isSubmitting
    ? { status: "submitting" }
    : (kernel.result ?? { status: "idle" });

  const ariaLabel =
    source === "contact" ? copy.contactAriaLabel : copy.requestQuoteAriaLabel;
  const initialMessage = source === "request-quote" ? configPrefill : undefined;

  return (
    <section className="surface-card p-6 md:p-8">
      <form
        aria-label={ariaLabel}
        className="space-y-6"
        data-analytics-event={
          source === "contact" ? "contact_submit" : "rfq_submit"
        }
        data-lead-path="api-inquiry"
        data-testid="inquiry-form"
        onSubmit={handleSubmit}
      >
        {buyerInterest ? (
          <InquiryBuyerInterestContext
            buyerInterest={buyerInterest}
            copy={copy}
          />
        ) : null}

        <InquiryFormFields
          copy={copy}
          messageMaxLength={getInquiryMessageMaxLength()}
          {...(initialMessage ? { initialMessage } : {})}
        />

        <LazyTurnstile
          action="product_inquiry"
          onError={kernel.resetTurnstileToken}
          onExpire={kernel.resetTurnstileToken}
          onSuccess={kernel.acquireTurnstileToken}
          onReadyRef={kernel.registerTurnstileReset}
        />

        <InquiryFormStatus
          copy={copy}
          displayState={displayState}
          isSubmitting={kernel.isSubmitting}
          turnstileReady={Boolean(kernel.turnstileToken)}
        />
      </form>
    </section>
  );
}

export function InquiryForm({ source, copy }: InquiryFormProps) {
  const isHydrated = useSyncExternalStore(
    subscribeHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );

  if (!isHydrated) {
    return <InquiryFormStaticFallback copy={copy} />;
  }

  return <InquiryFormLive copy={copy} source={source} />;
}
