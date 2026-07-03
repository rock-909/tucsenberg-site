const USE_CLIENT_DIRECTIVE_PATTERN = /^\s*["']use client["'];?/m;
const RADIX_THEMES_IMPORT_PATTERN =
  /(?:from\s+["']@radix-ui\/themes(?:\/[^"']*)?["']|import\s*\(\s*["']@radix-ui\/themes(?:\/[^"']*)?["']\s*\)|require\s*\(\s*["']@radix-ui\/themes(?:\/[^"']*)?["']\s*\))/;
const RADIX_PRIMITIVE_IMPORT_PATTERN = /from\s+["']@radix-ui\/react-[^"']+["']/;
const RADIX_THEME_PILOT_PATTERN = /\bRadixThemePilot\b/;

function getExpectedClientBoundary(source) {
  return USE_CLIENT_DIRECTIVE_PATTERN.test(source) ? "client" : "server-safe";
}

function getExpectedRadixLayer(source) {
  const usesThemes = RADIX_THEMES_IMPORT_PATTERN.test(source);
  const usesPrimitive = RADIX_PRIMITIVE_IMPORT_PATTERN.test(source);

  if (usesThemes && usesPrimitive) return "mixed";
  if (usesThemes) return "themes";
  if (usesPrimitive) return "primitive";
  return "local";
}

function getExpectedThemeBoundary(source) {
  const usesThemes = RADIX_THEMES_IMPORT_PATTERN.test(source);

  if (!usesThemes) return "none";
  if (RADIX_THEME_PILOT_PATTERN.test(source)) return "self-contained";
  return "parent-scoped";
}

module.exports = {
  getExpectedClientBoundary,
  getExpectedRadixLayer,
  getExpectedThemeBoundary,
  RADIX_PRIMITIVE_IMPORT_PATTERN,
  RADIX_THEMES_IMPORT_PATTERN,
  RADIX_THEME_PILOT_PATTERN,
  USE_CLIENT_DIRECTIVE_PATTERN,
};
