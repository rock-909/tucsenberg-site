import type { RequestQuoteFormCopy } from "@/app/[locale]/request-quote/request-quote-form-copy";

const RFQ_FIELD_CLASS = "min-w-0 space-y-2";
const RFQ_LABEL_CLASS =
  "block text-sm leading-none font-medium text-foreground";
const RFQ_INPUT_CLASS =
  "min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-[var(--shadow-xs)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const RFQ_HINT_CLASS = "text-xs leading-5 text-muted-foreground";

const RFQ_MESSAGE_MAX_LENGTH = 4000;

export function RequestQuoteContactFields({
  copy,
}: {
  copy: RequestQuoteFormCopy;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className={RFQ_FIELD_CLASS}>
        <label className={RFQ_LABEL_CLASS} htmlFor="rfq-name">
          {copy.fields.fullName}
        </label>
        <input
          autoComplete="name"
          className={RFQ_INPUT_CLASS}
          id="rfq-name"
          name="fullName"
          required
          type="text"
        />
      </div>
      <div className={RFQ_FIELD_CLASS}>
        <label className={RFQ_LABEL_CLASS} htmlFor="rfq-email">
          {copy.fields.email}
        </label>
        <input
          autoComplete="email"
          className={RFQ_INPUT_CLASS}
          id="rfq-email"
          inputMode="email"
          name="email"
          required
          type="email"
        />
      </div>
    </div>
  );
}

export function RequestQuoteMessageField({
  copy,
}: {
  copy: RequestQuoteFormCopy;
}) {
  const hintId = "rfq-message-hint";

  return (
    <div className={RFQ_FIELD_CLASS}>
      <label className={RFQ_LABEL_CLASS} htmlFor="rfq-message">
        {copy.fields.message}
      </label>
      <textarea
        aria-describedby={hintId}
        className={`${RFQ_INPUT_CLASS} min-h-32 resize-y leading-6`}
        id="rfq-message"
        maxLength={RFQ_MESSAGE_MAX_LENGTH}
        name="message"
        rows={5}
      />
      <p className={RFQ_HINT_CLASS} id={hintId}>
        {copy.messageHint}
      </p>
    </div>
  );
}
