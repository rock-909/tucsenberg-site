interface InquiryApiSuccessResponse {
  success: true;
  data: {
    referenceId: string;
  };
}

interface InquiryApiErrorResponse {
  success: false;
  errorCode?: string;
  details?: string[];
}

type InquiryApiResponse = InquiryApiSuccessResponse | InquiryApiErrorResponse;

type InquiryParseResult =
  | { success: true; referenceId: string }
  | { failed: true };

export function parseInquiryResponse(
  ok: boolean,
  rawText: string,
): InquiryParseResult {
  let payload: unknown;
  try {
    payload = JSON.parse(rawText);
  } catch {
    return { failed: true };
  }

  if (
    ok &&
    typeof payload === "object" &&
    payload !== null &&
    (payload as InquiryApiResponse).success === true
  ) {
    const { data } = payload as InquiryApiSuccessResponse;
    if (typeof data?.referenceId === "string") {
      return { success: true, referenceId: data.referenceId };
    }
  }

  return { failed: true };
}
