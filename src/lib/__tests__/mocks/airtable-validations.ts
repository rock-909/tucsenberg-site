import { vi } from "vitest";

/**
 * Mock validations for Airtable testing
 * 测试用 Airtable 验证模块 Mock
 */
export const airtableRecordSchema = {
  parse: vi.fn((data) => data),
};

export const validationHelpers = {
  sanitizeInput: vi.fn((input) => input),
  isSpamContent: vi.fn(() => false),
};

export type ContactFormData = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  message: string;
  acceptPrivacy: boolean;
  website?: string;
  phone?: string;
  subject?: string;
  marketingConsent?: boolean;
};

export type AirtableRecord = {
  id: string;
  fields: Record<string, string | number | boolean | string[]>;
  createdTime: string;
};
