import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseRouteModeSummary } from "../../../scripts/quality/route-mode-snapshot.mjs";

const REPO_ROOT = path.resolve(__dirname, "../../..");
const SAMPLE_SUMMARY = `
Route (app)
┌ ○ /_not-found
├ ◐ /[locale]
├ ƒ /api/contact
├ ○ /api/health
└ ƒ /sitemap.xml

○  (Static)             prerendered as static content
◐  (Partial Prerender)  prerendered as static HTML with dynamic server-streamed content
ƒ  (Dynamic)            server-rendered on demand
`;

describe("route mode snapshot parser", () => {
  it("parses static, partial prerender, and dynamic routes", () => {
    expect(parseRouteModeSummary(SAMPLE_SUMMARY)).toEqual([
      { mode: "static", route: "/_not-found" },
      { mode: "partial-prerender", route: "/[locale]" },
      { mode: "dynamic", route: "/api/contact" },
      { mode: "static", route: "/api/health" },
      { mode: "dynamic", route: "/sitemap.xml" },
    ]);
  });

  it("keeps scripts helper inventory explicit", () => {
    const scriptsDir = path.join(REPO_ROOT, "scripts");
    const scriptFiles = fs
      .readdirSync(scriptsDir, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) =>
        path.relative(REPO_ROOT, path.join(entry.parentPath, entry.name)),
      )
      .map((filePath) => filePath.replace(/\\/gu, "/"))
      .sort();

    expect(scriptFiles).toEqual([
      "scripts/quality/checks/brand.js",
      "scripts/quality/checks/client-boundary.js",
      "scripts/quality/checks/content-slugs.js",
      "scripts/quality/checks/eslint-disable.js",
      "scripts/quality/checks/translations.js",
      "scripts/quality/retention-reports.mjs",
      "scripts/quality/route-mode-snapshot.mjs",
      "scripts/starter-checks.js",
    ]);
  });
});
