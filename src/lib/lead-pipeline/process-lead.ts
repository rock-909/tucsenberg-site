import "server-only";

import { airtableService } from "@/lib/airtable/instance";
import { AIRTABLE_REQUEST_TIMEOUT_MS } from "@/lib/airtable/service";
import type { ProductInquiryEmailData } from "@/lib/email/email-data-schema";
import {
  PRODUCT_LEAD_TYPE,
  type ProductLeadInput,
} from "@/lib/lead-pipeline/lead-schema";
import {
  composeInquiryDescription,
  generateLeadReferenceId,
  generateProductInquiryMessage,
  resolveProductBuyerText,
  splitName,
} from "@/lib/lead-pipeline/utils";
import { resolveProductIdentity } from "@/lib/lead-pipeline/product-identity";
import { logger, sanitizeEmail } from "@/lib/logger";
import { pickAttributionFields } from "@/lib/marketing/attribution-fields";
import { resendService } from "@/lib/resend-instance";

export interface ProcessInquiryOptions {
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
  error?: "PROCESSING_FAILED";
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

function createProductEmailData(
  lead: ProductLeadInput,
): ProductInquiryEmailData {
  const { firstName, lastName } = splitName(lead.fullName);
  const { productName } = resolveProductIdentity(lead);
  const buyerText = resolveProductBuyerText({ message: lead.message });
  const requirements = composeInquiryDescription({
    buyerInterest: lead.buyerInterest,
    requirements: buyerText,
  });

  return {
    firstName,
    lastName,
    email: lead.email,
    productName,
    ...(requirements ? { requirements } : {}),
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
  const buyerText = resolveProductBuyerText({ message: lead.message });
  const message = generateProductInquiryMessage({
    productName: identity.productName,
    buyerInterest: lead.buyerInterest,
    requirements: buyerText,
  });

  try {
    await withAirtableBudget(
      airtableService.createLead({
        firstName,
        lastName,
        email: lead.email,
        message,
        productName: identity.productName,
        ...(identity.catalogProductId
          ? { catalogProductId: identity.catalogProductId }
          : {}),
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

export async function processValidatedInquiry(
  input: ProductLeadInput,
  options: ProcessInquiryOptions = {},
): Promise<LeadResult> {
  const { requestId } = options;
  let referenceId: string | undefined;

  try {
    referenceId = generateLeadReferenceId(PRODUCT_LEAD_TYPE);

    logger.info("Processing lead", {
      type: PRODUCT_LEAD_TYPE,
      email: sanitizeEmail(input.email),
      leadDeliveryPolicy: LEAD_DELIVERY_POLICY,
      referenceId,
      ...withRequestId(requestId),
    });

    const [emailSent, recordCreated] = await Promise.all([
      sendProductOwnerEmail(input, { referenceId, requestId }),
      createProductLeadRecord(input, { referenceId, requestId }),
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
  } catch (error) {
    logger.error("Lead processing unexpected error", {
      type: PRODUCT_LEAD_TYPE,
      referenceId,
      error: normalizeErrorMessage(error),
      ...withRequestId(requestId),
    });
    return createProcessingFailureResult(referenceId);
  }
}
