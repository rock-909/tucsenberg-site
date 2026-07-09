import { z } from "zod";
import {
  CONTACT_FORM_FIELD_KEYS,
  shouldRenderField,
  type ContactFormConfig,
  type ContactFormFieldConfig,
  type ContactFormFieldKey,
  type ContactFormFieldValues,
} from "@/config/contact-form-config";

const FIELD_CONFIG_SCHEMA = z.object({
  key: z.enum(CONTACT_FORM_FIELD_KEYS as readonly string[]),
  enabled: z.boolean(),
  required: z.boolean(),
  type: z.enum(["text", "email", "tel", "textarea", "checkbox", "hidden"]),
  order: z.number().int().nonnegative(),
  i18nKey: z.string().min(1),
});

const FEATURES_SCHEMA = z.object({
  enableTurnstile: z.boolean(),
  showPrivacyCheckbox: z.boolean(),
  showMarketingConsent: z.boolean(),
  useWebsiteHoneypot: z.boolean(),
  sendConfirmationEmail: z.boolean(),
});

const VALIDATION_SCHEMA = z
  .object({
    emailDomainWhitelist: z.array(z.string().min(1)).default([]),
    messageMinLength: z.number().int().positive(),
    messageMaxLength: z.number().int().positive(),
  })
  .refine((value) => value.messageMinLength <= value.messageMaxLength, {
    message: "messageMinLength must be <= messageMaxLength",
  });

const CONTACT_FORM_FIELD_KEYS_ENUM = z.enum(
  CONTACT_FORM_FIELD_KEYS as readonly string[],
);

const FIELDS_SCHEMA = z
  .record(CONTACT_FORM_FIELD_KEYS_ENUM, FIELD_CONFIG_SCHEMA)
  .refine((value) => CONTACT_FORM_FIELD_KEYS.every((key) => key in value), {
    message: "Missing required field configs",
  });

export const contactFormConfigSchema = z.object({
  schemaVersion: z.number().int().min(1),
  fields: FIELDS_SCHEMA,
  features: FEATURES_SCHEMA,
  validation: VALIDATION_SCHEMA,
});

export interface ContactFormFieldValidatorContext {
  config: ContactFormConfig;
  field: ContactFormFieldConfig;
}

type ContactFormFieldValidator = (
  context: ContactFormFieldValidatorContext,
) => z.ZodTypeAny;

export type ContactFormFieldValidators = Record<
  ContactFormFieldKey,
  ContactFormFieldValidator
>;

type ContactFormFieldValuesShape = {
  [K in keyof ContactFormFieldValues]-?: z.ZodType<ContactFormFieldValues[K]>;
};

export function createContactFormSchemaFromConfig(
  config: ContactFormConfig,
  validators: ContactFormFieldValidators,
): z.ZodObject<ContactFormFieldValuesShape> {
  const shape = CONTACT_FORM_FIELD_KEYS.reduce<Record<string, z.ZodTypeAny>>(
    (acc, key) => {
      const field = config.fields[key];
      if (!shouldRenderField(field, config.features)) {
        return acc;
      }

      const validator = validators[key];
      if (!validator) {
        throw new Error(`Missing validator for field key: ${key}`);
      }

      acc[key] = validator({ config, field });
      return acc;
    },
    {},
  );

  return z.object(shape) as z.ZodObject<ContactFormFieldValuesShape>;
}
