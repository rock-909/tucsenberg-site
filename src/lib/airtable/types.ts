/**
 * Airtable 相关类型定义
 */

import type { MarketingAttributionFields } from "@/lib/marketing/attribution-fields";

/** Minimal createLead return shape from the Airtable SDK write path. */
export interface CreatedAirtableRecord {
  id: string;
}

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
export type LeadSource = "Website Contact Form" | "Product Inquiry";

// Base lead data for CRM
interface BaseLeadData extends MarketingAttributionFields {
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
  phone?: string;
}

// Product inquiry lead data.
//
// `productName` is the server-resolved display name (catalog label or the
// general-RFQ label), never a client-supplied slug. `catalogProductId` is
// present only for a catalog product inquiry; a general RFQ carries no product
// identity. `quantity` is optional because a general RFQ has none.
export interface ProductLeadData extends BaseLeadData {
  firstName: string;
  lastName: string;
  company?: string;
  message: string;
  phone?: string;
  productName: string;
  catalogProductId?: string;
  quantity?: string | number;
  requirements?: string;
}
