import "server-only";

import { NextRequest, type NextResponse } from "next/server";
import {
  createApiErrorResponse,
  createApiSuccessResponse,
} from "@/lib/api/api-response";
import {
  applyCorsHeaders,
  createCorsPreflightResponse,
} from "@/lib/api/cors-utils";
import { isRuntimeProduction } from "@/lib/env";
import { safeParseJson } from "@/lib/api/safe-parse-json";
import {
  withRateLimit,
  type RateLimitContext,
} from "@/lib/api/with-rate-limit";
import { processLead, type LeadResult } from "@/lib/lead-pipeline/process-lead";
import {
  LEAD_TYPES,
  newsletterLeadSchema,
} from "@/lib/lead-pipeline/lead-schema";
import { logger, sanitizeEmail, sanitizeIP } from "@/lib/logger";
import {
  HTTP_BAD_REQUEST,
  HTTP_INTERNAL_ERROR,
  HTTP_SERVICE_UNAVAILABLE,
} from "@/constants";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import { verifyTurnstileDetailed } from "@/lib/security/turnstile";

const TURNSTILE_SERVICE_FAILURE_CODES = new Set([
  "not-configured",
  "network-error",
  "timeout",
]);
const SUBSCRIBE_EMAIL_REQUIRED_DETAILS = ["errors.email.required"];
const SUBSCRIBE_EMAIL_INVALID_DETAILS = ["errors.email.invalid"];

function getSuccessfulReferenceId(
  result: LeadResult,
  message = "referenceId missing on successful lead result",
): string {
  if (!result.referenceId) {
    throw new Error(message);
  }

  return result.referenceId;
}

async function validateNewsletterTurnstile(
  token: string | undefined,
  clientIP: string,
): Promise<NextResponse | null> {
  if (!token) {
    logger.warn("Newsletter subscription missing Turnstile token", {
      ip: sanitizeIP(clientIP),
    });
    return createApiErrorResponse(
      API_ERROR_CODES.SUBSCRIBE_SECURITY_REQUIRED,
      HTTP_BAD_REQUEST,
    );
  }

  const verificationResult = await verifyTurnstileDetailed(token, clientIP, {
    expectedAction: "newsletter_subscribe",
  });

  if (verificationResult.success) {
    return null;
  }

  const errorCodes = verificationResult.errorCodes ?? [];
  const isServiceFailure = errorCodes.some((code) =>
    TURNSTILE_SERVICE_FAILURE_CODES.has(code),
  );

  if (isServiceFailure) {
    logger.error("Lead Turnstile verification unavailable", {
      ip: sanitizeIP(clientIP),
      errorCodes,
    });
    return createApiErrorResponse(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      HTTP_SERVICE_UNAVAILABLE,
    );
  }

  logger.warn("Newsletter Turnstile verification failed", {
    ip: sanitizeIP(clientIP),
    errorCodes,
  });
  return createApiErrorResponse(
    API_ERROR_CODES.SUBSCRIBE_SECURITY_FAILED,
    HTTP_BAD_REQUEST,
  );
}

/**
 * Handle subscription form submission
 */
function handlePost(
  request: NextRequest,
  { clientIP }: RateLimitContext,
): Promise<NextResponse> {
  return (async () => {
    const parsedBody = await safeParseJson<{
      email?: unknown;
      pageType?: string;
      turnstileToken?: string;
    }>(request, { route: "/api/subscribe" });

    if (!parsedBody.ok) {
      return createApiErrorResponse(
        parsedBody.errorCode,
        parsedBody.statusCode,
      );
    }

    const email = parsedBody.data?.email;
    const turnstileToken = parsedBody.data?.turnstileToken;

    if (email === undefined || email === "") {
      return createApiErrorResponse(
        API_ERROR_CODES.SUBSCRIBE_VALIDATION_EMAIL_REQUIRED,
        HTTP_BAD_REQUEST,
        { details: SUBSCRIBE_EMAIL_REQUIRED_DETAILS },
      );
    }

    const leadValidation = newsletterLeadSchema.safeParse({
      type: LEAD_TYPES.NEWSLETTER,
      email,
    });
    if (!leadValidation.success) {
      return createApiErrorResponse(
        API_ERROR_CODES.SUBSCRIBE_VALIDATION_EMAIL_INVALID,
        HTTP_BAD_REQUEST,
        { details: SUBSCRIBE_EMAIL_INVALID_DETAILS },
      );
    }

    const turnstileError = await validateNewsletterTurnstile(
      turnstileToken,
      clientIP,
    );
    if (turnstileError) return turnstileError;

    // Process via unified Lead Pipeline
    const result = await processLead(leadValidation.data);

    if (result.success) {
      if (!isRuntimeProduction()) {
        logger.info("Newsletter subscription successful", {
          referenceId: result.referenceId,
          email: sanitizeEmail(leadValidation.data.email),
        });
      }

      return createApiSuccessResponse({
        referenceId: getSuccessfulReferenceId(
          result,
          "referenceId missing on successful lead result",
        ),
      });
    }

    logger.warn("Newsletter subscription failed", {
      error: result.error,
      referenceId: result.referenceId,
    });

    const isValidationError = result.error === "VALIDATION_ERROR";
    return createApiErrorResponse(
      isValidationError
        ? API_ERROR_CODES.SUBSCRIBE_VALIDATION_EMAIL_INVALID
        : API_ERROR_CODES.SUBSCRIBE_PROCESSING_ERROR,
      isValidationError ? HTTP_BAD_REQUEST : HTTP_INTERNAL_ERROR,
    );
  })();
}

const POST_RATE_LIMITED = withRateLimit("subscribe", handlePost);

export async function POST(request: NextRequest) {
  const response = await POST_RATE_LIMITED(request);
  return applyCorsHeaders({ request, response });
}

// 处理 OPTIONS 请求 (CORS)
export function OPTIONS(request: NextRequest) {
  return createCorsPreflightResponse(request);
}
