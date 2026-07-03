import "server-only";

import type AirtableNS from "airtable";
import type {
  AirtableRecord,
  ContactLeadData,
  LeadSource,
  NewsletterLeadData,
  ProductLeadData,
} from "@/lib/airtable/types";
import { sanitizeAirtableTextField } from "@/lib/airtable/service-internal/field-sanitization";
import { LEAD_TYPES, type LeadType } from "@/lib/lead-pipeline/lead-schema";
import { logger, sanitizeEmail } from "@/lib/logger";

type AirtableFieldValue = string | number | boolean;
type AirtableFields = Record<string, AirtableFieldValue>;

function getLeadSource(type: LeadType): LeadSource {
  switch (type) {
    case LEAD_TYPES.CONTACT:
      return "Website Contact Form";
    case LEAD_TYPES.PRODUCT:
      return "Product Inquiry";
    case LEAD_TYPES.NEWSLETTER:
      return "Newsletter Subscription";
    default:
      return "Website Contact Form";
  }
}

function buildBaseFields(
  source: LeadSource,
  email: string,
  now: string,
): AirtableFields {
  return {
    Email: email.toLowerCase().trim(),
    "Submitted At": now,
    Status: "New",
    Source: source,
  };
}

function addReferenceId(fields: AirtableFields, referenceId?: string): void {
  if (!referenceId) return;
  fields["Reference ID"] = referenceId;
}

function addContactFields(fields: AirtableFields, data: ContactLeadData): void {
  fields["First Name"] = sanitizeAirtableTextField(data.firstName);
  fields["Last Name"] = sanitizeAirtableTextField(data.lastName);
  fields["Company"] = data.company
    ? sanitizeAirtableTextField(data.company)
    : "";
  if (data.subject) {
    fields["Subject"] = sanitizeAirtableTextField(data.subject);
  }
  fields["Message"] = sanitizeAirtableTextField(data.message);
  fields["Marketing Consent"] = data.marketingConsent || false;
}

function addProductFields(fields: AirtableFields, data: ProductLeadData): void {
  fields["First Name"] = sanitizeAirtableTextField(data.firstName);
  fields["Last Name"] = sanitizeAirtableTextField(data.lastName);
  fields["Company"] = data.company
    ? sanitizeAirtableTextField(data.company)
    : "";
  fields["Message"] = sanitizeAirtableTextField(data.message);
  fields["Product Name"] = sanitizeAirtableTextField(data.productName);
  fields["Product Slug"] = sanitizeAirtableTextField(data.productSlug);
  fields["Quantity"] =
    typeof data.quantity === "number"
      ? data.quantity.toString()
      : sanitizeAirtableTextField(data.quantity);
  if (data.requirements) {
    fields["Requirements"] = sanitizeAirtableTextField(data.requirements);
  }
  fields["Marketing Consent"] = data.marketingConsent || false;
}

function addNewsletterFields(fields: AirtableFields): void {
  fields["First Name"] = "";
  fields["Last Name"] = "";
  fields["Company"] = "";
  fields["Message"] = "Newsletter subscription";
}

function addTypeSpecificFields(
  fields: AirtableFields,
  type: LeadType,
  data: ContactLeadData | ProductLeadData | NewsletterLeadData,
): void {
  switch (type) {
    case LEAD_TYPES.CONTACT:
      addContactFields(fields, data as ContactLeadData);
      return;
    case LEAD_TYPES.PRODUCT:
      addProductFields(fields, data as ProductLeadData);
      return;
    case LEAD_TYPES.NEWSLETTER:
      addNewsletterFields(fields);
      return;
    default:
      addContactFields(fields, data as ContactLeadData);
  }
}

function buildLeadFields(params: {
  type: LeadType;
  data: ContactLeadData | ProductLeadData | NewsletterLeadData;
  source: LeadSource;
  now: string;
}): AirtableFields {
  const fields = buildBaseFields(params.source, params.data.email, params.now);
  addReferenceId(fields, params.data.referenceId);
  addTypeSpecificFields(fields, params.type, params.data);
  return fields;
}

export async function createLeadRecord(params: {
  base: AirtableNS.Base;
  tableName: string;
  type: LeadType;
  data: ContactLeadData | ProductLeadData | NewsletterLeadData;
}): Promise<AirtableRecord> {
  const { base, tableName, type, data } = params;

  try {
    const source = getLeadSource(type);
    const now = new Date().toISOString();
    const fields = buildLeadFields({ type, data, source, now });

    const recordsResult = await base.table(tableName).create([
      {
        fields,
      },
    ]);

    const createdRecord = Array.isArray(recordsResult)
      ? recordsResult[0]
      : recordsResult;

    if (!createdRecord) {
      throw new Error("Failed to create lead record");
    }

    logger.info("Lead record created successfully", {
      recordId: createdRecord.id,
      type,
      source,
      email: sanitizeEmail(data.email),
      referenceId: data.referenceId,
    });

    return {
      id: createdRecord.id,
      fields: createdRecord.fields as AirtableRecord["fields"],
      createdTime: createdRecord.get("Created Time") as string,
    };
  } catch (error) {
    logger.error("Failed to create lead record", {
      error: error instanceof Error ? error.message : "Unknown error",
      type,
    });
    throw new Error("Failed to create lead record", { cause: error });
  }
}
