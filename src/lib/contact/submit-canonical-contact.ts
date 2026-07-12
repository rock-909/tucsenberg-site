import { z, type ZodIssue } from "zod";
import {
  CONTACT_FORM_CONFIG,
  type ContactFormFieldValues,
} from "@/config/contact-form-config";
import { createContactFormSchemaFromConfig } from "@/config/contact-form-validation";
import { HTTP_INTERNAL_ERROR } from "@/constants";
import {
  API_ERROR_CODES,
  type ApiErrorCode,
} from "@/constants/api-error-codes";
import { MINUTE_MS, TEN_MINUTES_MS } from "@/constants/time";
import { contactFieldValidators } from "@/lib/form-schema/contact-field-validators";
import {
  LEAD_TYPES,
  leadAttributionFields,
} from "@/lib/lead-pipeline/lead-schema";
import { processLead } from "@/lib/lead-pipeline/process-lead";
import { createOptionalSubject } from "@/lib/lead-pipeline/utils";
import { logger, sanitizeEmail } from "@/lib/logger";
import {
  pickAttributionFields,
  type MarketingAttributionFields,
} from "@/lib/marketing/attribution-fields";
import {
  mapLeadTurnstileResultToResponse,
  verifyLeadTurnstile,
} from "@/lib/security/lead-turnstile";

const contactFormSchema = createContactFormSchemaFromConfig(
  CONTACT_FORM_CONFIG,
  contactFieldValidators,
);

const FIELD_ERROR_KEY_PREFIX = new Map<string, string>([
  ["fullName", "errors.fullName"],
  ["email", "errors.email"],
  ["company", "errors.company"],
  ["message", "errors.message"],
  ["phone", "errors.phone"],
  ["subject", "errors.subject"],
  ["website", "errors.website"],
]);

const FALLBACK_ERROR_KEY = "errors.generic";
const CLIENT_CLOCK_SKEW_ALLOWANCE_MS = 2 * MINUTE_MS;

const contactSubmissionSchema = contactFormSchema.extend({
  turnstileToken: z.string().min(1, "Security verification required"),
  submittedAt: z
    .string()
    .optional()
    .transform((value) => value ?? ""),
  ...leadAttributionFields,
});

export type ContactFormWithToken = ContactFormFieldValues & {
  turnstileToken: string;
  submittedAt: string;
} & MarketingAttributionFields;

interface ContactValidationFailure {
  success: false;
  errorCode: ApiErrorCode;
  error: string;
  details: string[] | null;
  data: null;
  statusCode?: number;
}

interface ContactValidationSuccess {
  success: true;
  error: null;
  details: null;
  data: ContactFormWithToken;
}

export type ContactValidationResult =
  | ContactValidationFailure
  | ContactValidationSuccess;

export interface CanonicalContactSubmissionOptions {
  clientIP: string;
  requestId?: string;
}

export interface CanonicalContactSubmissionFailure {
  success: false;
  errorCode: ApiErrorCode;
  error: string;
  details: string[] | null;
  data: null;
  statusCode?: number;
}

export interface CanonicalContactSubmissionSuccess {
  success: true;
  error: null;
  details: null;
  data: ContactFormWithToken;
  submissionResult: {
    success: true;
    emailSent: boolean;
    ownerNotified: boolean;
    recordCreated: boolean;
    referenceId?: string | null | undefined;
  };
}

export type CanonicalContactSubmissionResult =
  | CanonicalContactSubmissionFailure
  | CanonicalContactSubmissionSuccess;

interface ProcessValidatedContactSubmissionOptions {
  requestId?: string;
}

type ProcessedContactSubmissionResult =
  CanonicalContactSubmissionSuccess["submissionResult"];

function isCanonicalContactFailure(
  result: ProcessedContactSubmissionResult | CanonicalContactSubmissionFailure,
): result is CanonicalContactSubmissionFailure {
  return result.success === false;
}

function getBaseErrorKey(issue: ZodIssue): string {
  const [rawField] = issue.path;
  if (typeof rawField !== "string") {
    return FALLBACK_ERROR_KEY;
  }

  return FIELD_ERROR_KEY_PREFIX.get(rawField) ?? FALLBACK_ERROR_KEY;
}

function isRequiredMinimum(issue: ZodIssue): boolean {
  return (
    "minimum" in issue &&
    typeof issue.minimum === "number" &&
    issue.minimum <= 1
  );
}

function isMissingRequiredInvalidType(issue: ZodIssue): boolean {
  return (
    issue.code === "invalid_type" &&
    (issue.input === undefined ||
      issue.message.toLowerCase().includes("received undefined"))
  );
}

function handleCustomIssue(baseKey: string, issue: ZodIssue): string {
  const message = issue.message?.toLowerCase?.() ?? "";

  if (baseKey === "errors.subject") {
    return `${baseKey}.length`;
  }

  if (baseKey === "errors.phone") {
    return `${baseKey}.invalid`;
  }

  if (baseKey === "errors.email" && message.includes("domain")) {
    return `${baseKey}.domainNotAllowed`;
  }

  return baseKey === FALLBACK_ERROR_KEY
    ? FALLBACK_ERROR_KEY
    : `${baseKey}.invalid`;
}

function mapZodIssueToErrorKey(issue: ZodIssue): string {
  const baseKey = getBaseErrorKey(issue);
  const message = issue.message?.toLowerCase?.() ?? "";

  if (message.includes("required")) {
    return `${baseKey}.required`;
  }

  switch (issue.code) {
    case "too_small":
      return isRequiredMinimum(issue)
        ? `${baseKey}.required`
        : `${baseKey}.tooShort`;
    case "too_big":
      return baseKey === "errors.website"
        ? `${baseKey}.shouldBeEmpty`
        : `${baseKey}.tooLong`;
    case "custom":
      return handleCustomIssue(baseKey, issue);
    case "invalid_type":
      return isMissingRequiredInvalidType(issue)
        ? `${baseKey}.required`
        : `${baseKey}.invalid`;
    default:
      return handleCustomIssue(baseKey, issue);
  }
}

function createExpiredSubmissionFailure(): ContactValidationFailure {
  return {
    success: false,
    errorCode: API_ERROR_CODES.CONTACT_SUBMISSION_EXPIRED,
    error: "Form submission expired or invalid",
    details: null,
    data: null,
  };
}

function validateSubmissionTime(
  submittedAt: string,
): ContactValidationFailure | null {
  const submittedAtMs = new Date(submittedAt).getTime();
  if (!submittedAt || Number.isNaN(submittedAtMs)) {
    return createExpiredSubmissionFailure();
  }

  const timeDiff = Date.now() - submittedAtMs;
  if (timeDiff > TEN_MINUTES_MS || timeDiff < -CLIENT_CLOCK_SKEW_ALLOWANCE_MS) {
    return createExpiredSubmissionFailure();
  }

  return null;
}

export function validateContactSubmissionPayload(
  body: unknown,
): ContactValidationResult {
  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as { turnstileToken?: unknown }).turnstileToken !== "string" ||
    (body as { turnstileToken: string }).turnstileToken.trim().length === 0
  ) {
    return {
      success: false,
      errorCode: API_ERROR_CODES.TURNSTILE_REQUIRED,
      error: "Security verification required",
      details: null,
      data: null,
    };
  }

  const validationResult = contactSubmissionSchema.safeParse(body);

  if (!validationResult.success) {
    return {
      success: false,
      errorCode: API_ERROR_CODES.CONTACT_VALIDATION_FAILED,
      error: "Validation failed",
      details: validationResult.error.issues.map(mapZodIssueToErrorKey),
      data: null,
    };
  }

  const formData: ContactFormWithToken = validationResult.data;
  const timeValidationError = validateSubmissionTime(formData.submittedAt);
  if (timeValidationError) {
    return timeValidationError;
  }

  return {
    success: true,
    error: null,
    details: null,
    data: formData,
  };
}

export async function validateContactSubmission(
  body: unknown,
  clientIP: string,
): Promise<ContactValidationResult> {
  const payloadValidation = validateContactSubmissionPayload(body);
  if (!payloadValidation.success || !payloadValidation.data) {
    return payloadValidation;
  }

  const formData = payloadValidation.data;

  const verificationResult = await verifyLeadTurnstile({
    token: formData.turnstileToken,
    clientIP,
    routeLabel: "contact-canonical",
    expectedAction: "contact_form",
  });

  const turnstileError = mapLeadTurnstileResultToResponse(verificationResult);

  if (!turnstileError) {
    return {
      success: true,
      error: null,
      details: null,
      data: formData,
    };
  }

  return {
    success: false,
    errorCode: turnstileError.errorCode,
    error: "Security verification failed",
    details: null,
    data: null,
    statusCode: turnstileError.status,
  };
}

async function processValidatedContactSubmission(
  formData: ContactFormWithToken,
  options: ProcessValidatedContactSubmissionOptions = {},
): Promise<
  ProcessedContactSubmissionResult | CanonicalContactSubmissionFailure
> {
  const leadInput = {
    type: LEAD_TYPES.CONTACT,
    fullName: formData.fullName || "Unknown",
    email: formData.email,
    company: formData.company,
    ...createOptionalSubject(formData.subject),
    message: formData.message,
    turnstileToken: formData.turnstileToken,
    submittedAt: formData.submittedAt,
    ...pickAttributionFields(formData),
  };

  const result = await processLead(leadInput, {
    ...(options.requestId ? { requestId: options.requestId } : {}),
  });

  if (result.success) {
    return {
      success: true,
      emailSent: result.emailSent,
      ownerNotified: result.ownerNotified,
      recordCreated: result.recordCreated,
      referenceId: result.referenceId,
    };
  }

  logger.error("Contact form submission failed via processLead", {
    error: result.error,
    email: sanitizeEmail(formData.email),
    ...(options.requestId ? { requestId: options.requestId } : {}),
  });

  return {
    success: false,
    errorCode: API_ERROR_CODES.CONTACT_PROCESSING_ERROR,
    error: "Failed to process contact submission",
    details: null,
    data: null,
    statusCode: HTTP_INTERNAL_ERROR,
  };
}

/**
 * Canonical contact submission core.
 *
 * Adapter layers keep ownership of request parsing, rate limiting, and
 * observability. Validation, Turnstile verification, and lead submission live
 * here so Server Action and API route converge on one business path.
 */
export async function submitCanonicalContactSubmission(
  body: unknown,
  options: CanonicalContactSubmissionOptions,
): Promise<CanonicalContactSubmissionResult> {
  const validation = await validateContactSubmission(body, options.clientIP);
  if (!validation.success || !validation.data) {
    return {
      success: false,
      errorCode: validation.errorCode,
      error: validation.error,
      details: validation.details,
      data: null,
      ...(validation.statusCode ? { statusCode: validation.statusCode } : {}),
    };
  }

  const submissionResult = await processValidatedContactSubmission(
    validation.data,
    {
      ...(options.requestId ? { requestId: options.requestId } : {}),
    },
  );

  if (isCanonicalContactFailure(submissionResult)) {
    return submissionResult;
  }

  return {
    success: true,
    error: null,
    details: null,
    data: validation.data,
    submissionResult,
  };
}
