import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createApiErrorResponse } from "@/lib/api/api-response";
import {
  applyCorsHeaders,
  createCorsPreflightResponse,
} from "@/lib/api/cors-utils";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import { HTTP_GONE } from "@/constants";

export function POST(request: NextRequest): NextResponse {
  return applyCorsHeaders({
    request,
    response: createApiErrorResponse(
      API_ERROR_CODES.CONTACT_ENDPOINT_RETIRED,
      HTTP_GONE,
    ),
  });
}

export function OPTIONS(request: NextRequest): NextResponse {
  return createCorsPreflightResponse(request);
}
