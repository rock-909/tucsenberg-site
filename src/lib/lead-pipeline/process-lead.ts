import "server-only";

import { after } from "next/server";

import { CONTACT_FORM_CONFIG } from "@/config/contact-form-config";
import { airtableService } from "@/lib/airtable/instance";
import type {
  EmailTemplateData,
  ProductInquiryEmailData,
} from "@/lib/email/email-data-schema";
import {
  isContactLead,
  isProductLead,
  LEAD_TYPES,
  leadSchema,
  type ContactLeadInput,
  type LeadInput,
  type ProductLeadInput,
} from "@/lib/lead-pipeline/lead-schema";
import {
  createOptionalSubject,
  generateLeadReferenceId,
  generateProductInquiryMessage,
  splitName,
} from "@/lib/lead-pipeline/utils";
import { logger, sanitizeEmail } from "@/lib/logger";
import { pickAttributionFields } from "@/lib/marketing/attribution-fields";
import { resendService } from "@/lib/resend-instance";

interface ProcessLeadOptions {
  requestId?: string;
}

interface LeadProcessingContext {
  referenceId: string;
  requestId?: string | undefined;
}

export interface LeadResult {
  success: boolean;
  emailSent: boolean;
  ownerNotified: boolean;
  recordCreated: boolean;
  referenceId?: string | undefined;
  error?: "VALIDATION_ERROR" | "PROCESSING_FAILED";
}

const LEAD_DELIVERY_POLICY = "email-first-storage-optional" as const;

function withRequestId(
  requestId?: string,
): { requestId: string } | Record<string, never> {
  return requestId ? { requestId } : {};
}

function normalizeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function createValidationFailureResult(): LeadResult {
  return {
    success: false,
    emailSent: false,
    ownerNotified: false,
    recordCreated: false,
    error: "VALIDATION_ERROR",
  };
}

function createProcessingFailureResult(referenceId?: string): LeadResult {
  return {
    success: false,
    emailSent: false,
    ownerNotified: false,
    recordCreated: false,
    ...(referenceId ? { referenceId } : {}),
    error: "PROCESSING_FAILED",
  };
}

function createContactEmailData(lead: ContactLeadInput): EmailTemplateData {
  const { firstName, lastName } = splitName(lead.fullName);
  const company = lead.company?.trim();

  return {
    firstName,
    lastName,
    email: lead.email,
    ...(company ? { company } : {}),
    ...createOptionalSubject(lead.subject),
    message: lead.message,
    submittedAt: lead.submittedAt || new Date().toISOString(),
    marketingConsent: lead.marketingConsent,
  };
}

async function sendContactOwnerEmail(
  lead: ContactLeadInput,
  context: LeadProcessingContext,
): Promise<boolean> {
  const emailData = createContactEmailData(lead);

  try {
    await resendService.sendContactFormEmail(emailData);
    return true;
  } catch (error) {
    logger.error("Contact owner email failed", {
      error: normalizeErrorMessage(error),
      email: sanitizeEmail(lead.email),
      referenceId: context.referenceId,
      ...withRequestId(context.requestId),
    });
    return false;
  }
}

async function createContactLeadRecord(
  lead: ContactLeadInput,
  context: LeadProcessingContext,
): Promise<boolean> {
  const { firstName, lastName } = splitName(lead.fullName);
  const { referenceId } = context;

  try {
    await airtableService.createLead(LEAD_TYPES.CONTACT, {
      firstName,
      lastName,
      email: lead.email,
      company: lead.company,
      ...createOptionalSubject(lead.subject),
      message: lead.message,
      marketingConsent: lead.marketingConsent,
      referenceId,
      ...pickAttributionFields(lead),
    });
    return true;
  } catch (error) {
    logger.error("Contact Airtable createLead failed (non-blocking)", {
      error: normalizeErrorMessage(error),
      email: sanitizeEmail(lead.email),
      leadDeliveryPolicy: LEAD_DELIVERY_POLICY,
      referenceId,
      ...withRequestId(context.requestId),
    });
    return false;
  }
}

function scheduleContactConfirmationEmail(
  lead: ContactLeadInput,
  context: LeadProcessingContext,
): void {
  if (!CONTACT_FORM_CONFIG.features.sendConfirmationEmail) return;

  const emailData = createContactEmailData(lead);

  try {
    after(async () => {
      try {
        await resendService.sendConfirmationEmail(emailData);
      } catch (error) {
        logger.error("Confirmation email failed (non-blocking)", {
          error: normalizeErrorMessage(error),
          email: sanitizeEmail(lead.email),
          referenceId: context.referenceId,
          ...withRequestId(context.requestId),
        });
      }
    });
  } catch (error) {
    logger.error("Confirmation email scheduling failed (non-blocking)", {
      error: normalizeErrorMessage(error),
      email: sanitizeEmail(lead.email),
      referenceId: context.referenceId,
      ...withRequestId(context.requestId),
    });
  }
}

async function processContact(
  lead: ContactLeadInput,
  context: LeadProcessingContext,
): Promise<LeadResult> {
  const { referenceId } = context;

  const [emailSent, recordCreated] = await Promise.all([
    sendContactOwnerEmail(lead, context),
    createContactLeadRecord(lead, context),
  ]);

  if (!emailSent && !recordCreated) {
    return createProcessingFailureResult(referenceId);
  }

  scheduleContactConfirmationEmail(lead, context);

  return {
    success: true,
    emailSent,
    ownerNotified: emailSent,
    recordCreated,
    referenceId,
  };
}

function createProductEmailData(
  lead: ProductLeadInput,
): ProductInquiryEmailData {
  const { firstName, lastName } = splitName(lead.fullName);

  return {
    firstName,
    lastName,
    email: lead.email,
    company: lead.company,
    productName: lead.productName,
    productSlug: lead.productSlug,
    quantity: lead.quantity,
    requirements: lead.requirements,
    marketingConsent: lead.marketingConsent,
  };
}

async function sendProductOwnerEmail(
  lead: ProductLeadInput,
  context: LeadProcessingContext,
): Promise<boolean> {
  try {
    await resendService.sendProductInquiryEmail(createProductEmailData(lead));
    return true;
  } catch (error) {
    logger.error("Product owner email failed", {
      error: normalizeErrorMessage(error),
      email: sanitizeEmail(lead.email),
      referenceId: context.referenceId,
      ...withRequestId(context.requestId),
    });
    return false;
  }
}

async function createProductLeadRecord(
  lead: ProductLeadInput,
  context: LeadProcessingContext,
): Promise<boolean> {
  const { firstName, lastName } = splitName(lead.fullName);
  const { referenceId } = context;
  const message = generateProductInquiryMessage(
    lead.productName,
    lead.quantity,
    lead.requirements,
  );

  try {
    await airtableService.createLead(LEAD_TYPES.PRODUCT, {
      firstName,
      lastName,
      email: lead.email,
      company: lead.company,
      message,
      productSlug: lead.productSlug,
      productName: lead.productName,
      quantity: lead.quantity,
      requirements: lead.requirements,
      marketingConsent: lead.marketingConsent,
      referenceId,
      ...pickAttributionFields(lead),
    });
    return true;
  } catch (error) {
    logger.error("Product Airtable createLead failed (non-blocking)", {
      error: normalizeErrorMessage(error),
      email: sanitizeEmail(lead.email),
      leadDeliveryPolicy: LEAD_DELIVERY_POLICY,
      referenceId,
      ...withRequestId(context.requestId),
    });
    return false;
  }
}

async function processProduct(
  lead: ProductLeadInput,
  context: LeadProcessingContext,
): Promise<LeadResult> {
  const { referenceId } = context;
  const [emailSent, recordCreated] = await Promise.all([
    sendProductOwnerEmail(lead, context),
    createProductLeadRecord(lead, context),
  ]);

  if (!emailSent && !recordCreated) {
    return createProcessingFailureResult(referenceId);
  }

  return {
    success: true,
    emailSent,
    ownerNotified: emailSent,
    recordCreated,
    referenceId,
  };
}

async function processNewsletter(
  lead: LeadInput,
  context: LeadProcessingContext,
): Promise<LeadResult> {
  const { referenceId } = context;

  try {
    await airtableService.createLead(LEAD_TYPES.NEWSLETTER, {
      email: lead.email,
      referenceId,
    });
  } catch (error) {
    logger.error("Newsletter Airtable createLead failed", {
      error: normalizeErrorMessage(error),
      email: sanitizeEmail(lead.email),
      referenceId,
      ...withRequestId(context.requestId),
    });
    return createProcessingFailureResult(referenceId);
  }

  return {
    success: true,
    emailSent: false,
    ownerNotified: false,
    recordCreated: true,
    referenceId,
  };
}

function processValidLead(
  lead: LeadInput,
  context: LeadProcessingContext,
): Promise<LeadResult> {
  if (isContactLead(lead)) {
    return processContact(lead, context);
  }
  if (isProductLead(lead)) {
    return processProduct(lead, context);
  }
  return processNewsletter(lead, context);
}

export async function processLead(
  rawInput: unknown,
  options: ProcessLeadOptions = {},
): Promise<LeadResult> {
  const { requestId } = options;
  const validationResult = leadSchema.safeParse(rawInput);

  if (!validationResult.success) {
    logger.warn("Lead validation failed", {
      errors: validationResult.error.issues,
      ...withRequestId(requestId),
    });
    return createValidationFailureResult();
  }

  const lead = validationResult.data;
  let referenceId: string | undefined;

  try {
    referenceId = generateLeadReferenceId(lead.type);

    logger.info("Processing lead", {
      type: lead.type,
      email: sanitizeEmail(lead.email),
      leadDeliveryPolicy: LEAD_DELIVERY_POLICY,
      referenceId,
      ...withRequestId(requestId),
    });

    return await processValidLead(lead, { referenceId, requestId });
  } catch (error) {
    logger.error("Lead processing unexpected error", {
      type: lead.type,
      referenceId,
      error: normalizeErrorMessage(error),
      ...withRequestId(requestId),
    });
    return createProcessingFailureResult(referenceId);
  }
}
