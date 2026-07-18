import { describe, expect, it } from "vitest";
import { getComposedMessages } from "@/lib/i18n/composed-messages";
import { createInquiryFormCopyFromMessages } from "@/components/forms/inquiry-form-copy";
import { createTestInquiryFormCopy } from "@/test/inquiry-test-messages";

describe("inquiry form copy", () => {
  it("derives shared labels from inquiry.form", () => {
    const copy = createTestInquiryFormCopy();

    expect(copy.fullName).toBe("Full name");
    expect(copy.email).toBe("Email address");
    expect(copy.message).toBe("Message");
    expect(copy.optional).toBe("optional");
    expect(copy.submit).toBe("Send inquiry");
  });

  it("reads the same namespace from composed messages", () => {
    const fromMessages = createInquiryFormCopyFromMessages(
      getComposedMessages("en"),
    );
    const fromHelper = createTestInquiryFormCopy();

    expect(fromMessages.fullName).toBe(fromHelper.fullName);
    expect(fromMessages.errors.fieldSummary).toBe(
      fromHelper.errors.fieldSummary,
    );
  });
});
