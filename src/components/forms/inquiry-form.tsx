"use client";

import {
  type FormEvent,
  type ReactNode,
  useRef,
  useSyncExternalStore,
} from "react";
import {
  InquiryBuyerInterestContext,
  InquiryFormFields,
} from "@/components/forms/inquiry-form-fields";
import {
  type InquiryFormCopy,
  type InquiryFormSource,
} from "@/components/forms/inquiry-form-copy";
import { InquiryFormStatus } from "@/components/forms/inquiry-form-status";
import {
  createInquiryPayload,
  getInquiryMessageMaxLength,
} from "@/components/forms/inquiry-payload";
import {
  decodeInquirySubmitState,
  type InquirySubmitState,
} from "@/components/forms/inquiry-response";
import { LazyTurnstile } from "@/components/forms/lazy-turnstile";
import { useLeadFormSubmission } from "@/lib/forms/use-lead-form-submission";
import type { ValidatedInquiryContext } from "@/lib/lead-pipeline/inquiry-handoff";

export type { InquiryFormSource } from "@/components/forms/inquiry-form-copy";
export type { InquiryFormCopy } from "@/components/forms/inquiry-form-copy";

export interface InquiryFormProps {
  readonly source: InquiryFormSource;
  readonly copy: InquiryFormCopy;
  readonly fallback: ReactNode;
  readonly context: ValidatedInquiryContext;
}

const unsubscribeHydration = () => undefined;
const subscribeHydration = () => unsubscribeHydration;
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

function InquiryFormLive({
  source,
  copy,
  context,
}: {
  source: InquiryFormSource;
  copy: InquiryFormCopy;
  context: ValidatedInquiryContext;
}) {
  const visibleContext =
    context.kind === "catalog-context"
      ? context.displayLabel
      : context.buyerInterest;
  const { initialMessage } = context;
  const formRef = useRef<HTMLFormElement>(null);

  const kernel = useLeadFormSubmission<InquirySubmitState>({
    endpoint: "/api/inquiry",
    leadEventTag: source === "contact" ? "contact" : "rfq",
    buildBody: (formData, turnstileToken) =>
      createInquiryPayload(formData, turnstileToken, context),
    decode: decodeInquirySubmitState,
    isSuccess: (result) => result.status === "success",
    toNetworkError: () => ({ status: "error", errorKind: "server" }),
    onSuccess: () => {
      const form = formRef.current;
      if (!form) {
        return;
      }

      form.reset();
      for (const name of ["fullName", "email", "message"] as const) {
        const control = form.elements.namedItem(name);
        if (control instanceof HTMLInputElement) {
          control.value = "";
        } else if (control instanceof HTMLTextAreaElement) {
          control.value = "";
        }
      }
    },
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
  const fieldDetails =
    displayState.status === "error" && displayState.errorKind === "field"
      ? displayState.fieldDetails
      : undefined;

  return (
    <section className="surface-card p-6 md:p-8">
      <form
        ref={formRef}
        aria-label={ariaLabel}
        className="space-y-6"
        data-analytics-event={
          source === "contact" ? "contact_submit" : "rfq_submit"
        }
        data-lead-path="api-inquiry"
        data-testid="inquiry-form"
        onSubmit={handleSubmit}
      >
        {visibleContext ? (
          <InquiryBuyerInterestContext
            buyerInterest={visibleContext}
            copy={copy}
          />
        ) : null}

        <InquiryFormFields
          copy={copy}
          messageMaxLength={getInquiryMessageMaxLength()}
          {...(fieldDetails ? { fieldDetails } : {})}
          {...(initialMessage ? { initialMessage } : {})}
        />

        <LazyTurnstile
          labels={copy.turnstile}
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

export function InquiryForm({
  source,
  copy,
  fallback,
  context,
}: InquiryFormProps) {
  const isHydrated = useSyncExternalStore(
    subscribeHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );

  if (!isHydrated) {
    // The static card is ~160px; the live form is ~470-700px depending on
    // width. Without reserved space the swap pushes everything below it down
    // (measured CLS 0.203 on /request-quote). The bands track the live form's
    // measured height per breakpoint; tests/e2e/layout-stability.spec.ts fails
    // if they drift far enough to move the page.
    return (
      <div
        data-inquiry-form-reserve
        className="min-h-[660px] min-[390px]:min-h-[600px] sm:min-h-[560px] md:min-h-[480px]"
      >
        {/* Without JavaScript the swap never happens, so reserving space would
            leave a permanent gap under the card. */}
        <noscript>
          <style>{"[data-inquiry-form-reserve]{min-height:0}"}</style>
        </noscript>
        {fallback}
      </div>
    );
  }

  return <InquiryFormLive copy={copy} context={context} source={source} />;
}
