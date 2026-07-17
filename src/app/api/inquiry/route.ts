/**
 * Product Inquiry API Route
 * Handles product-specific inquiries via product page drawer
 */

import "server-only";
import { NextRequest, type NextResponse } from "next/server";
import {
  createApiErrorResponse,
  createApiSuccessResponse,
} from "@/lib/api/api-response";
import {
  mapZodIssuesToValidationDetails,
  type ValidationFieldErrorKeys,
} from "@/lib/api/validation-error-details";
import { createCorsRateLimitedRoute } from "@/lib/api/cors-rate-limited-route";
import { safeParseJson } from "@/lib/api/safe-parse-json";
import { isRuntimeProduction } from "@/lib/env";
import { type RateLimitContext } from "@/lib/api/with-rate-limit";
import { processLead, type LeadResult } from "@/lib/lead-pipeline/process-lead";
import { getSuccessfulLeadReferenceId } from "@/lib/lead-pipeline/success-reference";
import { pickAttributionFields } from "@/lib/marketing/attribution-fields";
import {
  LEAD_TYPES,
  productLeadSchema,
  type ProductLeadInput,
} from "@/lib/lead-pipeline/lead-schema";
import { logger, sanitizeIP } from "@/lib/logger";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import { HTTP_BAD_REQUEST, HTTP_INTERNAL_ERROR } from "@/constants";
import {
  mapLeadTurnstileResultToResponse,
  verifyLeadTurnstile,
} from "@/lib/security/lead-turnstile";

interface ProductLeadValidationSuccess {
  success: true;
  data: ProductLeadInput;
}

interface ProductLeadValidationFailure {
  success: false;
  details: string[];
}

type ProductLeadValidationResult =
  | ProductLeadValidationSuccess
  | ProductLeadValidationFailure;

const PRODUCT_INQUIRY_FIELD_ERROR_KEYS: ValidationFieldErrorKeys = {
  fullName: "errors.fullName",
  email: "errors.email",
  company: "errors.company",
  productInquiryKind: "errors.productInquiryKind",
  catalogProductId: "errors.catalogProductId",
  buyerInterest: "errors.buyerInterest",
  quantity: "errors.quantity",
  requirements: "errors.requirements",
};

async function validateProductInquiryTurnstile(
  token: unknown,
  clientIP: string,
): Promise<NextResponse | null> {
  const verificationResult = await verifyLeadTurnstile({
    token,
    clientIP,
    routeLabel: "/api/inquiry",
    expectedAction: "product_inquiry",
  });

  const error = mapLeadTurnstileResultToResponse(verificationResult);
  return error ? createApiErrorResponse(error.errorCode, error.status) : null;
}

function validateLeadData(
  data: Record<string, unknown>,
): ProductLeadValidationResult {
  const parsed = productLeadSchema.safeParse({
    type: LEAD_TYPES.PRODUCT,
    productInquiryKind: data.productInquiryKind,
    fullName: data.fullName,
    catalogProductId: data.catalogProductId,
    buyerInterest: data.buyerInterest,
    quantity: data.quantity,
    requirements: data.requirements,
    email: data.email,
    company: data.company,
    ...pickAttributionFields(data),
  });

  if (parsed.success) {
    return {
      success: true,
      data: parsed.data,
    };
  }

  return {
    success: false,
    details: mapZodIssuesToValidationDetails(
      parsed.error.issues,
      PRODUCT_INQUIRY_FIELD_ERROR_KEYS,
    ),
  };
}

function createProductInquirySuccessResponse(
  result: LeadResult,
  clientIP: string,
  startTime: number,
) {
  if (!isRuntimeProduction()) {
    logger.info("Product inquiry submitted successfully", {
      referenceId: result.referenceId,
      ip: sanitizeIP(clientIP),
      processingTime: Date.now() - startTime,
      emailSent: result.emailSent,
      recordCreated: result.recordCreated,
    });
  }

  return createApiSuccessResponse({
    referenceId: getSuccessfulLeadReferenceId(
      result,
      "referenceId missing on successful lead result",
    ),
  });
}

function createProductInquiryFailureResponse(
  result: LeadResult,
  clientIP: string,
  startTime: number,
) {
  logger.warn("Product inquiry submission failed", {
    error: result.error,
    ip: sanitizeIP(clientIP),
    processingTime: Date.now() - startTime,
    referenceId: result.referenceId,
  });

  const isValidationError = result.error === "VALIDATION_ERROR";
  return createApiErrorResponse(
    isValidationError
      ? API_ERROR_CODES.INQUIRY_VALIDATION_FAILED
      : API_ERROR_CODES.INQUIRY_PROCESSING_ERROR,
    isValidationError ? HTTP_BAD_REQUEST : HTTP_INTERNAL_ERROR,
  );
}

/**
 * POST /api/inquiry
 * Handle product inquiry form submission
 */
async function handleInquiryPost(
  request: NextRequest,
  { clientIP }: RateLimitContext,
) {
  const parsedBody = await safeParseJson<{
    turnstileToken?: string;
    [key: string]: unknown;
  }>(request, { route: "/api/inquiry" });

  if (!parsedBody.ok) {
    return createApiErrorResponse(parsedBody.errorCode, parsedBody.statusCode);
  }

  const startTime = Date.now();

  try {
    const data = parsedBody.data ?? {};
    const leadValidation = validateLeadData(data);
    if (!leadValidation.success) {
      return createApiErrorResponse(
        API_ERROR_CODES.INQUIRY_VALIDATION_FAILED,
        HTTP_BAD_REQUEST,
        { details: leadValidation.details },
      );
    }

    const turnstileError = await validateProductInquiryTurnstile(
      data.turnstileToken,
      clientIP,
    );
    if (turnstileError) return turnstileError;

    const result = await processLead({
      ...leadValidation.data,
    });

    if (result.success) {
      return createProductInquirySuccessResponse(result, clientIP, startTime);
    }

    return createProductInquiryFailureResponse(result, clientIP, startTime);
  } catch (error) {
    logger.error("Product inquiry submission failed unexpectedly", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      ip: sanitizeIP(clientIP),
      processingTime: Date.now() - startTime,
    });

    return createApiErrorResponse(
      API_ERROR_CODES.INQUIRY_PROCESSING_ERROR,
      HTTP_INTERNAL_ERROR,
    );
  }
}

export const { POST, OPTIONS } = createCorsRateLimitedRoute(
  "inquiry",
  handleInquiryPost,
);
