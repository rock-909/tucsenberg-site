#!/usr/bin/env tsx
/**
 * Compose the active materialized profile packs into broad compatibility files.
 * No runtime TypeScript imports — fs/path/JSON only.
 */
import fs from "node:fs";
import path from "node:path";

import { composeMessagesForProfileFromFiles } from "./messages";

const ROOT = process.cwd();
const LOCALES = ["en"] as const;
const MESSAGE_TYPES = ["critical", "deferred"] as const;
const COMPATIBILITY_PROFILE_ID = "catalog" as const;

function composeCompatibilityMessages(
  locale: (typeof LOCALES)[number],
  type: (typeof MESSAGE_TYPES)[number],
): Record<string, unknown> {
  return composeMessagesForProfileFromFiles({
    repoRoot: ROOT,
    profileId: COMPATIBILITY_PROFILE_ID,
    relativePath: `messages/${locale}/${type}.json`,
  });
}

function formatJson(value: Record<string, unknown>): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function getCompatibilityOutputPath(
  locale: (typeof LOCALES)[number],
  type: (typeof MESSAGE_TYPES)[number],
): string {
  return path.join(ROOT, "messages", locale, `${type}.json`);
}

function runWrite(): void {
  for (const locale of LOCALES) {
    for (const type of MESSAGE_TYPES) {
      const composed = composeCompatibilityMessages(locale, type);
      const outputPath = getCompatibilityOutputPath(locale, type);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, formatJson(composed));
      console.log(`Wrote ${path.relative(ROOT, outputPath)}`);
    }
  }
}

function main(): void {
  const args = process.argv.slice(2);
  const mode = args[0];

  if (mode === "--write") {
    runWrite();
    return;
  }

  console.error(
    "Usage: tsx scripts/starter-profile/sync-message-compat.ts --write",
  );
  process.exitCode = 1;
}

main();
