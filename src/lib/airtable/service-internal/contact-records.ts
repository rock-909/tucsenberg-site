import "server-only";

import type AirtableNS from "airtable";
import type {
  AirtableQueryOptions,
  AirtableRecord,
  ContactStatus,
} from "@/lib/airtable/types";
import { logger } from "@/lib/logger";
import { ONE, PERCENTAGE_FULL, ZERO } from "@/constants";

function escapeAirtableFormulaValue(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

export async function getContactRecords(params: {
  base: AirtableNS.Base;
  tableName: string;
  options?: AirtableQueryOptions;
}): Promise<AirtableRecord[]> {
  const { base, tableName, options = {} } = params;

  try {
    const { maxRecords = PERCENTAGE_FULL, filterByFormula, sort } = options;

    const selectOptions: {
      maxRecords: number;
      filterByFormula?: string;
      sort?: Array<{ field: string; direction: "asc" | "desc" }>;
    } = { maxRecords };

    if (filterByFormula) {
      selectOptions.filterByFormula = filterByFormula;
    }
    if (sort) {
      selectOptions.sort = sort;
    }

    const records = await base.table(tableName).select(selectOptions).all();

    return records.map((record) => ({
      id: record.id,
      fields: record.fields as AirtableRecord["fields"],
      createdTime: record.get("Created Time") as string,
    }));
  } catch (error) {
    logger.error("Failed to fetch contact records", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new Error("Failed to fetch contact records", { cause: error });
  }
}

export async function updateContactRecordStatus(params: {
  base: AirtableNS.Base;
  tableName: string;
  recordId: string;
  status: ContactStatus;
}): Promise<void> {
  const { base, tableName, recordId, status } = params;

  try {
    await base.table(tableName).update([
      {
        id: recordId,
        fields: {
          Status: status,
          "Updated At": new Date().toISOString(),
        },
      },
    ]);

    logger.info("Contact record status updated", {
      recordId,
      newStatus: status,
    });
  } catch (error) {
    logger.error("Failed to update contact record status", {
      error: error instanceof Error ? error.message : "Unknown error",
      recordId,
      status,
    });
    throw new Error("Failed to update contact status", { cause: error });
  }
}

export async function deleteContactRecord(params: {
  base: AirtableNS.Base;
  tableName: string;
  recordId: string;
}): Promise<void> {
  const { base, tableName, recordId } = params;

  try {
    await base.table(tableName).destroy([recordId]);

    logger.info("Contact record deleted", {
      recordId,
    });
  } catch (error) {
    logger.error("Failed to delete contact record", {
      error: error instanceof Error ? error.message : "Unknown error",
      recordId,
    });
    throw new Error("Failed to delete contact record", { cause: error });
  }
}

export async function isDuplicateEmailAddress(params: {
  base: AirtableNS.Base;
  tableName: string;
  email: string;
}): Promise<boolean> {
  const { base, tableName, email } = params;

  try {
    const normalizedEmail = escapeAirtableFormulaValue(
      email.trim().toLowerCase(),
    );
    const records = await base
      .table(tableName)
      .select({
        filterByFormula: `{Email} = "${normalizedEmail}"`,
        maxRecords: ONE,
      })
      .all();

    return records.length > ZERO;
  } catch (error) {
    logger.error("Failed to check duplicate email", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    // Re-throw to let callers decide how to handle the failure
    // instead of silently returning false (which masks API/network errors)
    throw new Error("Failed to check duplicate email", { cause: error });
  }
}
