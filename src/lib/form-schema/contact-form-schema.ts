import { contactFieldValidators } from "@/lib/form-schema/contact-field-validators";
import {
  CONTACT_FORM_CONFIG,
  type ContactFormFieldValues,
} from "@/config/contact-form-config";
import { createContactFormSchemaFromConfig } from "@/config/contact-form-validation";

export const contactFormSchema = createContactFormSchemaFromConfig(
  CONTACT_FORM_CONFIG,
  contactFieldValidators,
);

export type ContactFormData = ContactFormFieldValues;
