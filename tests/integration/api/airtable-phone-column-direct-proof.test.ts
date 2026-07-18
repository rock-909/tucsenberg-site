/**
 * Production-path Airtable proof for the WhatsApp / Phone column.
 *
 * Skipped unless real credentials and AIRTABLE_PHONE_PROOF=1 are provided.
 * Writes through AirtableService.createLead → createLeadRecord → buildLeadFields
 * / addPhoneField / sanitizeAirtablePhoneField. Normal CI uses mocked Airtable only.
 */

import { afterAll, describe, expect, it } from "vitest";
import Airtable from "airtable";
import { AirtableService } from "@/lib/airtable/service";
import { LEAD_TYPES } from "@/lib/lead-pipeline/lead-schema";

const PROOF_ENABLED =
  process.env.AIRTABLE_PHONE_PROOF === "1" &&
  typeof process.env.AIRTABLE_API_KEY === "string" &&
  process.env.AIRTABLE_API_KEY.length > 0 &&
  typeof process.env.AIRTABLE_BASE_ID === "string" &&
  process.env.AIRTABLE_BASE_ID.length > 0;

const PROOF_PHONE = "+8613800138000";
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || "Contacts";

describe.skipIf(!PROOF_ENABLED)(
  "airtable WhatsApp / Phone production write proof",
  () => {
    let createdRecordId: string | undefined;

    afterAll(async () => {
      if (!createdRecordId) return;

      const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY! }).base(
        process.env.AIRTABLE_BASE_ID!,
      );
      await base.table(TABLE_NAME).destroy(createdRecordId);
    });

    it("stores the normalized + phone from createLead without a leading apostrophe", async () => {
      const service = new AirtableService();
      expect(service.isReady()).toBe(false);

      const record = await service.createLead(LEAD_TYPES.PRODUCT, {
        firstName: "C2",
        lastName: "Proof",
        email: `c2-phone-proof+${Date.now()}@example.com`,
        message: "Cluster 3A phone column proof via production path",
        phone: PROOF_PHONE,
        productName: "General RFQ",
      });

      createdRecordId = record.id;

      const stored = record.fields["WhatsApp / Phone"];
      expect(stored).toBe(PROOF_PHONE);
      expect(String(stored)).not.toMatch(/^'/);
    });
  },
);
