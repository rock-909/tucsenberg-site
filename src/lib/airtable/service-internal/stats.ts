import "server-only";

import type AirtableNS from "airtable";
import { AIRTABLE_STATS_MAX_RECORDS } from "@/constants/airtable";
import { logger } from "@/lib/logger";
import { getContactRecords } from "@/lib/airtable/service-internal/contact-records";

export async function getContactStatistics(params: {
  base: AirtableNS.Base;
  tableName: string;
}): Promise<{
  totalContacts: number;
  newContacts: number;
  completedContacts: number;
  recentContacts: number;
}> {
  const { base, tableName } = params;

  try {
    const [total, newContacts, completed, recent] = await Promise.all([
      getContactRecords({
        base,
        tableName,
        options: { maxRecords: AIRTABLE_STATS_MAX_RECORDS },
      }),
      getContactRecords({
        base,
        tableName,
        options: {
          filterByFormula: `{Status} = "New"`,
          maxRecords: AIRTABLE_STATS_MAX_RECORDS,
        },
      }),
      getContactRecords({
        base,
        tableName,
        options: {
          filterByFormula: `{Status} = "Completed"`,
          maxRecords: AIRTABLE_STATS_MAX_RECORDS,
        },
      }),
      getContactRecords({
        base,
        tableName,
        options: {
          filterByFormula: `IS_AFTER({Submitted At}, DATEADD(TODAY(), -7, 'days'))`,
          maxRecords: AIRTABLE_STATS_MAX_RECORDS,
        },
      }),
    ]);

    return {
      totalContacts: total.length,
      newContacts: newContacts.length,
      completedContacts: completed.length,
      recentContacts: recent.length,
    };
  } catch (error) {
    logger.error("Failed to get statistics", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new Error("Failed to get statistics", { cause: error });
  }
}
