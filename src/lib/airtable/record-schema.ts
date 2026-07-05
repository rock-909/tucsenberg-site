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
    "UTM Source": z.string().optional(),
    "UTM Medium": z.string().optional(),
    "UTM Campaign": z.string().optional(),
    "UTM Term": z.string().optional(),
    "UTM Content": z.string().optional(),
    GCLID: z.string().optional(),
    FBCLID: z.string().optional(),
    MSCLKID: z.string().optional(),
    "Landing Page": z.string().optional(),
    "Captured At": z.string().optional(),
  }),
  createdTime: z.string().optional(),
});

export type AirtableRecord = z.infer<typeof airtableRecordSchema>;
