import b2bLeadMessages from "../../../messages/profiles/b2b-lead/en/messages.json";

export interface CanarySelectors {
  submitLabel: string;
  successPrefix: string;
}

export function buildCanarySelectors(): CanarySelectors {
  const submitLabel = b2bLeadMessages.contact.form.submit;
  const successText = b2bLeadMessages.contact.form.submitSuccess;
  if (!submitLabel || !successText) {
    throw new Error("canary selectors: message truth missing");
  }
  return { submitLabel, successPrefix: successText.slice(0, 40) };
}
