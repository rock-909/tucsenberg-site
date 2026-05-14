/**
 * Airtable 相关类型定义
 */

// 重新导出生产链路仍在使用的 Airtable 类型
export type { AirtableRecord } from "@/lib/airtable/record-schema";

// Airtable 查询选项类型
export interface AirtableQueryOptions {
  maxRecords?: number;
  filterByFormula?: string;
  sort?: Array<{
    field: string;
    direction: "asc" | "desc";
  }>;
}

// 联系人状态类型
export type ContactStatus = "New" | "In Progress" | "Completed" | "Archived";

// Lead source type for CRM tracking
export type LeadSource =
  | "Website Contact Form"
  | "Product Inquiry"
  | "Newsletter Subscription";

// Base lead data for CRM
interface BaseLeadData {
  email: string;
  referenceId?: string;
}

// Contact lead data
export interface ContactLeadData extends BaseLeadData {
  firstName: string;
  lastName: string;
  company?: string;
  subject?: string;
  message: string;
  marketingConsent?: boolean;
}

// Product inquiry lead data
export interface ProductLeadData extends BaseLeadData {
  firstName: string;
  lastName: string;
  company?: string;
  message: string;
  productSlug: string;
  productName: string;
  quantity: string | number;
  requirements?: string;
  marketingConsent?: boolean;
}

// Newsletter subscription lead data
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- intentionally minimal, only email from BaseLeadData
export interface NewsletterLeadData extends BaseLeadData {}
