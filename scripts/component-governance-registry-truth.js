const ts = require("typescript");

const USE_CLIENT_DIRECTIVE_PATTERN = /^\s*["']use client["'];?/m;
const RADIX_PACKAGE_PATTERN = /^@radix-ui\/[^/]+(?:\/.*)?$/;
const RADIX_THEMES_PATTERN = /^@radix-ui\/themes(?:\/.*)?$/;
const RADIX_PRIMITIVE_PATTERN = /^@radix-ui\/react-[^/]+(?:\/.*)?$/;

function getStringLiteralValue(node) {
  return ts.isStringLiteralLike(node) ? node.text : null;
}

function collectModuleReferences(source) {
  const sourceFile = ts.createSourceFile(
    "component-governance-source.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const references = [];

  function addReference(node) {
    const specifier = getStringLiteralValue(node);
    if (specifier === null) return;

    const { line } = sourceFile.getLineAndCharacterOfPosition(
      node.getStart(sourceFile),
    );
    references.push({ specifier, line: line + 1 });
  }

  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier
    ) {
      addReference(node.moduleSpecifier);
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression
    ) {
      addReference(node.moduleReference.expression);
    } else if (ts.isCallExpression(node) && node.arguments.length > 0) {
      const isDynamicImport =
        node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const isRequireCall =
        ts.isIdentifier(node.expression) && node.expression.text === "require";

      if (isDynamicImport || isRequireCall) {
        addReference(node.arguments[0]);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return references;
}

function findModuleReference(references, packagePattern) {
  return (
    references.find(({ specifier }) => packagePattern.test(specifier)) ?? null
  );
}

function getRadixModuleReferenceSummary(source) {
  const references = collectModuleReferences(source);

  return {
    packageReference: findModuleReference(references, RADIX_PACKAGE_PATTERN),
    primitiveReference: findModuleReference(
      references,
      RADIX_PRIMITIVE_PATTERN,
    ),
    themesReference: findModuleReference(references, RADIX_THEMES_PATTERN),
  };
}

function findRadixPackageReference(source) {
  return getRadixModuleReferenceSummary(source).packageReference;
}

function findRadixThemesReference(source) {
  return getRadixModuleReferenceSummary(source).themesReference;
}

function findRadixPrimitiveReference(source) {
  return getRadixModuleReferenceSummary(source).primitiveReference;
}

function getExpectedClientBoundary(source) {
  return USE_CLIENT_DIRECTIVE_PATTERN.test(source) ? "client" : "server-safe";
}

function getExpectedRadixLayer(source) {
  const { primitiveReference } = getRadixModuleReferenceSummary(source);

  if (primitiveReference) return "primitive";
  return "local";
}

module.exports = {
  getExpectedClientBoundary,
  getExpectedRadixLayer,
  getRadixModuleReferenceSummary,
  findRadixPackageReference,
  findRadixPrimitiveReference,
  findRadixThemesReference,
  USE_CLIENT_DIRECTIVE_PATTERN,
};
