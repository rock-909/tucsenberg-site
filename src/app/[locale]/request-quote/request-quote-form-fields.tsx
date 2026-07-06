import {
  REQUEST_QUOTE_DEFAULT_MATERIAL_VALUE,
  REQUEST_QUOTE_MATERIAL_OPTIONS,
  REQUEST_QUOTE_MOUNTING_SURFACE_OPTIONS,
  REQUEST_QUOTE_PROTECTION_OPTIONS,
  REQUEST_QUOTE_QUANTITY_OPTIONS,
  REQUEST_QUOTE_TIMELINE_OPTIONS,
  type RequestQuoteOption,
} from "@/config/request-quote-form-config";
import type { RequestQuoteFormCopy } from "@/app/[locale]/request-quote/request-quote-form-copy";

const RFQ_FIELD_CLASS = "min-w-0 space-y-2";
const RFQ_LABEL_CLASS =
  "block text-sm leading-none font-medium text-foreground";
const RFQ_INPUT_CLASS =
  "min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-[var(--shadow-xs)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const RFQ_SELECT_CLASS =
  "min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-[var(--shadow-xs)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const RFQ_HINT_CLASS = "text-xs leading-5 text-muted-foreground";

type RequestQuoteOptionLabels = Readonly<Record<string, string>>;

function RequestQuoteSelectField({
  id,
  label,
  name,
  options,
  optionLabels,
  selectOneLabel,
  defaultValue,
  required,
}: {
  id: string;
  label: string;
  name: string;
  options: readonly RequestQuoteOption[];
  optionLabels: RequestQuoteOptionLabels;
  selectOneLabel: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div className={RFQ_FIELD_CLASS}>
      <label className={RFQ_LABEL_CLASS} htmlFor={id}>
        {label}
      </label>
      <select
        className={RFQ_SELECT_CLASS}
        defaultValue={defaultValue ?? ""}
        id={id}
        name={name}
        required={required}
      >
        <option value="">{selectOneLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {optionLabels[option.value]}
          </option>
        ))}
      </select>
    </div>
  );
}

function RequestQuoteTextField({
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
        className={RFQ_INPUT_CLASS}
        id={id}
        inputMode={inputMode}
        name={name}
        required={required}
        type={type}
      />
    </div>
  );
}

function RequestQuoteAssetLinksField({ copy }: { copy: RequestQuoteFormCopy }) {
  const hintId = "rfq-assets-hint";

  return (
    <div className={RFQ_FIELD_CLASS}>
      <label className={RFQ_LABEL_CLASS} htmlFor="rfq-assets">
        {copy.fields.assetLinks}
      </label>
      <input
        aria-describedby={hintId}
        className={RFQ_INPUT_CLASS}
        id="rfq-assets"
        name="assetLinks"
        type="text"
      />
      <p className={RFQ_HINT_CLASS} id={hintId}>
        {copy.assetHint}
      </p>
    </div>
  );
}

export function RequestQuoteProjectFields({
  copy,
}: {
  copy: RequestQuoteFormCopy;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <RequestQuoteSelectField
        id="rfq-protection"
        label={copy.fields.protection}
        name="protection"
        optionLabels={copy.payload.options.protection}
        options={REQUEST_QUOTE_PROTECTION_OPTIONS}
        selectOneLabel={copy.selectOne}
      />
      <RequestQuoteTextField
        id="rfq-dimensions"
        label={copy.fields.dimensions}
        name="dimensions"
      />
      <RequestQuoteSelectField
        id="rfq-mounting"
        label={copy.fields.mounting}
        name="mounting"
        optionLabels={copy.payload.options.mounting}
        options={REQUEST_QUOTE_MOUNTING_SURFACE_OPTIONS}
        selectOneLabel={copy.selectOne}
      />
      <RequestQuoteSelectField
        defaultValue={REQUEST_QUOTE_DEFAULT_MATERIAL_VALUE}
        id="rfq-material"
        label={copy.fields.material}
        name="material"
        optionLabels={copy.payload.options.material}
        options={REQUEST_QUOTE_MATERIAL_OPTIONS}
        required
        selectOneLabel={copy.selectOne}
      />
      <RequestQuoteSelectField
        id="rfq-quantity"
        label={copy.fields.quantity}
        name="quantity"
        optionLabels={copy.payload.options.quantity}
        options={REQUEST_QUOTE_QUANTITY_OPTIONS}
        required
        selectOneLabel={copy.selectOne}
      />
      <RequestQuoteTextField
        id="rfq-delivery"
        label={copy.fields.delivery}
        name="delivery"
      />
      <RequestQuoteSelectField
        id="rfq-timeline"
        label={copy.fields.timeline}
        name="timeline"
        optionLabels={copy.payload.options.timeline}
        options={REQUEST_QUOTE_TIMELINE_OPTIONS}
        selectOneLabel={copy.selectOne}
      />
      <RequestQuoteAssetLinksField copy={copy} />
    </div>
  );
}

export function RequestQuoteContactFields({
  copy,
}: {
  copy: RequestQuoteFormCopy;
}) {
  return (
    <div className="border-border grid gap-4 border-t pt-6 md:grid-cols-2">
      <RequestQuoteTextField
        autoComplete="name"
        id="rfq-name"
        label={copy.fields.fullName}
        name="fullName"
        required
      />
      <RequestQuoteTextField
        autoComplete="email"
        id="rfq-email"
        inputMode="email"
        label={copy.fields.email}
        name="email"
        required
        type="email"
      />
      <RequestQuoteTextField
        autoComplete="organization"
        id="rfq-company"
        label={copy.fields.company}
        name="company"
      />
      <RequestQuoteTextField
        autoComplete="tel"
        id="rfq-whatsapp"
        inputMode="tel"
        label={copy.fields.whatsApp}
        name="whatsApp"
        type="tel"
      />
    </div>
  );
}

export function RequestQuoteTradeMarkerField({
  copy,
}: {
  copy: RequestQuoteFormCopy;
}) {
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
          {copy.tradeEnquiry}
        </label>
      </div>
    </div>
  );
}
