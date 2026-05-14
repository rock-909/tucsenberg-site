#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MODE_BY_SYMBOL = {
  "○": "static",
  "◐": "partial-prerender",
  "ƒ": "dynamic",
};

export function parseRouteModeSummary(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => {
      const match = line.match(/^[├└┌]\s*([○◐ƒ])\s+(\S+)/);
      if (!match) return null;
      const [, symbol, route] = match;
      return { mode: MODE_BY_SYMBOL[symbol], route };
    })
    .filter(Boolean);
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error(
      "Usage: node scripts/quality/route-mode-snapshot.mjs <build-output.txt>",
    );
    process.exitCode = 1;
    return;
  }

  const text = fs.readFileSync(inputPath, "utf8");
  const routes = parseRouteModeSummary(text);
  const outputDir = path.join(process.cwd(), "reports/quality");
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, "route-mode-snapshot.json"),
    `${JSON.stringify({ routes }, null, 2)}\n`,
  );
  console.log(`[route-mode-snapshot] wrote ${routes.length} route(s)`);
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  main();
}
