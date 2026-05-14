"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { API_ERROR_NAMESPACE } from "@/lib/api/translate-error-code";
import { useContactForm } from "@/components/forms/use-contact-form";
import { ContactFormContainerView } from "@/components/forms/contact-form-container-view";

/**
 * Main contact form container component
 */
export function ContactFormContainer() {
  const t = useTranslations("contact.form");
  const tApi = useTranslations(API_ERROR_NAMESPACE);
  const tAccessibility = useTranslations("accessibility");
  const errorSummaryRef = useRef<HTMLDivElement | null>(null);
  const handleErrorDisplayRef = (node: HTMLDivElement | null) => {
    errorSummaryRef.current = node;

    if (node) {
      node.focus();
    }
  };
  const {
    state,
    formAction,
    isPending,
    submitStatus,
    turnstileToken,
    setTurnstileToken,
    isRateLimited,
  } = useContactForm();

  return (
    <ContactFormContainerView
      state={state}
      formAction={formAction}
      isPending={isPending}
      submitStatus={submitStatus}
      turnstileToken={turnstileToken}
      isRateLimited={isRateLimited}
      translateForm={t}
      translateApi={tApi}
      turnstileLabels={{
        unavailable: tAccessibility("securityVerificationUnavailable"),
        loadFailed: tAccessibility("turnstileLoadFailed"),
        devBypass: tAccessibility("turnstileDevBypass"),
        testMode: tAccessibility("turnstileTestMode"),
      }}
      onTurnstileSuccess={setTurnstileToken}
      onTurnstileError={() => setTurnstileToken("")}
      onTurnstileExpire={() => setTurnstileToken("")}
      onTurnstileLoad={() => setTurnstileToken("")}
      errorContainerRef={handleErrorDisplayRef}
    />
  );
}
