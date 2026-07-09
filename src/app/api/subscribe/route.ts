import "server-only";

import { NextRequest, type NextResponse } from "next/server";
import {
  createApiErrorResponse,
  createApiSuccessResponse,
} from "@/lib/api/api-response";
import { createCorsRateLimitedRoute } from "@/lib/api/cors-rate-limited-route";
import { isRuntimeProduction } from "@/lib/env";
import { safeParseJson } from "@/lib/api/safe-parse-json";
import { type RateLimitContext } from "@/lib/api/with-rate-limit";
import { processLead } from "@/lib/lead-pipeline/process-lead";
import { getSuccessfulLeadReferenceId } from "@/lib/lead-pipeline/success-reference";
import {
  LEAD_TYPES,
  type NewsletterLeadInput,
  newsletterLeadSchema,
} from "@/lib/lead-pipeline/lead-schema";
import { logger, sanitizeEmail } from "@/lib/logger";
import { HTTP_BAD_REQUEST, HTTP_INTERNAL_ERROR } from "@/constants";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import {
  mapLeadTurnstileResultToResponse,
  verifyLeadTurnstile,
} from "@/lib/security/lead-turnstile";
const SUBSCRIBE_EMAIL_REQUIRED_DETAILS = ["errors.email.required"];
const SUBSCRIBE_EMAIL_INVALID_DETAILS = ["errors.email.invalid"];

function createSubscribeProcessingErrorResponse(): NextResponse {
  return createApiErrorResponse(
    API_ERROR_CODES.SUBSCRIBE_PROCESSING_ERROR,
    HTTP_INTERNAL_ERROR,
  );
}

async function validateNewsletterTurnstile(
  token: unknown,
  clientIP: string,
): Promise<NextResponse | null> {
  const verificationResult = await verifyLeadTurnstile({
    token,
    clientIP,
    routeLabel: "/api/subscribe",
    expectedAction: "newsletter_subscribe",
  });

  const error = mapLeadTurnstileResultToResponse(verificationResult, {
    requiredCode: API_ERROR_CODES.SUBSCRIBE_SECURITY_REQUIRED,
    failedCode: API_ERROR_CODES.SUBSCRIBE_SECURITY_FAILED,
  });
  return error ? createApiErrorResponse(error.errorCode, error.status) : null;
}

async function createNewsletterLeadResponse(
  lead: NewsletterLeadInput,
): Promise<NextResponse> {
  try {
    const result = await processLead(lead);

    if (result.success) {
      if (!isRuntimeProduction()) {
        logger.info("Newsletter subscription successful", {
          referenceId: result.referenceId,
          email: sanitizeEmail(lead.email),
        });
      }

      return createApiSuccessResponse({
        referenceId: getSuccessfulLeadReferenceId(
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
  } catch (error) {
    logger.error("Newsletter subscription failed unexpectedly", {
      error: error instanceof Error ? error.message : "Unknown error",
      email: sanitizeEmail(lead.email),
    });

    return createSubscribeProcessingErrorResponse();
  }
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

    return createNewsletterLeadResponse(leadValidation.data);
  })();
}

export const { POST, OPTIONS } = createCorsRateLimitedRoute(
  "subscribe",
  handlePost,
);
