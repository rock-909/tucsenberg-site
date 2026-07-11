import "server-only";

import { HTTP_BAD_REQUEST, HTTP_SERVICE_UNAVAILABLE } from "@/constants";
import {
  API_ERROR_CODES,
  type ApiErrorCode,
} from "@/constants/api-error-codes";
import { logger, sanitizeIP } from "@/lib/logger";
import { verifyTurnstileDetailed } from "@/lib/security/turnstile";
import { hasTurnstileServiceFailure } from "@/lib/security/turnstile-errors";

export type LeadTurnstileRouteLabel =
  | "/api/inquiry"
  | "/api/subscribe"
  | "contact-canonical";

export type LeadTurnstileExpectedAction =
  | "product_inquiry"
  | "newsletter_subscribe"
  | "contact_form";

export interface LeadTurnstileVerificationInput {
  token: unknown;
  clientIP: string;
  routeLabel: LeadTurnstileRouteLabel;
  expectedAction: LeadTurnstileExpectedAction;
}

export type LeadTurnstileVerificationResult =
  | { status: "missing" }
  | { status: "verified" }
  | { status: "failed"; errorCodes: readonly string[] }
  | { status: "service-unavailable"; errorCodes: readonly string[] };

function normalizeTurnstileToken(token: unknown): string | null {
  if (typeof token !== "string") {
    return null;
  }

  const trimmedToken = token.trim();
  return trimmedToken.length > 0 ? trimmedToken : null;
}

export async function verifyLeadTurnstile({
  token,
  clientIP,
  routeLabel,
  expectedAction,
}: LeadTurnstileVerificationInput): Promise<LeadTurnstileVerificationResult> {
  const normalizedToken = normalizeTurnstileToken(token);
  if (!normalizedToken) {
    logger.warn("Lead Turnstile token missing", {
      routeLabel,
      ip: sanitizeIP(clientIP),
    });
    return { status: "missing" };
  }

  const verificationResult = await verifyTurnstileDetailed(
    normalizedToken,
    clientIP,
    { expectedAction },
  );

  if (verificationResult.success) {
    return { status: "verified" };
  }

  const errorCodes = verificationResult.errorCodes ?? [];
  if (hasTurnstileServiceFailure(errorCodes)) {
    logger.error("Lead Turnstile verification unavailable", {
      routeLabel,
      ip: sanitizeIP(clientIP),
      errorCodes,
    });
    return { status: "service-unavailable", errorCodes };
  }

  logger.warn("Lead Turnstile verification failed", {
    routeLabel,
    ip: sanitizeIP(clientIP),
    errorCodes,
  });
  return { status: "failed", errorCodes };
}

export interface LeadTurnstileErrorOutcome {
  errorCode: ApiErrorCode;
  status: number;
}

/**
 * Map a Lead-family Turnstile verification result to its HTTP error outcome.
 *
 * Centralizes the status/branch decision that inquiry, subscribe, and the
 * canonical contact path previously duplicated. Returns `null` when the
 * request verified and should proceed. Callers own the response envelope
 * (route `NextResponse` vs. canonical validation object).
 */
export function mapLeadTurnstileResultToResponse(
  result: LeadTurnstileVerificationResult,
): LeadTurnstileErrorOutcome | null {
  switch (result.status) {
    case "verified":
      return null;
    case "missing":
      return {
        errorCode: API_ERROR_CODES.TURNSTILE_REQUIRED,
        status: HTTP_BAD_REQUEST,
      };
    case "service-unavailable":
      return {
        errorCode: API_ERROR_CODES.TURNSTILE_UNAVAILABLE,
        status: HTTP_SERVICE_UNAVAILABLE,
      };
    case "failed":
      return {
        errorCode: API_ERROR_CODES.TURNSTILE_REJECTED,
        status: HTTP_BAD_REQUEST,
      };
    default: {
      const exhaustiveStatus: never = result;
      return exhaustiveStatus;
    }
  }
}
