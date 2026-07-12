/**
 * Contact form fields and field composition helpers.
 */

import { memo } from "react";
import {
  ContactFormTextInput,
  ContactFormTextarea,
} from "@/components/ui/contact-form-control";
import { Label } from "@/components/ui/label";
import {
  buildFormFieldsFromConfig,
  CONTACT_FORM_CONFIG,
  type ContactFormFieldDescriptor,
} from "@/config/contact-form-config";
import { FORM_FIELD_REQUIRED_CLASS_NAME } from "@/components/forms/form-status-styles";

export interface FormFieldsProps {
  t: (key: string) => string;
  isPending: boolean;
}

type ContactFormTextFieldType = "email" | "tel" | "text";

type ContactFormTextFieldDescriptor = ContactFormFieldDescriptor & {
  type: ContactFormTextFieldType;
};

interface ContactFormControlHintProps {
  autoComplete?: string;
  autoCapitalize?: string;
  inputMode?: "email" | "tel";
  spellCheck?: boolean;
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

function getFieldInputProps(
  field: ContactFormFieldDescriptor,
): ContactFormControlHintProps {
  switch (field.key) {
    case "fullName":
      return {
        autoComplete: "name",
        autoCapitalize: "words",
      };
    case "email":
      return {
        autoComplete: "email",
        inputMode: "email",
        spellCheck: false,
        autoCapitalize: "none",
      };
    case "company":
      return {
        autoComplete: "organization",
        autoCapitalize: "words",
      };
    case "phone":
      return {
        autoComplete: "tel",
        inputMode: "tel",
        spellCheck: false,
      };
    case "subject":
      return {
        autoComplete: "off",
        autoCapitalize: "sentences",
      };
    case "message":
      return {
        autoComplete: "off",
        spellCheck: true,
      };
    default:
      return {};
  }
}

function isContactFormTextField(
  field: ContactFormFieldDescriptor,
): field is ContactFormTextFieldDescriptor {
  return (
    !field.isCheckbox &&
    field.type !== "hidden" &&
    field.type !== "textarea" &&
    !field.isHoneypot
  );
}

function getFieldLabelClass(field: ContactFormFieldDescriptor): string {
  return ["text-sm", field.required ? FORM_FIELD_REQUIRED_CLASS_NAME : ""]
    .filter(Boolean)
    .join(" ");
}

function getFieldPlaceholder(
  field: ContactFormFieldDescriptor,
  t: (key: string) => string,
): string | undefined {
  return field.placeholderKey ? t(field.placeholderKey) : undefined;
}

export const FormFields = memo(({ t, isPending }: FormFieldsProps) => {
  const configuredFields = buildFormFieldsFromConfig(CONTACT_FORM_CONFIG);
  const textInputs = configuredFields.filter(isContactFormTextField);
  const textareas = configuredFields.filter(
    (field) => field.type === "textarea",
  );
  const checkboxFields = configuredFields.filter((field) => field.isCheckbox);
  const honeypotField = configuredFields.find((field) => field.isHoneypot);

  return (
    <>
      {textInputs.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {textInputs.map((field) => (
            <div key={field.key} className="min-w-0 space-y-2">
              <Label htmlFor={field.key} className={getFieldLabelClass(field)}>
                {t(field.labelKey)}
                {!field.required && !field.isHoneypot ? (
                  <OptionalFieldMarker
                    fieldKey={field.key}
                    label={t("optional")}
                  />
                ) : null}
              </Label>
              <ContactFormTextInput
                id={field.key}
                name={field.key}
                type={field.type}
                placeholder={getFieldPlaceholder(field, t)}
                disabled={isPending}
                required={field.required}
                aria-describedby={`${field.key}-error`}
                {...getFieldInputProps(field)}
              />
            </div>
          ))}
        </div>
      )}

      {textareas.map((field) => (
        <div key={field.key} className="min-w-0 space-y-2">
          <Label htmlFor={field.key} className={getFieldLabelClass(field)}>
            {t(field.labelKey)}
          </Label>
          <ContactFormTextarea
            id={field.key}
            name={field.key}
            placeholder={getFieldPlaceholder(field, t)}
            disabled={isPending}
            required={field.required}
            aria-describedby={`${field.key}-error`}
            rows={4}
            {...getFieldInputProps(field)}
          />
        </div>
      ))}

      {checkboxFields.length > 0 && (
        <div className="space-y-4">
          {checkboxFields.map((field) => (
            <div key={field.key} className="min-w-0 space-y-2">
              <div className="flex min-h-11 items-start gap-3">
                <input
                  aria-label={t(field.labelKey)}
                  id={field.key}
                  name={field.key}
                  type="checkbox"
                  disabled={isPending}
                  required={field.required}
                  className="mt-0.5 size-6 shrink-0 rounded border border-input"
                />
                <Label
                  htmlFor={field.key}
                  className={`${getFieldLabelClass(field)} min-w-0 flex-1 leading-6 break-words`}
                >
                  {t(field.labelKey)}
                </Label>
              </div>
            </div>
          ))}
        </div>
      )}

      {honeypotField && (
        <input
          id={honeypotField.key}
          name={honeypotField.key}
          type="hidden"
          autoComplete="off"
          hidden
          tabIndex={-1}
        />
      )}
    </>
  );
});

FormFields.displayName = "FormFields";
