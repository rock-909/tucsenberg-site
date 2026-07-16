const USE_CLIENT_DIRECTIVE_PATTERN = /^\s*["']use client["'];?/m;
const MODULE_REFERENCE_PREFIX = String.raw`(?:\b(?:import|export)\s+(?:[^"'\n;]*?\s+from\s+)?|\bimport\s+url\(\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)["']`;

function createRadixModuleReferencePattern(packageNamePattern) {
  return new RegExp(
    `${MODULE_REFERENCE_PREFIX}${packageNamePattern}(?:/[^"']*)?["']`,
  );
}

const RADIX_PACKAGE_IMPORT_PATTERN = createRadixModuleReferencePattern(
  String.raw`@radix-ui\/[^/"']+`,
);
const RADIX_THEMES_IMPORT_PATTERN = createRadixModuleReferencePattern(
  String.raw`@radix-ui\/themes`,
);
const RADIX_PRIMITIVE_IMPORT_PATTERN = createRadixModuleReferencePattern(
  String.raw`@radix-ui\/react-[^/"']+`,
);

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
  RADIX_PACKAGE_IMPORT_PATTERN,
  RADIX_PRIMITIVE_IMPORT_PATTERN,
  RADIX_THEMES_IMPORT_PATTERN,
  USE_CLIENT_DIRECTIVE_PATTERN,
};
