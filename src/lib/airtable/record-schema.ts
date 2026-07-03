import { z } from "zod";

/**
 * Airtable记录验证模式
 * Airtable record validation schema
 */
export const airtableRecordSchema = z.object({
  id: z.string().optional(),
  fields: z.object({
    "First Name": z.string(),
    "Last Name": z.string(),
    Email: z.string().email(),
    Company: z.string(),
    Message: z.string(),
    Phone: z.string().optional(),
    Subject: z.string().optional(),
    "Submitted At": z.string(),
    Status: z
      .enum(["New", "In Progress", "Completed", "Archived"])
      .default("New"),
    Source: z.string().default("Website Contact Form"),
    "Marketing Consent": z.boolean().optional(),
  }),
  createdTime: z.string().optional(),
});

export type AirtableRecord = z.infer<typeof airtableRecordSchema>;
