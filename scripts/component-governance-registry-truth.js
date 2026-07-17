const ts = require("typescript");
const postcss = require("postcss");

const USE_CLIENT_DIRECTIVE_PATTERN = /^\s*["']use client["'];?/m;
const RADIX_PACKAGE_PATTERN = /^@radix-ui\/[^/]+(?:\/.*)?$/;
const RADIX_THEMES_PATTERN = /^@radix-ui\/themes(?:\/.*)?$/;
const RADIX_PRIMITIVE_PATTERN = /^@radix-ui\/react-[^/]+(?:\/.*)?$/;
const RADIX_CSS_IMPORT_SPECIFIER_PATTERN =
  /^(?:url\s*\(\s*)?["']?(@radix-ui\/[^\s"');]+)["']?/i;

function unwrapTransparentExpression(node) {
  let current = node;

  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isNonNullExpression(current)
  ) {
    current = current.expression;
  }

  return current;
}

function getStringLiteralValue(node) {
  const unwrapped = unwrapTransparentExpression(node);
  return ts.isStringLiteralLike(unwrapped) ? unwrapped.text : null;
}

function isModuleIdentifier(node) {
  const unwrapped = unwrapTransparentExpression(node);
  return ts.isIdentifier(unwrapped) && unwrapped.text === "module";
}

function isRequireCallee(node) {
  const unwrapped = unwrapTransparentExpression(node);

  if (ts.isIdentifier(unwrapped) && unwrapped.text === "require") {
    return true;
  }

  if (
    ts.isPropertyAccessExpression(unwrapped) &&
    unwrapped.name.text === "require" &&
    isModuleIdentifier(unwrapped.expression)
  ) {
    return true;
  }

  if (ts.isElementAccessExpression(unwrapped)) {
    const propertyName = getStringLiteralValue(unwrapped.argumentExpression);
    return (
      propertyName === "require" && isModuleIdentifier(unwrapped.expression)
    );
  }

  return false;
}

function isCreateRequireCallee(node) {
  const unwrapped = unwrapTransparentExpression(node);
  return ts.isIdentifier(unwrapped) && unwrapped.text === "createRequire";
}

function collectModuleLoaderAliases(sourceFile) {
  const aliases = new Set();

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer
    ) {
      const initializer = unwrapTransparentExpression(node.initializer);
      const isCreateRequireCall =
        ts.isCallExpression(initializer) &&
        isCreateRequireCallee(initializer.expression);

      if (isRequireCallee(initializer) || isCreateRequireCall) {
        aliases.add(node.name.text);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return aliases;
}

function isModuleLoaderAlias(node, aliases) {
  const unwrapped = unwrapTransparentExpression(node);
  return ts.isIdentifier(unwrapped) && aliases.has(unwrapped.text);
}

function getRequireCallSpecifierArgument(node) {
  const callee = unwrapTransparentExpression(node.expression);

  if (
    !ts.isPropertyAccessExpression(callee) ||
    callee.name.text !== "call" ||
    !isRequireCallee(callee.expression)
  ) {
    return null;
  }

  return node.arguments[1] ?? null;
}

function collectModuleReferences(source, filePath) {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const references = [];
  const loaderAliases = collectModuleLoaderAliases(sourceFile);

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
      const callTarget = unwrapTransparentExpression(node.expression);
      const isDynamicImport = callTarget.kind === ts.SyntaxKind.ImportKeyword;

      if (
        isDynamicImport ||
        isRequireCallee(callTarget) ||
        isModuleLoaderAlias(callTarget, loaderAliases)
      ) {
        addReference(node.arguments[0]);
      } else {
        const requireCallSpecifier = getRequireCallSpecifierArgument(node);
        if (requireCallSpecifier) addReference(requireCallSpecifier);
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

function getRadixModuleReferenceSummary(
  source,
  filePath = "component-governance-source.tsx",
) {
  const references = collectModuleReferences(source, filePath);

  return {
    packageReference: findModuleReference(references, RADIX_PACKAGE_PATTERN),
    primitiveReference: findModuleReference(
      references,
      RADIX_PRIMITIVE_PATTERN,
    ),
    themesReference: findModuleReference(references, RADIX_THEMES_PATTERN),
  };
}

function collectCssImportReferences(source) {
  const references = [];
  const root = postcss.parse(source, { from: undefined });

  root.walkAtRules((atRule) => {
    if (atRule.name.toLowerCase() !== "import") return;

    const normalizedParams = atRule.params
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .trim();
    const match = RADIX_CSS_IMPORT_SPECIFIER_PATTERN.exec(normalizedParams);
    if (!match || !RADIX_PACKAGE_PATTERN.test(match[1])) return;

    references.push({
      specifier: match[1],
      line: atRule.source?.start?.line ?? 1,
    });
  });

  return references;
}

function getCssRadixModuleReferenceSummary(source) {
  const references = collectCssImportReferences(source);

  return {
    packageReference: references[0] ?? null,
    themesReference: findModuleReference(references, RADIX_THEMES_PATTERN),
  };
}

function findRadixPackageReference(source, filePath) {
  return getRadixModuleReferenceSummary(source, filePath).packageReference;
}

function findRadixThemesReference(source, filePath) {
  return getRadixModuleReferenceSummary(source, filePath).themesReference;
}

function findRadixPrimitiveReference(source, filePath) {
  return getRadixModuleReferenceSummary(source, filePath).primitiveReference;
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
  getCssRadixModuleReferenceSummary,
  getRadixModuleReferenceSummary,
  findRadixPackageReference,
  findRadixPrimitiveReference,
  findRadixThemesReference,
  USE_CLIENT_DIRECTIVE_PATTERN,
};
