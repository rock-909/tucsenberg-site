import { readLeadReferenceId } from "@/lib/forms/lead-response";

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

  const referenceId = readLeadReferenceId(ok, payload);
  if (referenceId !== null) {
    return { success: true, referenceId };
  }

  return { failed: true };
}
