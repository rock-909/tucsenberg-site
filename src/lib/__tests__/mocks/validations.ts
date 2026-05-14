import { vi } from "vitest";

/**
 * Mock validations for testing
 * 测试用验证模块 Mock
 */
export const emailTemplateDataSchema = {
  parse: vi.fn((data) => data),
};

export const productInquiryEmailDataSchema = {
  parse: vi.fn((data) => data),
};

export const validationHelpers = {
  sanitizeInput: vi.fn((input) => input),
  isSpamContent: vi.fn(() => false),
};

export type EmailTemplateData = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  message: string;
  phone?: string;
  subject?: string;
  submittedAt: string;
  marketingConsent?: boolean;
};

export type ProductInquiryEmailData = {
  firstName: string;
  lastName: string;
  email: string;
  productName: string;
  productSlug: string;
  quantity: number;
  company?: string;
  requirements?: string;
  marketingConsent?: boolean;
};
