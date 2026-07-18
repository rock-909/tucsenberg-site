import { describe, expect, it } from "vitest";
import { MAX_LEAD_REQUIREMENTS_LENGTH } from "@/constants/validation-limits";
import { adaptLegacyInquiryPayload } from "@/lib/lead-pipeline/inquiry-payload-adapter";

describe("adaptLegacyInquiryPayload", () => {
  it("maps requirements to message when message is missing", () => {
    const adapted = adaptLegacyInquiryPayload({
      requirements: "Legacy RFQ note",
    });

    expect(adapted.message).toBe("Legacy RFQ note");
    expect(adapted.requirements).toBeUndefined();
  });

  it("keeps canonical message and drops legacy requirements for validation", () => {
    const adapted = adaptLegacyInquiryPayload({
      message: "Canonical buyer text",
      requirements: "Conflicting legacy note",
    });

    expect(adapted.message).toBe("Canonical buyer text");
    expect(adapted.requirements).toBeUndefined();
  });

  it("does not let oversized legacy requirements veto a valid canonical message", () => {
    const adapted = adaptLegacyInquiryPayload({
      message: "Short canonical note",
      requirements: "X".repeat(MAX_LEAD_REQUIREMENTS_LENGTH + 1),
    });

    expect(adapted.message).toBe("Short canonical note");
    expect(adapted.requirements).toBeUndefined();
  });

  it("does not promote phone from legacy payloads", () => {
    const adapted = adaptLegacyInquiryPayload({
      phone: "+8613800138000",
      message: "Buyer note",
    });

    expect(adapted).not.toHaveProperty("phone");
    expect(adapted.message).toBe("Buyer note");
  });
});
