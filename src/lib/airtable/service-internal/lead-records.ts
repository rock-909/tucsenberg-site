import "server-only";

import type AirtableNS from "airtable";
import type {
  ContactLeadData,
  CreatedAirtableRecord,
  LeadSource,
  ProductLeadData,
} from "@/lib/airtable/types";
import {
  sanitizeAirtablePhoneField,
  sanitizeAirtableTextField,
} from "@/lib/airtable/service-internal/field-sanitization";
import { LEAD_TYPES, type LeadType } from "@/lib/lead-pipeline/lead-schema";
import { formatQuantity } from "@/lib/lead-pipeline/utils";
import { logger, sanitizeEmail } from "@/lib/logger";
import {
  ATTRIBUTION_FIELD_NAMES,
  type AttributionFieldName,
  type MarketingAttributionFields,
} from "@/lib/marketing/attribution-fields";

type AirtableFieldValue = string | number | boolean;
type AirtableFields = Record<string, AirtableFieldValue>;

const AIRTABLE_ATTRIBUTION_FIELD_NAMES = {
  utmSource: "UTM Source",
  utmMedium: "UTM Medium",
  utmCampaign: "UTM Campaign",
  utmTerm: "UTM Term",
  utmContent: "UTM Content",
  gclid: "GCLID",
  fbclid: "FBCLID",
  msclkid: "MSCLKID",
  landingPage: "Landing Page",
  capturedAt: "Captured At",
} satisfies Record<AttributionFieldName, string>;

function getLeadSource(type: LeadType): LeadSource {
  if (type === LEAD_TYPES.PRODUCT) {
    return "Product Inquiry";
  }
  return "Website Contact Form";
}

function buildBaseFields(
  source: LeadSource,
  email: string,
  now: string,
): AirtableFields {
  return {
    // Email is validated by the lead schema and must remain a valid typed value.
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

function addPhoneField(fields: AirtableFields, phone?: string): void {
  if (!phone) return;
  fields["WhatsApp / Phone"] = sanitizeAirtablePhoneField(phone);
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
  addPhoneField(fields, data.phone);
}

function addProductFields(fields: AirtableFields, data: ProductLeadData): void {
  fields["First Name"] = sanitizeAirtableTextField(data.firstName);
  fields["Last Name"] = sanitizeAirtableTextField(data.lastName);
  fields["Company"] = data.company
    ? sanitizeAirtableTextField(data.company)
    : "";
  fields["Message"] = sanitizeAirtableTextField(data.message);
  addPhoneField(fields, data.phone);
  fields["Product Name"] = sanitizeAirtableTextField(data.productName);
  // Product Slug holds the registry-validated catalog product id, and is empty
  // for a general RFQ, which honestly carries no per-product identity.
  fields["Product Slug"] = data.catalogProductId
    ? sanitizeAirtableTextField(data.catalogProductId)
    : "";
  fields["Quantity"] =
    data.quantity !== undefined && String(data.quantity).trim().length > 0
      ? sanitizeAirtableTextField(formatQuantity(data.quantity))
      : "";
  if (data.requirements) {
    fields["Requirements"] = sanitizeAirtableTextField(data.requirements);
  }
}

function addAttributionFields(
  fields: AirtableFields,
  data: MarketingAttributionFields,
): void {
  for (const fieldName of ATTRIBUTION_FIELD_NAMES) {
    const value = data[fieldName];
    if (value) {
      fields[AIRTABLE_ATTRIBUTION_FIELD_NAMES[fieldName]] =
        sanitizeAirtableTextField(value);
    }
  }
}

function addTypeSpecificFields(
  fields: AirtableFields,
  type: LeadType,
  data: ContactLeadData | ProductLeadData,
): void {
  if (type === LEAD_TYPES.PRODUCT) {
    addProductFields(fields, data as ProductLeadData);
    return;
  }
  addContactFields(fields, data as ContactLeadData);
}

function buildLeadFields(params: {
  type: LeadType;
  data: ContactLeadData | ProductLeadData;
  source: LeadSource;
  now: string;
}): AirtableFields {
  const fields = buildBaseFields(params.source, params.data.email, params.now);
  addReferenceId(fields, params.data.referenceId);
  addTypeSpecificFields(fields, params.type, params.data);
  addAttributionFields(fields, params.data);
  return fields;
}

interface AirtableLikeError {
  error: string;
  message: string;
  statusCode: number;
}

function isAirtableLikeError(error: unknown): error is AirtableLikeError {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as Record<string, unknown>;
  return (
    typeof candidate.error === "string" &&
    typeof candidate.message === "string" &&
    typeof candidate.statusCode === "number"
  );
}

function buildCreateLeadRecordLogContext(
  error: unknown,
  type: LeadType,
): Record<string, string | number> {
  if (error instanceof Error) {
    return { error: error.message, type };
  }

  if (isAirtableLikeError(error)) {
    return { errorType: error.error, statusCode: error.statusCode, type };
  }

  return { error: "Unknown error", type };
}

export async function createLeadRecord(params: {
  base: AirtableNS.Base;
  tableName: string;
  type: LeadType;
  data: ContactLeadData | ProductLeadData;
}): Promise<CreatedAirtableRecord> {
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
      ...(createdRecord.get("Created Time")
        ? { createdTime: createdRecord.get("Created Time") as string }
        : {}),
    };
  } catch (error) {
    logger.error(
      "Failed to create lead record",
      buildCreateLeadRecordLogContext(error, type),
    );
    throw new Error("Failed to create lead record", { cause: error });
  }
}
