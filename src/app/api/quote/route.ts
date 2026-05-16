/**
 * RFQ Quote API Route
 *
 * Public `/quote` page submission. Validates the rich RFQ input with
 * `rfqLeadSchema`, runs the standard browser anti-abuse chain (rate limit +
 * Turnstile), then composes a product-inquiry lead so RFQs flow through the
 * audited `processLead` pipeline (Airtable-first, then owner email). This
 * reuses the proven lead path without expanding the Airtable/email service
 * contract; a dedicated RFQ Airtable type can be introduced later by ops.
 *
 * File uploads are client-side only for now: this endpoint accepts JSON, so
 * uploaded file name/size metadata arrives inside `notes`.
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
import {
  applyCorsHeaders,
  createCorsPreflightResponse,
} from "@/lib/api/cors-utils";
import { safeParseJson } from "@/lib/api/safe-parse-json";
import { isRuntimeProduction } from "@/lib/env";
import {
  withRateLimit,
  type RateLimitContext,
} from "@/lib/api/with-rate-limit";
import { processLead, type LeadResult } from "@/lib/lead-pipeline/process-lead";
import {
  LEAD_TYPES,
  rfqLeadSchema,
  type RfqLeadInput,
} from "@/lib/lead-pipeline/lead-schema";
import { logger, sanitizeIP } from "@/lib/logger";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import {
  HTTP_BAD_REQUEST,
  HTTP_INTERNAL_ERROR,
  HTTP_SERVICE_UNAVAILABLE,
  MAX_LEAD_REQUIREMENTS_LENGTH,
} from "@/constants";
import { verifyTurnstileDetailed } from "@/lib/security/turnstile";

const TURNSTILE_SERVICE_FAILURE_CODES = new Set([
  "not-configured",
  "network-error",
  "timeout",
]);

const RFQ_PRODUCT_SLUG = "rfq-quote-request";
// Fixed, non-sensitive product label. Buyer part numbers / OEM models are
// sensitive commercial info: they must reach Airtable + the owner email body
// (via `requirements`) but must NEVER ride `productName`, which the shared
// email service writes into centralized error logs on Resend failure.
const RFQ_PRODUCT_NAME = "RFQ quote request";
const RFQ_QUANTITY_FALLBACK = "Not specified";

const RFQ_FIELD_ERROR_KEYS: ValidationFieldErrorKeys = {
  fullName: "errors.fullName",
  email: "errors.email",
  company: "errors.company",
  partNumbers: "errors.productName",
  quantity: "errors.quantity",
  notes: "errors.requirements",
};

interface RfqValidationSuccess {
  success: true;
  data: RfqLeadInput;
}

interface RfqValidationFailure {
  success: false;
  details: string[];
}

type RfqValidationResult = RfqValidationSuccess | RfqValidationFailure;

function getSuccessfulReferenceId(result: LeadResult): string {
  if (!result.referenceId) {
    throw new Error("referenceId missing on successful lead result");
  }
  return result.referenceId;
}

function validateRfqData(data: Record<string, unknown>): RfqValidationResult {
  const parsed = rfqLeadSchema.safeParse({
    type: LEAD_TYPES.RFQ,
    fullName: data.fullName,
    email: data.email,
    company: data.company,
    country: data.country,
    partNumbers: data.partNumbers,
    quantity: data.quantity,
    material: data.material,
    shutdownDate: data.shutdownDate,
    notes: data.notes,
    sourceBrand: data.sourceBrand,
    sourceModel: data.sourceModel,
    sourceProduct: data.sourceProduct,
    marketingConsent: data.marketingConsent,
  });

  if (parsed.success) {
    return { success: true, data: parsed.data };
  }

  return {
    success: false,
    details: mapZodIssuesToValidationDetails(
      parsed.error.issues,
      RFQ_FIELD_ERROR_KEYS,
    ),
  };
}

/**
 * Compose the rich RFQ into a product-inquiry lead so it rides the audited
 * `processLead` path. The full RFQ context is preserved in `requirements`.
 */
function composeProductLead(rfq: RfqLeadInput) {
  const requirementLines = [
    `Part number(s) / OEM model: ${rfq.partNumbers}`,
    rfq.material ? `Preferred material: ${rfq.material}` : undefined,
    rfq.country ? `Country: ${rfq.country}` : undefined,
    rfq.shutdownDate ? `Shutdown / urgency: ${rfq.shutdownDate}` : undefined,
    rfq.sourceBrand ? `Source brand: ${rfq.sourceBrand}` : undefined,
    rfq.sourceModel ? `Source model: ${rfq.sourceModel}` : undefined,
    rfq.sourceProduct ? `Source product: ${rfq.sourceProduct}` : undefined,
    rfq.notes ? `Notes: ${rfq.notes}` : undefined,
  ].filter((line): line is string => line !== undefined);

  // Part numbers stay only in `requirements` (and thus Airtable + the email
  // body); `productName` is a fixed label so raw buyer part numbers never
  // reach the Resend-failure error log.
  const productName = RFQ_PRODUCT_NAME;

  // Individually valid RFQ fields (partNumbers ≤500, notes ≤2000, plus label
  // lines) can compose past the product lead `requirements` cap. `processLead`
  // re-validates the composed lead via `productLeadSchema`, so an uncapped
  // join would be silently dropped as VALIDATION_ERROR. Cap the final block
  // here, mirroring how `productName` is bounded above.
  const requirements = requirementLines
    .join("\n")
    .slice(0, MAX_LEAD_REQUIREMENTS_LENGTH);

  return {
    type: LEAD_TYPES.PRODUCT,
    fullName: rfq.fullName,
    email: rfq.email,
    company: rfq.company,
    productSlug: RFQ_PRODUCT_SLUG,
    productName,
    quantity: rfq.quantity?.trim() || RFQ_QUANTITY_FALLBACK,
    requirements,
    marketingConsent: rfq.marketingConsent,
  };
}

async function validateRfqTurnstile(
  token: string | undefined,
  clientIP: string,
): Promise<NextResponse | null> {
  if (!token) {
    logger.warn("RFQ quote missing Turnstile token", {
      ip: sanitizeIP(clientIP),
    });
    return createApiErrorResponse(
      API_ERROR_CODES.INQUIRY_SECURITY_REQUIRED,
      HTTP_BAD_REQUEST,
    );
  }

  const verificationResult = await verifyTurnstileDetailed(token, clientIP, {
    expectedAction: "rfq_quote",
  });

  if (verificationResult.success) {
    return null;
  }

  const errorCodes = verificationResult.errorCodes ?? [];
  const isServiceFailure = errorCodes.some((code) =>
    TURNSTILE_SERVICE_FAILURE_CODES.has(code),
  );

  if (isServiceFailure) {
    logger.error("RFQ Turnstile verification unavailable", {
      ip: sanitizeIP(clientIP),
      errorCodes,
    });
    return createApiErrorResponse(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      HTTP_SERVICE_UNAVAILABLE,
    );
  }

  logger.warn("RFQ quote Turnstile verification failed", {
    ip: sanitizeIP(clientIP),
    errorCodes,
  });
  return createApiErrorResponse(
    API_ERROR_CODES.INQUIRY_SECURITY_FAILED,
    HTTP_BAD_REQUEST,
  );
}

function createRfqSuccessResponse(
  result: LeadResult,
  clientIP: string,
  startTime: number,
) {
  // Per security.md the lead contract is: Airtable record created = success;
  // owner-email failure is internal-only and NOT a user-facing failure. We
  // keep that contract intact, but a recorded RFQ whose owner notification did
  // not send must not vanish silently — emit a structured warning so degraded
  // notifications are observable and RFQs cannot pile up unnoticed.
  if (result.emailSent === false || result.ownerNotified === false) {
    logger.warn("RFQ recorded but owner notification did not send", {
      referenceId: result.referenceId,
      ip: sanitizeIP(clientIP),
      emailSent: result.emailSent,
      ownerNotified: result.ownerNotified,
      processingTime: Date.now() - startTime,
    });
  }

  if (!isRuntimeProduction()) {
    logger.info("RFQ quote submitted successfully", {
      referenceId: result.referenceId,
      ip: sanitizeIP(clientIP),
      processingTime: Date.now() - startTime,
      emailSent: result.emailSent,
      recordCreated: result.recordCreated,
    });
  }

  return createApiSuccessResponse({
    referenceId: getSuccessfulReferenceId(result),
  });
}

function createRfqFailureResponse(
  result: LeadResult,
  clientIP: string,
  startTime: number,
) {
  logger.warn("RFQ quote submission failed", {
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

const POST_RATE_LIMITED = withRateLimit(
  "quote",
  async (request: NextRequest, { clientIP }: RateLimitContext) => {
    const parsedBody = await safeParseJson<{
      turnstileToken?: string;
      [key: string]: unknown;
    }>(request, { route: "/api/quote" });

    if (!parsedBody.ok) {
      return createApiErrorResponse(
        parsedBody.errorCode,
        parsedBody.statusCode,
      );
    }

    const startTime = Date.now();

    try {
      const data = parsedBody.data ?? {};
      const rfqValidation = validateRfqData(data);
      if (!rfqValidation.success) {
        return createApiErrorResponse(
          API_ERROR_CODES.INQUIRY_VALIDATION_FAILED,
          HTTP_BAD_REQUEST,
          { details: rfqValidation.details },
        );
      }

      const turnstileError = await validateRfqTurnstile(
        typeof data.turnstileToken === "string"
          ? data.turnstileToken
          : undefined,
        clientIP,
      );
      if (turnstileError) return turnstileError;

      const result = await processLead(composeProductLead(rfqValidation.data));

      if (result.success) {
        return createRfqSuccessResponse(result, clientIP, startTime);
      }

      return createRfqFailureResponse(result, clientIP, startTime);
    } catch (error) {
      logger.error("RFQ quote submission failed unexpectedly", {
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
  },
);

export async function POST(request: NextRequest) {
  const response = await POST_RATE_LIMITED(request);
  return applyCorsHeaders({ request, response });
}

export function OPTIONS(request: NextRequest) {
  return createCorsPreflightResponse(request);
}
