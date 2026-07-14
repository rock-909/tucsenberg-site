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
  const translateForm = (key: string) => t(key as Parameters<typeof t>[0]);
  const translateApi = (key: string) => tApi(key as Parameters<typeof tApi>[0]);
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
    turnstileStatus,
    setTurnstileStatus,
    registerTurnstileReset,
    isRateLimited,
  } = useContactForm();

  const handleTurnstileSuccess = (token: string) => {
    setTurnstileToken(token);
    setTurnstileStatus("verified");
  };

  const handleTurnstileError = () => {
    setTurnstileToken("");
    setTurnstileStatus("error");
  };

  const handleTurnstileExpire = () => {
    setTurnstileToken("");
    setTurnstileStatus("expired");
  };

  const handleTurnstileLoad = () => {
    setTurnstileToken("");
    setTurnstileStatus("loading");
  };

  return (
    <ContactFormContainerView
      state={state}
      formAction={formAction}
      isPending={isPending}
      submitStatus={submitStatus}
      turnstileToken={turnstileToken}
      turnstileStatus={turnstileStatus}
      isRateLimited={isRateLimited}
      translateForm={translateForm}
      translateApi={translateApi}
      turnstileLabels={{
        unavailable: tAccessibility("securityVerificationUnavailable"),
        loadFailed: tAccessibility("turnstileLoadFailed"),
        devBypass: tAccessibility("turnstileDevBypass"),
        testMode: tAccessibility("turnstileTestMode"),
      }}
      onTurnstileSuccess={handleTurnstileSuccess}
      onTurnstileError={handleTurnstileError}
      onTurnstileExpire={handleTurnstileExpire}
      onTurnstileLoad={handleTurnstileLoad}
      onTurnstileReadyRef={registerTurnstileReset}
      errorContainerRef={handleErrorDisplayRef}
    />
  );
}
