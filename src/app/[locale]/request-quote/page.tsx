import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import {
  generateLocaleStaticParams,
  type LocaleParam,
} from "@/app/[locale]/generate-static-params";
import { getLocalizedPath } from "@/config/paths";
import { generateMetadataForPath, type Locale } from "@/lib/seo-metadata";

const RFQ_SUCCESS_COPY =
  "Received. Standard items: quote within 12 hours. Custom: within 48. You'll hear from a person, not a sequence.";

const RFQ_CONTROL_CLASS =
  "mt-2 min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-[var(--shadow-xs)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const RFQ_FIELD_CLASS = "min-w-0";
const RFQ_LABEL_CLASS = "text-sm font-medium text-foreground";
const RFQ_HINT_CLASS = "mt-2 text-xs leading-5 text-muted-foreground";

interface RfqOption {
  value: string;
  label: string;
}

const PROTECTION_OPTIONS: readonly RfqOption[] = [
  { value: "door", label: "Door" },
  { value: "garage", label: "Garage" },
  { value: "driveway", label: "Driveway" },
  { value: "loading-dock", label: "Loading dock" },
  { value: "perimeter", label: "Perimeter" },
  { value: "stock-resale-order", label: "Stock / resale order" },
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

interface RequestQuotePageProps {
  params: Promise<LocaleParam>;
}

export function generateStaticParams() {
  return generateLocaleStaticParams();
}

export async function generateMetadata({
  params,
}: RequestQuotePageProps): Promise<Metadata> {
  const { locale } = await params;

  return generateMetadataForPath({
    locale: locale as Locale,
    pageType: "requestQuote",
    path: getLocalizedPath("requestQuote", locale as Locale),
    config: {
      title: "Request a Quote — 12-Hour Response on Standard Items",
      description:
        "Send dimensions, quantities, market and timeline. Standard flood barrier items quoted within 12 hours; custom configurations within 48.",
    },
  });
}

function RfqSelectField({
  id,
  label,
  name,
  options,
  defaultValue,
}: {
  id: string;
  label: string;
  name: string;
  options: readonly RfqOption[];
  defaultValue?: string;
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
}: {
  id: string;
  label: string;
  name: string;
  autoComplete?: string;
  inputMode?: "email" | "tel";
  type?: "email" | "tel" | "text";
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
        type={type}
      />
    </div>
  );
}

function RfqFileField() {
  const hintId = "rfq-files-hint";

  return (
    <div className={RFQ_FIELD_CLASS}>
      <label className={RFQ_LABEL_CLASS} htmlFor="rfq-files">
        Photos / drawings upload
      </label>
      <input
        accept="image/*,.pdf"
        aria-describedby={hintId}
        className={RFQ_CONTROL_CLASS}
        id="rfq-files"
        multiple
        name="files"
        type="file"
      />
      <p className={RFQ_HINT_CLASS} id={hintId}>
        Optional. Up to five files, 10MB each.
      </p>
    </div>
  );
}

function RfqTradeMarkerField() {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4">
      <div className="flex min-h-11 items-start gap-3">
        <input
          className="mt-0.5 size-6 shrink-0 rounded border border-input bg-background"
          id="rfq-trade-enquiry"
          name="tradeEnquiry"
          type="checkbox"
        />
        <label
          className="min-w-0 flex-1 text-sm font-medium leading-6 text-foreground"
          htmlFor="rfq-trade-enquiry"
        >
          This is a wholesale / OEM / private label enquiry
        </label>
      </div>
    </div>
  );
}

function RequestQuoteForm() {
  return (
    <section className="surface-card p-6 md:p-8">
      <h2 className="mb-6 text-2xl font-semibold">Request a quote</h2>
      <form
        aria-label="Request a quote"
        className="space-y-6"
        data-analytics-event="rfq_submit"
        data-lead-path="canonical-contact"
        noValidate
      >
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
          <RfqTextField
            id="rfq-mounting"
            label="Mounting surface / ground type"
            name="mounting"
          />
          <RfqSelectField
            defaultValue="advise-me"
            id="rfq-material"
            label="Material preference"
            name="material"
            options={MATERIAL_OPTIONS}
          />
          <RfqSelectField
            id="rfq-quantity"
            label="Quantity"
            name="quantity"
            options={QUANTITY_OPTIONS}
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
          <RfqFileField />
        </div>

        <div className="grid gap-4 border-t border-border pt-6 md:grid-cols-2">
          <RfqTextField
            autoComplete="name"
            id="rfq-name"
            label="Name"
            name="fullName"
          />
          <RfqTextField
            autoComplete="email"
            id="rfq-email"
            inputMode="email"
            label="Email"
            name="email"
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

        <RfqTradeMarkerField />

        <button
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[var(--button-primary-bg)] px-5 py-2.5 text-sm font-medium text-[var(--button-primary-fg)] shadow-[var(--shadow-xs)]"
          type="submit"
        >
          Send RFQ
        </button>
      </form>
    </section>
  );
}

function RequestQuoteAside() {
  return (
    <aside className="space-y-4">
      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold">After you submit</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {RFQ_SUCCESS_COPY}
        </p>
      </section>
      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold">Quote confidence</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
          <li>3-year warranty</li>
          <li>Sample fees credited</li>
          <li>
            No published-price games — the quote is the price conversation
          </li>
        </ul>
      </section>
    </aside>
  );
}

export default async function RequestQuotePage({
  params,
}: RequestQuotePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-14 md:py-[72px]">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-heading mb-4">Get real numbers, fast</h1>
        <p className="text-body text-muted-foreground">
          Send what you know — photos and rough dimensions are enough to start.
          Standard items quoted within <strong>12 hours</strong>, custom
          configurations within <strong>48</strong>.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <RequestQuoteForm />
        <RequestQuoteAside />
      </div>
    </div>
  );
}
