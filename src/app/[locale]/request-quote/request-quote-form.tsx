"use client";

import { type FormEvent, useState } from "react";
import { pickAttributionFieldsFromFormData } from "@/lib/marketing/attribution-fields";
import { trackGenerateLead } from "@/lib/marketing/lead-event";
import { appendAttributionToFormData } from "@/lib/marketing/utm";
import { LazyTurnstile } from "@/components/forms/lazy-turnstile";

export const RFQ_SUCCESS_COPY =
  "Received. Standard items: quote within 12 hours. Custom: within 48. You'll hear from a person, not a sequence.";

const RFQ_CONTROL_CLASS =
  "mt-2 min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-[var(--shadow-xs)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const RFQ_FIELD_CLASS = "min-w-0";
const RFQ_LABEL_CLASS = "text-sm font-medium text-foreground";
const RFQ_HINT_CLASS = "mt-2 text-xs leading-5 text-muted-foreground";
const RFQ_STATUS_CLASS =
  "rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground";
const RFQ_ERROR_CLASS =
  "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive";

interface RfqOption {
  value: string;
  label: string;
}

interface RfqSubmitState {
  status: "idle" | "submitting" | "success" | "error";
  message?: string;
  referenceId?: string;
}

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

const PROTECTION_OPTIONS: readonly RfqOption[] = [
  { value: "door", label: "Door" },
  { value: "garage", label: "Garage" },
  { value: "driveway", label: "Driveway" },
  { value: "loading-dock", label: "Loading dock" },
  { value: "perimeter", label: "Perimeter" },
  { value: "stock-resale-order", label: "Stock / resale order" },
  { value: "other", label: "Other" },
];

const MOUNTING_SURFACE_OPTIONS: readonly RfqOption[] = [
  { value: "concrete", label: "Concrete" },
  { value: "masonry", label: "Masonry" },
  { value: "steel", label: "Steel" },
  { value: "timber", label: "Timber" },
  { value: "ground-soil", label: "Ground / soil" },
  { value: "other", label: "Other" },
];

const MATERIAL_OPTIONS: readonly RfqOption[] = [
  { value: "advise-me", label: "Advise me" },
  { value: "abs-flood-barriers", label: "ABS flood barriers" },
  { value: "aluminum-flood-gates", label: "Aluminum flood gates" },
  { value: "absorbent-flood-bags", label: "Absorbent flood bags" },
  { value: "flood-tube-dams", label: "Flood tube dams" },
  { value: "frp-flood-barriers", label: "FRP flood barriers" },
];

const QUANTITY_OPTIONS: readonly RfqOption[] = [
  { value: "sample-carton", label: "Sample carton" },
  { value: "cartons", label: "Cartons" },
  { value: "pallet", label: "Pallet" },
  { value: "lcl", label: "LCL" },
  { value: "container", label: "Container" },
  { value: "project-schedule", label: "Project schedule" },
];

const TIMELINE_OPTIONS: readonly RfqOption[] = [
  { value: "urgent", label: "Urgent" },
  { value: "this-season", label: "This season" },
  { value: "planning", label: "Planning" },
];

function getOptionalString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionLabel(
  options: readonly RfqOption[],
  value: string,
  fallback = "Not specified",
): string {
  return options.find((option) => option.value === value)?.label ?? fallback;
}

function createRequirementLine(label: string, value: string): string | null {
  return value ? `${label}: ${value}` : null;
}

function createRequirements(formData: FormData): string {
  const protection = getOptionLabel(
    PROTECTION_OPTIONS,
    getOptionalString(formData, "protection"),
  );
  const mounting = getOptionLabel(
    MOUNTING_SURFACE_OPTIONS,
    getOptionalString(formData, "mounting"),
  );
  const material = getOptionLabel(
    MATERIAL_OPTIONS,
    getOptionalString(formData, "material"),
  );
  const quantity = getOptionLabel(
    QUANTITY_OPTIONS,
    getOptionalString(formData, "quantity"),
  );
  const timeline = getOptionLabel(
    TIMELINE_OPTIONS,
    getOptionalString(formData, "timeline"),
  );
  const tradeEnquiry = formData.get("tradeEnquiry") === "on" ? "Yes" : "No";

  return [
    "RFQ source: /request-quote",
    `What are you protecting: ${protection}`,
    createRequirementLine(
      "Opening width x height / run length",
      getOptionalString(formData, "dimensions"),
    ),
    `Mounting surface / ground type: ${mounting}`,
    `Material preference: ${material}`,
    `Quantity: ${quantity}`,
    createRequirementLine(
      "Market & delivery port",
      getOptionalString(formData, "delivery"),
    ),
    `Timeline: ${timeline}`,
    createRequirementLine(
      "Photos / drawings links",
      getOptionalString(formData, "assetLinks"),
    ),
    createRequirementLine("WhatsApp", getOptionalString(formData, "whatsApp")),
    `Wholesale / OEM / private label: ${tradeEnquiry}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function createInquiryPayload(formData: FormData, turnstileToken: string) {
  const materialValue = getOptionalString(formData, "material") || "advise-me";
  const materialLabel = getOptionLabel(MATERIAL_OPTIONS, materialValue);
  const quantityLabel = getOptionLabel(
    QUANTITY_OPTIONS,
    getOptionalString(formData, "quantity"),
  );
  const company = getOptionalString(formData, "company");

  return {
    fullName: getOptionalString(formData, "fullName"),
    email: getOptionalString(formData, "email"),
    ...(company ? { company } : {}),
    productSlug: materialValue,
    productName: `RFQ: ${materialLabel}`,
    quantity: quantityLabel,
    requirements: createRequirements(formData),
    marketingConsent: false,
    turnstileToken,
    ...pickAttributionFieldsFromFormData(formData),
  };
}

function RfqSelectField({
  id,
  label,
  name,
  options,
  defaultValue,
  required,
}: {
  id: string;
  label: string;
  name: string;
  options: readonly RfqOption[];
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div className={RFQ_FIELD_CLASS}>
      <label className={RFQ_LABEL_CLASS} htmlFor={id}>
        {label}
      </label>
      <select
        className={RFQ_CONTROL_CLASS}
        defaultValue={defaultValue ?? ""}
        id={id}
        name={name}
        required={required}
      >
        <option value="">Select one</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RfqTextField({
  id,
  label,
  name,
  autoComplete,
  inputMode,
  type = "text",
  required,
}: {
  id: string;
  label: string;
  name: string;
  autoComplete?: string;
  inputMode?: "email" | "tel";
  type?: "email" | "tel" | "text";
  required?: boolean;
}) {
  return (
    <div className={RFQ_FIELD_CLASS}>
      <label className={RFQ_LABEL_CLASS} htmlFor={id}>
        {label}
      </label>
      <input
        autoComplete={autoComplete}
        className={RFQ_CONTROL_CLASS}
        id={id}
        inputMode={inputMode}
        name={name}
        required={required}
        type={type}
      />
    </div>
  );
}

function RfqAssetLinksField() {
  const hintId = "rfq-assets-hint";

  return (
    <div className={RFQ_FIELD_CLASS}>
      <label className={RFQ_LABEL_CLASS} htmlFor="rfq-assets">
        Photos / drawings links
      </label>
      <input
        aria-describedby={hintId}
        className={RFQ_CONTROL_CLASS}
        id="rfq-assets"
        name="assetLinks"
        type="text"
      />
      <p className={RFQ_HINT_CLASS} id={hintId}>
        Optional. Paste Drive, Dropbox, OneDrive or PDF links here; do not
        upload files on this page.
      </p>
    </div>
  );
}

function RfqTradeMarkerField() {
  return (
    <div className="border-border bg-muted/30 rounded-2xl border p-4">
      <div className="flex min-h-11 items-start gap-3">
        <input
          className="border-input bg-background mt-0.5 size-6 shrink-0 rounded border"
          id="rfq-trade-enquiry"
          name="tradeEnquiry"
          type="checkbox"
        />
        <label
          className="text-foreground min-w-0 flex-1 text-sm leading-6 font-medium"
          htmlFor="rfq-trade-enquiry"
        >
          This is a wholesale / OEM / private label enquiry
        </label>
      </div>
    </div>
  );
}

function RfqStatusMessage({ state }: { state: RfqSubmitState }) {
  if (state.status === "idle") {
    return null;
  }

  if (state.status === "success") {
    return (
      <output aria-live="polite" className={RFQ_STATUS_CLASS}>
        {RFQ_SUCCESS_COPY} Reference: {state.referenceId}
      </output>
    );
  }

  if (state.status === "error") {
    return (
      <output aria-live="assertive" className={RFQ_ERROR_CLASS}>
        {state.message ?? "We could not send your RFQ. Please try again."}
      </output>
    );
  }

  return (
    <output aria-live="polite" className={RFQ_STATUS_CLASS}>
      Sending RFQ...
    </output>
  );
}

function RequestQuoteProjectFields() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <RfqSelectField
        id="rfq-protection"
        label="What are you protecting?"
        name="protection"
        options={PROTECTION_OPTIONS}
      />
      <RfqTextField
        id="rfq-dimensions"
        label="Opening width × height / run length"
        name="dimensions"
      />
      <RfqSelectField
        id="rfq-mounting"
        label="Mounting surface / ground type"
        name="mounting"
        options={MOUNTING_SURFACE_OPTIONS}
      />
      <RfqSelectField
        defaultValue="advise-me"
        id="rfq-material"
        label="Material preference"
        name="material"
        options={MATERIAL_OPTIONS}
        required
      />
      <RfqSelectField
        id="rfq-quantity"
        label="Quantity"
        name="quantity"
        options={QUANTITY_OPTIONS}
        required
      />
      <RfqTextField
        id="rfq-delivery"
        label="Market & delivery port"
        name="delivery"
      />
      <RfqSelectField
        id="rfq-timeline"
        label="Timeline"
        name="timeline"
        options={TIMELINE_OPTIONS}
      />
      <RfqAssetLinksField />
    </div>
  );
}

function RequestQuoteContactFields() {
  return (
    <div className="border-border grid gap-4 border-t pt-6 md:grid-cols-2">
      <RfqTextField
        autoComplete="name"
        id="rfq-name"
        label="Name"
        name="fullName"
        required
      />
      <RfqTextField
        autoComplete="email"
        id="rfq-email"
        inputMode="email"
        label="Email"
        name="email"
        required
        type="email"
      />
      <RfqTextField
        autoComplete="organization"
        id="rfq-company"
        label="Company"
        name="company"
      />
      <RfqTextField
        autoComplete="tel"
        id="rfq-whatsapp"
        inputMode="tel"
        label="WhatsApp"
        name="whatsApp"
        type="tel"
      />
    </div>
  );
}

interface RequestQuoteSubmitControlsProps {
  isSubmitting: boolean;
  state: RfqSubmitState;
  turnstileToken: string;
  onTurnstileError: () => void;
  onTurnstileSuccess: (token: string) => void;
}

function RequestQuoteSubmitControls({
  isSubmitting,
  state,
  turnstileToken,
  onTurnstileError,
  onTurnstileSuccess,
}: RequestQuoteSubmitControlsProps) {
  return (
    <>
      <LazyTurnstile
        action="product_inquiry"
        onError={onTurnstileError}
        onExpire={onTurnstileError}
        onSuccess={onTurnstileSuccess}
      />

      <RfqStatusMessage state={state} />

      <button
        className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[var(--button-primary-bg)] px-5 py-2.5 text-sm font-medium text-[var(--button-primary-fg)] shadow-[var(--shadow-xs)] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting || !turnstileToken}
        type="submit"
      >
        {isSubmitting ? "Sending RFQ..." : "Send RFQ"}
      </button>
    </>
  );
}

export function RequestQuoteForm() {
  const [turnstileToken, setTurnstileToken] = useState("");
  const [state, setState] = useState<RfqSubmitState>({ status: "idle" });
  const isSubmitting = state.status === "submitting";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!turnstileToken) {
      setState({
        status: "error",
        message: "Security verification is still loading. Please try again.",
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
        body: JSON.stringify(createInquiryPayload(formData, turnstileToken)),
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
        message: "We could not send your RFQ. Please review the fields.",
      });
    } catch {
      setState({
        status: "error",
        message:
          "Network error. Please try again or email sales@tucsenberg.com.",
      });
    }
  };

  return (
    <section className="surface-card p-6 md:p-8">
      <h2 className="mb-6 text-2xl font-semibold">Request a quote</h2>
      <form
        aria-label="Request a quote"
        className="space-y-6"
        data-analytics-event="rfq_submit"
        data-lead-path="api-inquiry"
        onSubmit={handleSubmit}
      >
        <RequestQuoteProjectFields />
        <RequestQuoteContactFields />
        <RfqTradeMarkerField />
        <RequestQuoteSubmitControls
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
