#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { LOCALES_CONFIG } from "../../src/config/paths/locales-config";
import { CATALOG_MESSAGE_PACK_IDS } from "../../src/lib/i18n/message-pack-config";
import { mergeObjects } from "../../src/lib/merge-objects";

const MESSAGE_TYPES = ["critical", "deferred"] as const;

function getPackPath(
  rootDir: string,
  packId: (typeof CATALOG_MESSAGE_PACK_IDS)[number],
  locale: (typeof LOCALES_CONFIG.locales)[number],
  type: (typeof MESSAGE_TYPES)[number],
): string {
  const packRoot =
    packId === "base" ? "messages/base" : `messages/profiles/${packId}`;
  return path.join(rootDir, packRoot, locale, `${type}.json`);
}

function readJson(filePath: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<
    string,
    unknown
  >;
}

export function syncMessageCompat(rootDir = process.cwd()): void {
  for (const locale of LOCALES_CONFIG.locales) {
    for (const type of MESSAGE_TYPES) {
      const composed = CATALOG_MESSAGE_PACK_IDS.reduce<Record<string, unknown>>(
        (messages, packId) =>
          mergeObjects(
            messages,
            readJson(getPackPath(rootDir, packId, locale, type)),
          ),
        {},
      );
      const outputPath = path.join(rootDir, "messages", locale, `${type}.json`);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, `${JSON.stringify(composed, null, 2)}\n`);
      console.log(`Wrote ${path.relative(rootDir, outputPath)}`);
    }
  }
}

const entryPath = process.argv[1];
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  syncMessageCompat();
}
