import { PHONE_MAX_DIGITS } from "@/constants/count";
import { MAX_LEAD_MESSAGE_LENGTH } from "@/constants/validation-limits";
import { MILLISECONDS_PER_SECOND, SECONDS_PER_MINUTE } from "@/constants/time";

/**
 * 表单字段枚举键值
 */
export const CONTACT_FORM_FIELD_KEYS = [
  "fullName",
  "email",
  "company",
  "phone",
  "subject",
  "message",
  "website",
] as const;

export type ContactFormFieldKey = (typeof CONTACT_FORM_FIELD_KEYS)[number];

type ContactFormFieldType =
  | "text"
  | "email"
  | "tel"
  | "textarea"
  | "checkbox"
  | "hidden";

/**
 * 单字段配置
 */
export interface ContactFormFieldConfig {
  key: ContactFormFieldKey;
  enabled: boolean;
  required: boolean;
  type: ContactFormFieldType;
  order: number;
  i18nKey: string;
}

/**
 * 特性配置
 */
interface ContactFormFeatures {
  enableTurnstile: boolean;
  useWebsiteHoneypot: boolean;
  sendConfirmationEmail: boolean;
}

/**
 * 验证配置
 */
interface ContactFormValidationSettings {
  emailDomainWhitelist: string[];
  messageMinLength: number;
  messageMaxLength: number;
}

/**
 * 表单配置整体契约
 */
export interface ContactFormConfig {
  schemaVersion: number;
  fields: Record<ContactFormFieldKey, ContactFormFieldConfig>;
  features: ContactFormFeatures;
  validation: ContactFormValidationSettings;
}

export interface ContactFormFieldValues {
  fullName: string;
  email: string;
  company?: string | undefined;
  message: string;
  phone?: string | undefined;
  subject?: string | undefined;
  website?: string | undefined;
}

const CONTACT_NAME_MIN_LENGTH = 1;
const CONTACT_NAME_MAX_LENGTH = 50;
const CONTACT_EMAIL_MAX_LENGTH = 100;
const CONTACT_COMPANY_MIN_LENGTH = 2;
const CONTACT_COMPANY_MAX_LENGTH = 100;
const CONTACT_MESSAGE_MIN_LENGTH = 10;
const CONTACT_SUBJECT_MIN_LENGTH = 5;
const CONTACT_SUBJECT_MAX_LENGTH = 100;
const CONTACT_HONEYPOT_MAX_LENGTH = 0;
const CONTACT_DEFAULT_COOLDOWN_MINUTES = 5;

export const CONTACT_FORM_VALIDATION_CONSTANTS = {
  NAME_MIN_LENGTH: CONTACT_NAME_MIN_LENGTH,
  NAME_MAX_LENGTH: CONTACT_NAME_MAX_LENGTH,
  EMAIL_MAX_LENGTH: CONTACT_EMAIL_MAX_LENGTH,
  COMPANY_MIN_LENGTH: CONTACT_COMPANY_MIN_LENGTH,
  COMPANY_MAX_LENGTH: CONTACT_COMPANY_MAX_LENGTH,
  MESSAGE_MIN_LENGTH: CONTACT_MESSAGE_MIN_LENGTH,
  MESSAGE_MAX_LENGTH: MAX_LEAD_MESSAGE_LENGTH,
  SUBJECT_MIN_LENGTH: CONTACT_SUBJECT_MIN_LENGTH,
  SUBJECT_MAX_LENGTH: CONTACT_SUBJECT_MAX_LENGTH,
  PHONE_MAX_DIGITS: PHONE_MAX_DIGITS,
  HONEYPOT_MAX_LENGTH: CONTACT_HONEYPOT_MAX_LENGTH,
  DEFAULT_COOLDOWN_MINUTES: CONTACT_DEFAULT_COOLDOWN_MINUTES,
  COOLDOWN_TO_MS_MULTIPLIER: SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND,
  MS_PER_SECOND: MILLISECONDS_PER_SECOND,
} as const;

/**
 * 默认字段配置
 */
const DEFAULT_FIELD_CONFIGS: Record<
  ContactFormFieldKey,
  ContactFormFieldConfig
> = {
  fullName: {
    key: "fullName",
    enabled: true,
    required: true,
    type: "text",
    order: 1,
    i18nKey: "fullName",
  },
  email: {
    key: "email",
    enabled: true,
    required: true,
    type: "email",
    order: 2,
    i18nKey: "email",
  },
  company: {
    key: "company",
    enabled: true,
    required: false,
    type: "text",
    order: 3,
    i18nKey: "company",
  },
  phone: {
    key: "phone",
    enabled: false, // Disabled per Lead Pipeline requirements - simplify form
    required: false,
    type: "tel",
    order: 4,
    i18nKey: "phone",
  },
  subject: {
    key: "subject",
    enabled: true,
    required: false,
    type: "text",
    order: 5,
    i18nKey: "subject",
  },
  message: {
    key: "message",
    enabled: true,
    required: true,
    type: "textarea",
    order: 6,
    i18nKey: "message",
  },
  website: {
    key: "website",
    enabled: true,
    required: false,
    type: "hidden",
    order: 9,
    i18nKey: "website",
  },
};

export const CONTACT_FORM_CONFIG: ContactFormConfig = {
  schemaVersion: 1,
  fields: DEFAULT_FIELD_CONFIGS,
  features: {
    enableTurnstile: true,
    useWebsiteHoneypot: true,
    sendConfirmationEmail: false,
  },
  validation: {
    emailDomainWhitelist: [],
    messageMinLength: CONTACT_FORM_VALIDATION_CONSTANTS.MESSAGE_MIN_LENGTH,
    messageMaxLength: CONTACT_FORM_VALIDATION_CONSTANTS.MESSAGE_MAX_LENGTH,
  },
};

export interface ContactFormFieldDescriptor extends ContactFormFieldConfig {
  labelKey: string;
  placeholderKey?: string | undefined;
  isCheckbox: boolean;
  isHoneypot: boolean;
}

const PLACEHOLDER_KEYS: Partial<Record<ContactFormFieldKey, string>> = {
  fullName: "fullNamePlaceholder",
  email: "emailPlaceholder",
  company: "companyPlaceholder",
  phone: "phonePlaceholder",
  subject: "subjectPlaceholder",
  message: "messagePlaceholder",
};

export function shouldRenderField(
  field: ContactFormFieldConfig,
  features: ContactFormFeatures,
): boolean {
  if (field.key === "website" && !features.useWebsiteHoneypot) {
    return false;
  }
  return field.enabled;
}

export function buildFormFieldsFromConfig(
  config: ContactFormConfig,
): ContactFormFieldDescriptor[] {
  const fields = CONTACT_FORM_FIELD_KEYS.flatMap((key) => {
    const field = config.fields[key];
    return shouldRenderField(field, config.features) ? [field] : [];
  });

  return fields
    .sort((a, b) => a.order - b.order)
    .map((field) => ({
      // Safe spread: field is a strongly typed ContactFormFieldConfig from
      // static form configuration, not user-provided input.
      ...field,
      labelKey: field.i18nKey,
      // Safe lookup: PLACEHOLDER_KEYS is keyed by ContactFormFieldKey union type,
      // and field.key is a trusted enum-like key from config, not user input.
      placeholderKey: PLACEHOLDER_KEYS[field.key],
      isCheckbox: field.type === "checkbox",
      isHoneypot: field.key === "website",
    }));
}
