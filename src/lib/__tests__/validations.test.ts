import { describe, expect, it, vi } from "vitest";
import { airtableRecordSchema } from "@/lib/airtable/record-schema";
import { emailTemplateDataSchema } from "@/lib/email/email-data-schema";
import { contactFieldValidators } from "@/lib/form-schema/contact-field-validators";
import {
  contactFormSchema,
  type ContactFormData,
} from "@/lib/form-schema/contact-form-schema";
import { type FormSubmissionStatus } from "@/lib/forms/form-submission-status";
import { CONTACT_FORM_CONFIG } from "@/config/contact-form-config";
import { createContactFormSchemaFromConfig } from "@/config/contact-form-validation";

// 确保使用真实的 schema/helper 模块和 Zod 库，不受 Mock 影响
vi.unmock("@/config/contact-form-config");
vi.unmock("@/config/contact-form-validation");

describe("validations - Schema Validation", () => {
  describe("contactFormSchema", () => {
    const validFormData = {
      fullName: "John Doe",
      email: "john.doe@example.com",
      company: "Test Company",
      message: "This is a test message with sufficient length.",
      acceptPrivacy: true,
      website: "", // honeypot field
    };

    it("should validate correct form data", () => {
      const result = contactFormSchema.safeParse(validFormData);
      expect(result.success).toBe(true);
    });

    it("should reject form data with short full name", () => {
      const invalidData = { ...validFormData, fullName: "" };
      const result = contactFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain(
          "at least 1 character",
        );
      }
    });

    it("should reject form data with long full name", () => {
      const invalidData = { ...validFormData, fullName: "J".repeat(51) };
      const result = contactFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain(
          "less than 50 characters",
        );
      }
    });

    it("should reject form data with invalid full name characters", () => {
      const invalidData = { ...validFormData, fullName: "John123" };
      const result = contactFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("invalid characters");
      }
    });

    it("should accept Chinese characters in names", () => {
      const chineseData = {
        ...validFormData,
        fullName: "张三",
      };
      const result = contactFormSchema.safeParse(chineseData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const invalidData = { ...validFormData, email: "invalid-email" };
      const result = contactFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain(
          "valid email address",
        );
      }
    });

    it("should convert email to lowercase", () => {
      const upperCaseEmailData = {
        ...validFormData,
        email: "JOHN.DOE@EXAMPLE.COM",
      };
      const result = contactFormSchema.safeParse(upperCaseEmailData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("john.doe@example.com");
      }
    });

    it("should accept form data without company", () => {
      const invalidData = { ...validFormData, company: "" };
      const result = contactFormSchema.safeParse(invalidData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.company).toBeUndefined();
      }
    });

    it("should handle phone field based on config (disabled by default)", () => {
      // Default config has phone.enabled = false, so phone should be excluded from schema
      const defaultSchema = createContactFormSchemaFromConfig(
        CONTACT_FORM_CONFIG,
        contactFieldValidators,
      );

      // Phone field should NOT be in schema when disabled
      const dataWithPhone = { ...validFormData, phone: "+1234567890" };
      const result = defaultSchema.safeParse(dataWithPhone);

      // Should still succeed, phone is just ignored (not validated)
      expect(result.success).toBe(true);
      if (result.success) {
        // Phone should not be in parsed data since it's not in schema
        expect(result.data).not.toHaveProperty("phone");
      }
    });

    it("should validate phone when enabled in config", () => {
      // Create config with phone enabled
      const configWithPhone = {
        ...CONTACT_FORM_CONFIG,
        fields: {
          ...CONTACT_FORM_CONFIG.fields,
          phone: {
            ...CONTACT_FORM_CONFIG.fields.phone,
            enabled: true,
          },
        },
      };

      const schemaWithPhone = createContactFormSchemaFromConfig(
        configWithPhone,
        contactFieldValidators,
      );

      // Valid phone should pass
      const validData = { ...validFormData, phone: "+1234567890" };
      const validResult = schemaWithPhone.safeParse(validData);
      expect(validResult.success).toBe(true);

      // Invalid phone should fail
      const invalidData = { ...validFormData, phone: "invalid-phone" };
      const invalidResult = schemaWithPhone.safeParse(invalidData);
      expect(invalidResult.success).toBe(false);
    });

    it("should validate optional subject", () => {
      const dataWithSubject = { ...validFormData, subject: "Test Subject" };
      const result = contactFormSchema.safeParse(dataWithSubject);
      expect(result.success).toBe(true);
    });

    it("should reject subject that is too short", () => {
      const invalidData = { ...validFormData, subject: "Hi" };
      const result = contactFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain(
          "between 5 and 100 characters",
        );
      }
    });

    it("should require privacy acceptance", () => {
      const invalidData = { ...validFormData, acceptPrivacy: false };
      const result = contactFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain(
          "accept the privacy policy",
        );
      }
    });

    it("should validate optional marketing consent", () => {
      const dataWithConsent = { ...validFormData, marketingConsent: true };
      const result = contactFormSchema.safeParse(dataWithConsent);
      expect(result.success).toBe(true);
    });

    it("should reject honeypot field with content", () => {
      const invalidData = { ...validFormData, website: "spam content" };
      const result = contactFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("should be empty");
      }
    });
  });
});

describe("validations - API and Data Schemas", () => {
  describe("airtableRecordSchema", () => {
    const validRecord = {
      id: "rec123",
      fields: {
        "First Name": "John",
        "Last Name": "Doe",
        Email: "john@example.com",
        Company: "Test Co",
        Message: "Test message",
        "Submitted At": "2023-01-01T00:00:00Z",
      },
      createdTime: "2023-01-01T00:00:00Z",
    };

    it("should validate correct Airtable record", () => {
      const result = airtableRecordSchema.safeParse(validRecord);
      expect(result.success).toBe(true);
    });

    it("should set default status to New", () => {
      const result = airtableRecordSchema.safeParse(validRecord);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fields.Status).toBe("New");
      }
    });

    it("should set default source to Website Contact Form", () => {
      const result = airtableRecordSchema.safeParse(validRecord);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fields.Source).toBe("Website Contact Form");
      }
    });

    it("should validate with custom status", () => {
      const recordWithStatus = {
        ...validRecord,
        fields: { ...validRecord.fields, Status: "In Progress" as const },
      };
      const result = airtableRecordSchema.safeParse(recordWithStatus);
      expect(result.success).toBe(true);
    });
  });

  describe("emailTemplateDataSchema", () => {
    const validTemplateData = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      company: "Test Co",
      message: "Test message",
      submittedAt: "2023-01-01T00:00:00Z",
    };

    it("should validate correct email template data", () => {
      const result = emailTemplateDataSchema.safeParse(validTemplateData);
      expect(result.success).toBe(true);
    });

    it("should validate with optional fields", () => {
      const dataWithOptionals = {
        ...validTemplateData,
        phone: "+1234567890",
        subject: "Test Subject",
        marketingConsent: true,
      };
      const result = emailTemplateDataSchema.safeParse(dataWithOptionals);
      expect(result.success).toBe(true);
    });

    it("should accept empty company for optional contact form submissions", () => {
      const dataWithoutCompany = { ...validTemplateData, company: "" };
      const result = emailTemplateDataSchema.safeParse(dataWithoutCompany);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.company).toBeUndefined();
      }
    });

    it("should accept omitted company for optional contact form submissions", () => {
      const { company: _company, ...dataWithoutCompany } = validTemplateData;
      const result = emailTemplateDataSchema.safeParse(dataWithoutCompany);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.company).toBeUndefined();
      }
    });
  });
});

describe("validations - Types", () => {
  describe("TypeScript types", () => {
    it("should infer correct ContactFormData type", () => {
      const formData: ContactFormData = {
        fullName: "John Doe",
        email: "john@example.com",
        company: undefined,
        message: "Test message",
        acceptPrivacy: true,
        website: "",
      };
      expect(formData).toBeDefined();
    });

    it("should define FormSubmissionStatus type", () => {
      const statuses: FormSubmissionStatus[] = [
        "idle",
        "submitting",
        "success",
        "error",
      ];
      expect(statuses).toHaveLength(4);
    });
  });
});
