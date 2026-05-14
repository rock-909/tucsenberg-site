/**
 * Test helpers for Airtable service testing
 * This file contains utility functions for testing Airtable services
 */

import type {
  AirtableBaseLike,
  AirtableServicePrivate,
} from "@/test/test-types";

export const createMockBase = <Fields = Record<string, unknown>>(
  tableFactory: AirtableBaseLike<Fields>["table"],
): AirtableBaseLike<Fields> => ({
  table: tableFactory,
});

export const configureServiceForTesting = <Fields = Record<string, unknown>>(
  service: unknown,
  base: AirtableBaseLike<Fields>,
): void => {
  const target = service as AirtableServicePrivate<Fields>;
  target.isConfigured = true;
  target.base = base;
};

// This file contains only utility functions and no tests
// It should not be picked up by the test runner
