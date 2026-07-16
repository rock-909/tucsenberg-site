const USE_CLIENT_DIRECTIVE_PATTERN = /^\s*["']use client["'];?/m;
const RADIX_THEMES_IMPORT_PATTERN =
  /(?:from\s+["']@radix-ui\/themes(?:\/[^"']*)?["']|import\s*\(\s*["']@radix-ui\/themes(?:\/[^"']*)?["']\s*\)|require\s*\(\s*["']@radix-ui\/themes(?:\/[^"']*)?["']\s*\))/;
const RADIX_PRIMITIVE_IMPORT_PATTERN = /from\s+["']@radix-ui\/react-[^"']+["']/;

function getExpectedClientBoundary(source) {
  return USE_CLIENT_DIRECTIVE_PATTERN.test(source) ? "client" : "server-safe";
}

function getExpectedRadixLayer(source) {
  const usesPrimitive = RADIX_PRIMITIVE_IMPORT_PATTERN.test(source);

  if (usesPrimitive) return "primitive";
  return "local";
}

module.exports = {
  getExpectedClientBoundary,
  getExpectedRadixLayer,
  RADIX_PRIMITIVE_IMPORT_PATTERN,
  RADIX_THEMES_IMPORT_PATTERN,
  USE_CLIENT_DIRECTIVE_PATTERN,
};
