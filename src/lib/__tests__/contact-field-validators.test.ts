import { describe, expect, it, vi } from "vitest";

import {
  CONTACT_FORM_CONFIG,
  CONTACT_FORM_VALIDATION_CONSTANTS,
  type ContactFormFieldKey,
} from "@/config/contact-form-config";
import { type ContactFormFieldValidatorContext } from "@/config/contact-form-validation";
import {
  company,
  email,
  fullName,
  message,
  phone,
  subject,
} from "@/lib/form-schema/contact-field-validators";

vi.unmock("@/config/contact-form-validation");

function createContext(
  key: ContactFormFieldKey,
): ContactFormFieldValidatorContext {
  return {
    config: CONTACT_FORM_CONFIG,
    field: CONTACT_FORM_CONFIG.fields[key],
  };
}

function createEmailContext(
  whitelist: string[] = [],
): ContactFormFieldValidatorContext {
  return {
    config: {
      ...CONTACT_FORM_CONFIG,
      validation: {
        ...CONTACT_FORM_CONFIG.validation,
        emailDomainWhitelist: whitelist,
      },
    },
    field: CONTACT_FORM_CONFIG.fields.email,
  };
}

describe("contact-field-validators", () => {
  it("validates full name while allowing practical international name punctuation", () => {
    const schema = fullName(createContext("fullName"));

    expect(schema.parse("Anne-Marie O'Neill")).toBe("Anne-Marie O'Neill");
    expect(schema.parse("O’Connor")).toBe("O’Connor");
    expect(schema.parse("José García")).toBe("José García");
    expect(schema.parse("François Dupont")).toBe("François Dupont");
    expect(schema.parse("张三")).toBe("张三");
    expect(schema.parse("阿卜杜拉·买买提")).toBe("阿卜杜拉·买买提");

    const result = schema.safeParse("John123");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Full name contains invalid characters",
      );
    }
  });

  it("validates email format, max length, and whitelist matching against any allowed domain", () => {
    const emailSchema = email(
      createEmailContext(["allowed.com", "trusted.com"]),
    );
    const maxLength = CONTACT_FORM_VALIDATION_CONSTANTS.EMAIL_MAX_LENGTH;
    const domain = "@example.com";
    const tooLongEmail = `${"a".repeat(maxLength - domain.length + 1)}${domain}`;

    const invalidFormat = emailSchema.safeParse("not-an-email");
    expect(invalidFormat.success).toBe(false);
    if (!invalidFormat.success) {
      expect(invalidFormat.error.issues[0]?.message).toBe(
        "Please enter a valid email address",
      );
    }

    const maxLengthResult = emailSchema.safeParse(tooLongEmail);
    expect(maxLengthResult.success).toBe(false);
    if (!maxLengthResult.success) {
      expect(maxLengthResult.error.issues[0]?.message).toBe(
        `Email must be less than ${maxLength} characters`,
      );
    }

    expect(emailSchema.parse("USER@TRUSTED.COM")).toBe("user@trusted.com");

    const blockedDomain = emailSchema.safeParse("user@blocked.com");
    expect(blockedDomain.success).toBe(false);
    if (!blockedDomain.success) {
      expect(blockedDomain.error.issues[0]?.message).toBe(
        "Email domain is not allowed",
      );
    }

    expect(emailSchema.parse("USER@ALLOWED.COM")).toBe("user@allowed.com");
  });

  it("rejects spreadsheet formula prefixes without breaking plus-addressing", () => {
    const emailSchema = email(createEmailContext());

    expect(emailSchema.parse("buyer+rfq@example.com")).toBe(
      "buyer+rfq@example.com",
    );
    expect(emailSchema.safeParse("+cmd@example.com").success).toBe(false);
    expect(emailSchema.safeParse("-cmd@example.com").success).toBe(false);
  });

  it("trims company values, enforces inclusive length boundaries, and rejects invalid edge characters", () => {
    const schema = company(createContext("company"));
    const minCompany = "A".repeat(
      CONTACT_FORM_VALIDATION_CONSTANTS.COMPANY_MIN_LENGTH,
    );
    const maxCompany = "B".repeat(
      CONTACT_FORM_VALIDATION_CONSTANTS.COMPANY_MAX_LENGTH,
    );

    expect(schema.parse("")).toBeUndefined();
    expect(schema.parse(`  ${minCompany}  `)).toBe(minCompany);
    expect(schema.parse(maxCompany)).toBe(maxCompany);

    const tooShort = schema.safeParse("A");
    expect(tooShort.success).toBe(false);
    if (!tooShort.success) {
      expect(tooShort.error.issues[0]?.message).toBe(
        `Company name must be between ${CONTACT_FORM_VALIDATION_CONSTANTS.COMPANY_MIN_LENGTH} and ${CONTACT_FORM_VALIDATION_CONSTANTS.COMPANY_MAX_LENGTH} characters`,
      );
    }

    const tooLong = schema.safeParse(`${maxCompany}C`);
    expect(tooLong.success).toBe(false);
    if (!tooLong.success) {
      expect(tooLong.error.issues[0]?.message).toBe(
        `Company name must be between ${CONTACT_FORM_VALIDATION_CONSTANTS.COMPANY_MIN_LENGTH} and ${CONTACT_FORM_VALIDATION_CONSTANTS.COMPANY_MAX_LENGTH} characters`,
      );
    }

    for (const invalidCompany of ["!Valid Company", "Valid Company!"]) {
      const invalid = schema.safeParse(invalidCompany);
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error.issues[0]?.message).toBe(
          "Company name contains invalid characters",
        );
      }
    }
  });

  it("enforces message bounds and trims the parsed message", () => {
    const schema = message(createContext("message"));
    const minMessage = "M".repeat(
      CONTACT_FORM_CONFIG.validation.messageMinLength,
    );
    const maxMessage = "N".repeat(
      CONTACT_FORM_CONFIG.validation.messageMaxLength,
    );

    expect(schema.parse(`  ${minMessage}  `)).toBe(minMessage);
    expect(schema.parse(maxMessage)).toBe(maxMessage);

    const tooShort = schema.safeParse(
      "M".repeat(CONTACT_FORM_CONFIG.validation.messageMinLength - 1),
    );
    expect(tooShort.success).toBe(false);
    if (!tooShort.success) {
      expect(tooShort.error.issues[0]?.message).toBe(
        `Message must be at least ${CONTACT_FORM_CONFIG.validation.messageMinLength} characters`,
      );
    }

    const tooLong = schema.safeParse(
      "N".repeat(CONTACT_FORM_CONFIG.validation.messageMaxLength + 1),
    );
    expect(tooLong.success).toBe(false);
    if (!tooLong.success) {
      expect(tooLong.error.issues[0]?.message).toBe(
        `Message must be less than ${CONTACT_FORM_CONFIG.validation.messageMaxLength} characters`,
      );
    }
  });

  it("normalizes phone formatting, keeps empty optional values valid, and rejects invalid numbers", () => {
    const schema = phone(createContext("phone"));
    const maxDigits = "1".repeat(
      CONTACT_FORM_VALIDATION_CONSTANTS.PHONE_MAX_DIGITS,
    );

    expect(schema.parse("")).toBe("");
    expect(
      schema.parse(
        `+(${maxDigits.slice(0, 3)}) ${maxDigits.slice(3, 6)}-${maxDigits.slice(6)}`,
      ),
    ).toContain(maxDigits.slice(0, 3));
    expect(schema.parse(maxDigits)).toBe(maxDigits);
    expect(schema.parse("+8613800138000")).toBe("+8613800138000");
    expect(schema.safeParse(`${maxDigits}9`).success).toBe(false);

    for (const invalidPhone of [
      "abc123",
      "123abc",
      "+12+34",
      "-123456",
      "--123",
      "123-",
    ]) {
      const result = schema.safeParse(invalidPhone);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "Please enter a valid phone number",
        );
      }
    }
  });

  it("treats subject as optional while enforcing inclusive min/max bounds", () => {
    const schema = subject(createContext("subject"));
    const minSubject = "S".repeat(
      CONTACT_FORM_VALIDATION_CONSTANTS.SUBJECT_MIN_LENGTH,
    );
    const maxSubject = "T".repeat(
      CONTACT_FORM_VALIDATION_CONSTANTS.SUBJECT_MAX_LENGTH,
    );
    const boundaryMessage = `Subject must be between ${CONTACT_FORM_VALIDATION_CONSTANTS.SUBJECT_MIN_LENGTH} and ${CONTACT_FORM_VALIDATION_CONSTANTS.SUBJECT_MAX_LENGTH} characters`;

    expect(schema.parse("")).toBeUndefined();
    expect(schema.parse("   ")).toBeUndefined();
    expect(schema.parse(minSubject)).toBe(minSubject);
    expect(schema.parse(maxSubject)).toBe(maxSubject);

    for (const invalidSubject of [
      "S".repeat(CONTACT_FORM_VALIDATION_CONSTANTS.SUBJECT_MIN_LENGTH - 1),
      `${maxSubject}T`,
    ]) {
      const result = schema.safeParse(invalidSubject);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(boundaryMessage);
      }
    }
  });
});
