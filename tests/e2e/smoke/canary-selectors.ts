import deferred from "../../../messages/profiles/b2b-lead/en/deferred.json";

export interface CanarySelectors {
  submitLabel: string;
  successPrefix: string;
}

export function buildCanarySelectors(): CanarySelectors {
  const submitLabel = deferred.contact.form.submit;
  const successText = deferred.contact.form.success;
  if (!submitLabel || !successText) {
    throw new Error("canary selectors: message truth missing");
  }
  return { submitLabel, successPrefix: successText.slice(0, 40) };
}
