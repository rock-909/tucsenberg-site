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

  it("reads all eight field error leaves from inquiry.form.errors", () => {
    const copy = createTestInquiryFormCopy();

    expect(copy.errors.fullName.required).toBe("Full name is required");
    expect(copy.errors.fullName.invalid).toBe(
      "Full name contains invalid characters",
    );
    expect(copy.errors.fullName.tooLong).toBe(
      "Full name must be less than 50 characters",
    );
    expect(copy.errors.email.required).toBe("Email address is required");
    expect(copy.errors.email.invalid).toBe(
      "Please enter a valid email address",
    );
    expect(copy.errors.email.tooLong).toBe(
      "Email must be less than 100 characters",
    );
    expect(copy.errors.message.invalid).toBe(
      "Message contains invalid characters",
    );
    expect(copy.errors.message.tooLong).toBe(
      "Message must be 2000 characters or fewer",
    );
  });
});
