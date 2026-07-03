import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  createApiErrorResponse,
  createApiSuccessResponse,
} from "@/lib/api/api-response";
import {
  applyCorsHeaders,
  createCorsPreflightResponse,
} from "@/lib/api/cors-utils";
import { safeParseJson } from "@/lib/api/safe-parse-json";
import {
  withRateLimit,
  type RateLimitContext,
} from "@/lib/api/with-rate-limit";
import {
  submitCanonicalContactSubmission,
  validateContactSubmissionPayload,
} from "@/lib/contact/submit-canonical-contact";
import { logger, sanitizeIP } from "@/lib/logger";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import { HTTP_BAD_REQUEST, HTTP_INTERNAL_ERROR } from "@/constants";

function createValidationDetailOptions(
  details: string[] | null,
): { details: string[] } | undefined {
  return details && details.length > 0 ? { details } : undefined;
}

async function handleContactPost(
  request: NextRequest,
  { clientIP }: RateLimitContext,
): Promise<NextResponse> {
  const parsedBody = await safeParseJson<Record<string, unknown>>(request, {
    route: "/api/contact",
  });

  if (!parsedBody.ok) {
    return createApiErrorResponse(parsedBody.errorCode, parsedBody.statusCode);
  }

  const payloadValidation = validateContactSubmissionPayload(parsedBody.data);
  if (!payloadValidation.success) {
    return createApiErrorResponse(
      payloadValidation.errorCode,
      payloadValidation.statusCode ?? HTTP_BAD_REQUEST,
      createValidationDetailOptions(payloadValidation.details),
    );
  }

  try {
    const submission = await submitCanonicalContactSubmission(parsedBody.data, {
      clientIP,
    });

    if (!submission.success) {
      return createApiErrorResponse(
        submission.errorCode,
        submission.statusCode ?? HTTP_BAD_REQUEST,
        createValidationDetailOptions(submission.details),
      );
    }

    const { referenceId } = submission.submissionResult;
    if (!referenceId) {
      throw new Error("referenceId missing on successful contact submission");
    }

    return createApiSuccessResponse({ referenceId });
  } catch (error) {
    logger.error("Contact route submission failed unexpectedly", {
      error: error instanceof Error ? error.message : "Unknown error",
      ip: sanitizeIP(clientIP),
    });

    return createApiErrorResponse(
      API_ERROR_CODES.CONTACT_PROCESSING_ERROR,
      HTTP_INTERNAL_ERROR,
    );
  }
}

const POST_RATE_LIMITED = withRateLimit("contact", handleContactPost);

export async function POST(request: NextRequest) {
  const response = await POST_RATE_LIMITED(request);
  return applyCorsHeaders({ request, response });
}

export function OPTIONS(request: NextRequest) {
  return createCorsPreflightResponse(request);
}
