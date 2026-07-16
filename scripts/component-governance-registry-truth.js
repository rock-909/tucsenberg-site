const ts = require("typescript");

const USE_CLIENT_DIRECTIVE_PATTERN = /^\s*["']use client["'];?/m;
const RADIX_PACKAGE_PATTERN = /^@radix-ui\/[^/]+(?:\/.*)?$/;
const RADIX_THEMES_PATTERN = /^@radix-ui\/themes(?:\/.*)?$/;
const RADIX_PRIMITIVE_PATTERN = /^@radix-ui\/react-[^/]+(?:\/.*)?$/;

function unwrapStaticStringExpression(node) {
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
  const unwrapped = unwrapStaticStringExpression(node);
  return ts.isStringLiteralLike(unwrapped) ? unwrapped.text : null;
}

function collectModuleReferences(source, filePath) {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
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

function stripCssComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, (comment) =>
    comment.replace(/[^\n]/g, " "),
  );
}

function skipCssWhitespace(source, start) {
  let cursor = start;
  while (/\s/.test(source[cursor] ?? "")) cursor += 1;
  return cursor;
}

function readCssQuotedValue(source, start) {
  const quote = source[start];
  if (quote !== '"' && quote !== "'") return null;

  let cursor = start + 1;
  while (cursor < source.length) {
    if (source[cursor] === "\\") {
      cursor += 2;
      continue;
    }
    if (source[cursor] === quote) {
      return {
        value: source.slice(start + 1, cursor),
        end: cursor + 1,
      };
    }
    cursor += 1;
  }

  return null;
}

function readCssImportSpecifier(source, start) {
  let cursor = skipCssWhitespace(source, start);
  const functionName = source.slice(cursor, cursor + 3).toLowerCase();

  if (functionName === "url") {
    cursor = skipCssWhitespace(source, cursor + 3);
    if (source[cursor] !== "(") return null;
    cursor = skipCssWhitespace(source, cursor + 1);

    const quoted = readCssQuotedValue(source, cursor);
    if (quoted) return { specifier: quoted.value, end: quoted.end };

    const valueStart = cursor;
    while (
      cursor < source.length &&
      source[cursor] !== ")" &&
      !/\s/.test(source[cursor])
    ) {
      cursor += 1;
    }
    if (cursor === valueStart) return null;
    return { specifier: source.slice(valueStart, cursor), end: cursor };
  }

  const quoted = readCssQuotedValue(source, cursor);
  return quoted ? { specifier: quoted.value, end: quoted.end } : null;
}

function collectCssImportReferences(source) {
  const commentStrippedSource = stripCssComments(source);
  const references = [];
  let cursor = 0;

  while (cursor < commentStrippedSource.length) {
    const quoted = readCssQuotedValue(commentStrippedSource, cursor);
    if (quoted) {
      cursor = quoted.end;
      continue;
    }

    const keyword = commentStrippedSource.slice(cursor, cursor + 7);
    const nextCharacter = commentStrippedSource[cursor + 7] ?? "";
    if (keyword.toLowerCase() !== "@import" || !/\s/.test(nextCharacter)) {
      cursor += 1;
      continue;
    }

    const reference = readCssImportSpecifier(commentStrippedSource, cursor + 7);
    if (!reference) {
      cursor += 7;
      continue;
    }

    if (RADIX_PACKAGE_PATTERN.test(reference.specifier)) {
      references.push({
        specifier: reference.specifier,
        line: commentStrippedSource.slice(0, cursor).split("\n").length,
      });
    }
    cursor = reference.end;
  }

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
