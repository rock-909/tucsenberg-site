import { type InquiryFormCopy } from "@/components/forms/inquiry-form-copy";

const FIELD_CLASS = "min-w-0 space-y-2";
const LABEL_CLASS = "block text-sm leading-none font-medium text-foreground";
const INPUT_CLASS =
  "min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-[var(--shadow-xs)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const HINT_CLASS = "text-xs leading-5 text-muted-foreground";
const REQUIRED_CLASS =
  "after:ml-0.5 after:text-destructive after:content-['*']";

export function InquiryBuyerInterestContext({
  buyerInterest,
  copy,
}: {
  buyerInterest: string;
  copy: InquiryFormCopy;
}) {
  return (
    <p
      className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground"
      data-testid="inquiry-buyer-interest-context"
    >
      <span className="font-medium text-foreground">{copy.contextLabel}: </span>
      <span translate="no">{buyerInterest}</span>
    </p>
  );
}

export function InquiryFormFields({
  copy,
  initialMessage,
  messageMaxLength,
}: {
  copy: InquiryFormCopy;
  initialMessage?: string;
  messageMaxLength: number;
}) {
  const messageHintId = "inquiry-message-hint";

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className={FIELD_CLASS}>
          <label
            className={`${LABEL_CLASS} ${REQUIRED_CLASS}`}
            htmlFor="inquiry-fullName"
          >
            {copy.fullName}
          </label>
          <input
            autoComplete="name"
            className={INPUT_CLASS}
            id="inquiry-fullName"
            name="fullName"
            required
            type="text"
          />
        </div>
        <div className={FIELD_CLASS}>
          <label
            className={`${LABEL_CLASS} ${REQUIRED_CLASS}`}
            htmlFor="inquiry-email"
          >
            {copy.email}
          </label>
          <input
            autoComplete="email"
            className={INPUT_CLASS}
            id="inquiry-email"
            inputMode="email"
            name="email"
            required
            type="email"
          />
        </div>
      </div>

      <div className={FIELD_CLASS}>
        <label className={LABEL_CLASS} htmlFor="inquiry-message">
          {copy.message}{" "}
          <span className="text-xs font-normal text-muted-foreground">
            ({copy.optional})
          </span>
        </label>
        <textarea
          aria-describedby={messageHintId}
          className={`${INPUT_CLASS} min-h-32 resize-y leading-6`}
          defaultValue={initialMessage}
          id="inquiry-message"
          key={initialMessage ?? "empty-message"}
          maxLength={messageMaxLength}
          name="message"
          rows={5}
        />
        <p className={HINT_CLASS} id={messageHintId}>
          {copy.messageHint}
        </p>
      </div>
    </>
  );
}
