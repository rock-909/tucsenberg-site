/**
 * Direct Airtable proof for the WhatsApp / Phone column.
 *
 * Skipped unless real credentials and AIRTABLE_PHONE_PROOF=1 are provided.
 * This is the Cluster 3A external gate — normal CI uses mocked Airtable only.
 */

import { afterAll, describe, expect, it } from "vitest";
import Airtable from "airtable";

const PROOF_ENABLED =
  process.env.AIRTABLE_PHONE_PROOF === "1" &&
  typeof process.env.AIRTABLE_API_KEY === "string" &&
  process.env.AIRTABLE_API_KEY.length > 0 &&
  typeof process.env.AIRTABLE_BASE_ID === "string" &&
  process.env.AIRTABLE_BASE_ID.length > 0;

const PROOF_PHONE = "+8613800138000";
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || "Contacts";

describe.skipIf(!PROOF_ENABLED)(
  "airtable WhatsApp / Phone direct write proof",
  () => {
    let createdRecordId: string | undefined;

    afterAll(async () => {
      if (!createdRecordId) return;

      const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY! }).base(
        process.env.AIRTABLE_BASE_ID!,
      );
      await base.table(TABLE_NAME).destroy(createdRecordId);
    });

    it("writes and reads back the normalized + phone without a leading apostrophe", async () => {
      const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY! }).base(
        process.env.AIRTABLE_BASE_ID!,
      );

      const created = await base.table(TABLE_NAME).create([
        {
          fields: {
            Email: `c2-phone-proof+${Date.now()}@example.com`,
            "First Name": "C2",
            "Last Name": "Proof",
            Message: "Cluster 3A phone column proof",
            "WhatsApp / Phone": PROOF_PHONE,
            Status: "New",
            Source: "Product Inquiry",
          },
        },
      ]);

      const record = Array.isArray(created) ? created[0] : created;
      createdRecordId = record?.id;

      expect(record).toBeDefined();
      const stored = record!.get("WhatsApp / Phone");
      expect(stored).toBe(PROOF_PHONE);
      expect(String(stored)).not.toMatch(/^'/);
    });
  },
);
