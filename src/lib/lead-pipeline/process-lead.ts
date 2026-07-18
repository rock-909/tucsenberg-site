import "server-only";

import { after } from "next/server";

import { CONTACT_FORM_CONFIG } from "@/config/contact-form-config";
import { airtableService } from "@/lib/airtable/instance";
import { AIRTABLE_REQUEST_TIMEOUT_MS } from "@/lib/airtable/service";
import type {
  EmailTemplateData,
  ProductInquiryEmailData,
} from "@/lib/email/email-data-schema";
import {
  isContactLead,
  LEAD_TYPES,
  leadSchema,
  type ContactLeadInput,
  type LeadInput,
  type ProductLeadInput,
} from "@/lib/lead-pipeline/lead-schema";
import {
  composeInquiryDescription,
  createOptionalSubject,
  generateLeadReferenceId,
  generateProductInquiryMessage,
  resolveProductBuyerText,
  splitName,
} from "@/lib/lead-pipeline/utils";
import { resolveProductIdentity } from "@/lib/lead-pipeline/product-identity";
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

/**
 * 给 Airtable 写入套一个请求预算，避免 CRM 挂起把买家响应拖住数分钟。
 *
 * SDK 层已配置 `requestTimeout`（见 service.ts），但那只覆盖真实 fetch；
 * 这里的进程内预算是买家可感知的硬上限：超时即 reject，交给各渠道既有的
 * try/catch 收敛——contact/inquiry 降级为“未入库、非阻塞”。
 */
function withAirtableBudget<T>(operation: Promise<T>): Promise<T> {
  let budgetTimer: ReturnType<typeof setTimeout> | undefined;
  const budget = new Promise<never>((_resolve, reject) => {
    budgetTimer = setTimeout(() => {
      reject(new Error("AIRTABLE_REQUEST_TIMEOUT"));
    }, AIRTABLE_REQUEST_TIMEOUT_MS);
  });
  return Promise.race([operation, budget]).finally(() => {
    clearTimeout(budgetTimer);
  });
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
    await withAirtableBudget(
      airtableService.createLead(LEAD_TYPES.CONTACT, {
        firstName,
        lastName,
        email: lead.email,
        ...(lead.company ? { company: lead.company } : {}),
        ...createOptionalSubject(lead.subject),
        message: lead.message,
        referenceId,
        ...pickAttributionFields(lead),
      }),
    );
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
  const { productName } = resolveProductIdentity(lead);
  const buyerText = resolveProductBuyerText(lead);
  const description = composeInquiryDescription({
    buyerInterest: lead.buyerInterest,
    requirements: buyerText,
  });

  return {
    firstName,
    lastName,
    email: lead.email,
    company: lead.company,
    productName,
    quantity: lead.quantity,
    requirements: description,
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
  const identity = resolveProductIdentity(lead);
  const buyerText = resolveProductBuyerText(lead);
  const message = generateProductInquiryMessage({
    productName: identity.productName,
    quantity: lead.quantity,
    buyerInterest: lead.buyerInterest,
    requirements: buyerText,
  });

  try {
    await withAirtableBudget(
      airtableService.createLead(LEAD_TYPES.PRODUCT, {
        firstName,
        lastName,
        email: lead.email,
        ...(lead.company ? { company: lead.company } : {}),
        message,
        productName: identity.productName,
        ...(identity.catalogProductId
          ? { catalogProductId: identity.catalogProductId }
          : {}),
        ...(lead.quantity !== undefined ? { quantity: lead.quantity } : {}),
        ...(buyerText ? { requirements: buyerText } : {}),
        referenceId,
        ...pickAttributionFields(lead),
      }),
    );
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

function processValidLead(
  lead: LeadInput,
  context: LeadProcessingContext,
): Promise<LeadResult> {
  if (isContactLead(lead)) {
    return processContact(lead, context);
  }
  return processProduct(lead, context);
}

async function deliverValidatedLead(
  lead: LeadInput,
  options: ProcessLeadOptions = {},
): Promise<LeadResult> {
  const { requestId } = options;
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

export function processValidatedInquiry(
  input: ProductLeadInput,
  options: ProcessLeadOptions = {},
): Promise<LeadResult> {
  return deliverValidatedLead(input, options);
}

export function processLead(
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
    return Promise.resolve(createValidationFailureResult());
  }

  return deliverValidatedLead(validationResult.data, options);
}
