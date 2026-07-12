import { DataCard } from "@/components/ui/data-card";
import {
  buildFormFieldsFromConfig,
  CONTACT_FORM_CONFIG,
  type ContactFormFieldDescriptor,
} from "@/config/contact-form-config";
import {
  FORM_FIELD_REQUIRED_CLASS_NAME,
  FORM_STATUS_CLASS_NAMES,
} from "@/components/forms/form-status-styles";
import { readRequiredMessagePath } from "@/lib/i18n/read-message-path";
import { cn } from "@/lib/utils";

const STATIC_FORM_CONTROL_CLASS =
  "flex min-h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60";

function pickContactFormCopy(messages: Record<string, unknown>, key: string) {
  return readRequiredMessagePath(messages, ["contact", "form", key]);
}

function getFieldLabelClass(field: ContactFormFieldDescriptor): string {
  return [
    "text-sm font-medium",
    field.required ? FORM_FIELD_REQUIRED_CLASS_NAME : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function OptionalFieldMarker({
  fieldKey,
  label,
}: {
  fieldKey: string;
  label: string;
}) {
  return (
    <span
      className="text-xs font-normal text-muted-foreground"
      data-contact-form-field-optional={fieldKey}
      translate="no"
    >
      {label}
    </span>
  );
}

function StaticTextField({
  field,
  label,
  optionalLabel,
}: {
  field: ContactFormFieldDescriptor;
  label: string;
  optionalLabel?: string;
}) {
  const inputType = field.type === "email" ? "email" : "text";

  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={field.key} className={getFieldLabelClass(field)}>
        <span translate="no">{label}</span>
        {!field.required ? (
          <OptionalFieldMarker
            fieldKey={field.key}
            label={optionalLabel ?? ""}
          />
        ) : null}
      </label>
      <input
        aria-label={label}
        id={field.key}
        name={field.key}
        type={inputType}
        disabled
        required={field.required}
        className={STATIC_FORM_CONTROL_CLASS}
      />
    </div>
  );
}

function StaticTextareaField({
  field,
  label,
}: {
  field: ContactFormFieldDescriptor;
  label: string;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={field.key} className={getFieldLabelClass(field)}>
        <span translate="no">{label}</span>
      </label>
      <textarea
        aria-label={label}
        id={field.key}
        name={field.key}
        rows={4}
        disabled
        required={field.required}
        className={cn(STATIC_FORM_CONTROL_CLASS, "min-h-24 resize-y")}
      />
    </div>
  );
}

function StaticCheckboxField({
  field,
  label,
}: {
  field: ContactFormFieldDescriptor;
  label: string;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex min-h-11 items-start gap-3">
        <input
          aria-label={label}
          id={field.key}
          name={field.key}
          type="checkbox"
          disabled
          required={field.required}
          className="mt-0.5 size-6 shrink-0 rounded border border-input"
        />
        <label
          htmlFor={field.key}
          className={`${getFieldLabelClass(field)} min-w-0 flex-1 leading-6 break-words`}
        >
          <span translate="no">{label}</span>
        </label>
      </div>
    </div>
  );
}

export function ContactFormStaticFallback({
  messages,
}: {
  messages: Record<string, unknown>;
}) {
  const pick = (key: string) => pickContactFormCopy(messages, key);
  const optionalLabel = pick("optional");
  const turnstilePendingMessage = pick("turnstilePending");
  const configuredFields = buildFormFieldsFromConfig(CONTACT_FORM_CONFIG);
  const textInputs = configuredFields.filter(
    (field) =>
      !field.isCheckbox &&
      field.type !== "textarea" &&
      field.type !== "hidden" &&
      !field.isHoneypot,
  );
  const textareas = configuredFields.filter(
    (field) => field.type === "textarea",
  );
  const checkboxFields = configuredFields.filter((field) => field.isCheckbox);
  const honeypotField = configuredFields.find((field) => field.isHoneypot);

  return (
    <DataCard className="mx-auto w-full max-w-2xl">
      <form
        className="space-y-6 p-6"
        data-contact-form-fallback="static"
        noValidate
      >
        {textInputs.length > 0 ? (
          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
            {textInputs.map((field) => (
              <StaticTextField
                key={field.key}
                field={field}
                label={pick(field.i18nKey)}
                optionalLabel={optionalLabel}
              />
            ))}
          </div>
        ) : null}

        {textareas.map((field) => (
          <StaticTextareaField
            key={field.key}
            field={field}
            label={pick(field.i18nKey)}
          />
        ))}

        {checkboxFields.length > 0 ? (
          <div className="space-y-4">
            {checkboxFields.map((field) => (
              <StaticCheckboxField
                key={field.key}
                field={field}
                label={pick(field.i18nKey)}
              />
            ))}
          </div>
        ) : null}

        {honeypotField ? (
          <input
            id={honeypotField.key}
            name={honeypotField.key}
            type="hidden"
            autoComplete="off"
            hidden
            tabIndex={-1}
          />
        ) : null}

        <p
          className={`text-center text-sm ${FORM_STATUS_CLASS_NAMES.infoText}`}
          aria-live="polite"
          data-testid="contact-form-turnstile-status"
          translate="no"
        >
          {turnstilePendingMessage}
        </p>

        <button
          type="submit"
          disabled
          className="inline-flex h-[38px] w-full items-center justify-center rounded-md bg-[var(--button-primary-bg)] px-5 py-2.5 text-sm font-medium text-[var(--button-primary-fg)] disabled:cursor-not-allowed disabled:opacity-60"
          translate="no"
        >
          {pick("submit")}
        </button>
      </form>
    </DataCard>
  );
}
