const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();

const BRAND_SCAN_ROOTS = [
  "README.md",
  "AGENTS.md",
  "CLAUDE.md",
  "CLAUDE.local.md",
  "PRODUCT.md",
  "DESIGN.md",
  "HANDOFF.md",
  "package.json",
  "src",
  "content",
  "messages",
  "public",
  "tests",
  "scripts",
  "docs",
];
const BRAND_SOURCE_EXTENSIONS = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mdx",
  ".mjs",
  ".svg",
  ".ts",
  ".tsx",
  ".txt",
  ".yml",
  ".yaml",
]);
const COMMON_EXCLUDED_DIRS = new Set([
  ".git",
  ".next",
  ".open-next",
  ".wrangler",
  "coverage",
  "node_modules",
  "reports",
  "storybook-static",
]);
const FORBIDDEN_BRAND_MARKERS = [
  "Tianze",
  "天泽",
  "tianze-pipe",
  "Lianyungang Tianze",
  "TIANZE-DESIGN",
  "b2b-web-template",
  "PVC conduit",
  "PETG pneumatic",
];
const FORBIDDEN_BRAND_PATTERNS = FORBIDDEN_BRAND_MARKERS.map((marker) => {
  const needle =
    marker === marker.toLowerCase() ? marker.toLowerCase() : marker;

  return {
    marker,
    pattern: new RegExp(escapeRegExp(needle), "g"),
  };
});
const SELF_PATHS = new Set([
  "scripts/starter-checks.js",
  "scripts/quality/checks/brand.js",
]);

function toRepoPath(rootDir, absolutePath) {
  return path.relative(rootDir, absolutePath).split(path.sep).join("/");
}

function isBrandSourceFile(filePath) {
  return BRAND_SOURCE_EXTENSIONS.has(path.extname(filePath));
}

function collectBrandFiles(targetPath, results = []) {
  if (!fs.existsSync(targetPath)) return results;

  const stats = fs
    .readdirSync(path.dirname(targetPath), { withFileTypes: true })
    .find((entry) => entry.name === path.basename(targetPath));

  if (stats?.isFile()) {
    if (isBrandSourceFile(targetPath)) results.push(targetPath);
    return results;
  }

  for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
    if (COMMON_EXCLUDED_DIRS.has(entry.name)) continue;

    const absolutePath = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      collectBrandFiles(absolutePath, results);
      continue;
    }

    if (entry.isFile() && isBrandSourceFile(absolutePath)) {
      results.push(absolutePath);
    }
  }

  return results;
}

function getLineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function scanBrandFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  if (SELF_PATHS.has(toRepoPath(ROOT, filePath))) return [];

  const findings = [];
  for (const { marker, pattern } of FORBIDDEN_BRAND_PATTERNS) {
    const haystack =
      marker === marker.toLowerCase() ? content.toLowerCase() : content;

    for (const match of haystack.matchAll(pattern)) {
      const index = match.index ?? 0;
      findings.push({
        file: toRepoPath(ROOT, filePath),
        line: getLineNumber(content, index),
        marker,
      });
    }
  }

  return findings;
}

function runBrandCheck() {
  const files = BRAND_SCAN_ROOTS.flatMap((scanRoot) =>
    collectBrandFiles(path.join(ROOT, scanRoot)),
  );
  const findings = files.flatMap(scanBrandFile);

  if (findings.length === 0) {
    console.log("brand:check passed");
    return true;
  }

  console.error("brand:check failed: old project brand markers remain");
  for (const finding of findings) {
    console.error(
      `- ${finding.file}:${finding.line} forbidden marker "${finding.marker}"`,
    );
  }
  return false;
}

module.exports = {
  runBrandCheck,
};
