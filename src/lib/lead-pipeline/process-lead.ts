import "server-only";

import { airtableService } from "@/lib/airtable/instance";
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

export interface LeadResult {
  success: boolean;
  emailSent: boolean;
  ownerNotified: boolean;
  recordCreated: boolean;
  referenceId?: string | undefined;
  error?: "PROCESSING_FAILED";
}

const LEAD_DELIVERY_POLICY = "email-first-storage-optional" as const;

// 业主后台的数据，不是网站访客可见文案，不走 i18n 翻译键。
const OWNER_EMAIL_FAILED_NOTICE =
  "⚠️ NOTE: the notification email for this inquiry FAILED to send.\n" +
  "You are seeing this lead only because it was saved here.\n\n";

function normalizeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
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

function createOwnerLead(lead: ProductLeadInput, referenceId: string) {
  const { firstName, lastName } = splitName(lead.fullName);
  const identity = resolveProductIdentity(lead);
  const requirements = resolveProductBuyerText({ message: lead.message });

  return {
    referenceId,
    firstName,
    lastName,
    email: lead.email,
    productName: identity.productName,
    ...(identity.catalogProductId
      ? { catalogProductId: identity.catalogProductId }
      : {}),
    ...(lead.buyerInterest ? { buyerInterest: lead.buyerInterest } : {}),
    ...(requirements ? { requirements } : {}),
    attribution: pickAttributionFields(lead),
  };
}

type OwnerLead = ReturnType<typeof createOwnerLead>;

function createProductEmailData(lead: OwnerLead): ProductInquiryEmailData {
  const requirements = composeInquiryDescription({
    buyerInterest: lead.buyerInterest,
    requirements: lead.requirements,
  });

  return {
    referenceId: lead.referenceId,
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    productName: lead.productName,
    ...(requirements ? { requirements } : {}),
  };
}

async function sendProductOwnerEmail(lead: OwnerLead): Promise<boolean> {
  try {
    await resendService.sendProductInquiryEmail(createProductEmailData(lead));
    return true;
  } catch (error) {
    logger.error("Product owner email failed", {
      error: normalizeErrorMessage(error),
      email: sanitizeEmail(lead.email),
      referenceId: lead.referenceId,
    });
    return false;
  }
}

async function createProductLeadRecord(
  lead: OwnerLead,
  emailSent: boolean,
): Promise<boolean> {
  const baseMessage = generateProductInquiryMessage({
    productName: lead.productName,
    buyerInterest: lead.buyerInterest,
    requirements: lead.requirements,
  });
  // 邮件没发出去时，业主唯一能看到这条线索的地方就是这条记录。
  // 提示写进自由文本的 Message 字段：写什么都不会被 Airtable 拒收，
  // 换成 Status 单选列的话，选项不存在会让整条记录被拒，反而丢线索。
  const message = emailSent
    ? baseMessage
    : `${OWNER_EMAIL_FAILED_NOTICE}${baseMessage}`;

  try {
    await airtableService.createLead({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      message,
      productName: lead.productName,
      ...(lead.catalogProductId
        ? { catalogProductId: lead.catalogProductId }
        : {}),
      ...(lead.requirements ? { requirements: lead.requirements } : {}),
      referenceId: lead.referenceId,
      ...lead.attribution,
    });
    return true;
  } catch (error) {
    logger.error("Product Airtable createLead failed (non-blocking)", {
      error: normalizeErrorMessage(error),
      email: sanitizeEmail(lead.email),
      leadDeliveryPolicy: LEAD_DELIVERY_POLICY,
      referenceId: lead.referenceId,
    });
    return false;
  }
}

export async function processValidatedInquiry(
  input: ProductLeadInput,
): Promise<LeadResult> {
  let referenceId: string | undefined;

  try {
    referenceId = generateLeadReferenceId(PRODUCT_LEAD_TYPE);

    logger.info("Processing lead", {
      type: PRODUCT_LEAD_TYPE,
      email: sanitizeEmail(input.email),
      leadDeliveryPolicy: LEAD_DELIVERY_POLICY,
      referenceId,
    });

    // 串行不是为了代码顺一点：邮件结果必须在记录创建之前拿到，才能把
    // 「这封通知没发出去」一次写进记录。事后补一次更新做不到——Airtable
    // 限流重试可能在预算过期后才落库，那时已经拿不到记录编号了。
    // 代价：最坏耗时从 max(5s, 8s) 变成 5s + 8s。邮件有 5 秒硬超时，不会无限等。
    const ownerLead = createOwnerLead(input, referenceId);
    const emailSent = await sendProductOwnerEmail(ownerLead);
    const recordCreated = await createProductLeadRecord(ownerLead, emailSent);

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
    });
    return createProcessingFailureResult(referenceId);
  }
}
