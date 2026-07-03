import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const HERO_VIEW_PATH = "src/components/sections/hero-section-view.tsx";
const HOME_PAGE_PATH = "src/app/[locale]/page.tsx";
const PAGE_EXPRESSION_PATH = "src/config/single-site-page-expression.ts";
const HERO_SECTION_IMPORT = "@/components/sections/hero-section";

const FORBIDDEN_HERO_MOTION_MODULES = new Set([
  "motion/react",
  "framer-motion",
]);

const FORBIDDEN_HERO_MOTION_MODULE_PREFIXES = ["@/components/motion/"];

const FORBIDDEN_HERO_MOTION_BINDINGS = new Set([
  "BreathingReveal",
  "BreathingStagger",
  "BreathingStaggerItem",
  "LightMotionProvider",
  "PageTransition",
]);

interface ModuleFacts {
  sourceFile: ts.SourceFile;
  moduleSpecifiers: string[];
  importBindingNames: string[];
  jsxTagNames: string[];
}

interface FindVariableOptions {
  exportedOnly?: boolean;
}

function readRepoFile(relativePath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads fixed repo files
  return readFileSync(relativePath, "utf8");
}

function readModuleFacts(relativePath: string): ModuleFacts {
  const sourceFile = ts.createSourceFile(
    relativePath,
    readRepoFile(relativePath),
    ts.ScriptTarget.Latest,
    true,
    relativePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  return {
    sourceFile,
    moduleSpecifiers: collectModuleSpecifiers(sourceFile),
    importBindingNames: collectImportBindingNames(sourceFile),
    jsxTagNames: collectJsxTagNames(sourceFile),
  };
}

function hasUseClientDirective(sourceFile: ts.SourceFile): boolean {
  for (const statement of sourceFile.statements) {
    if (
      !ts.isExpressionStatement(statement) ||
      !ts.isStringLiteral(statement.expression)
    ) {
      return false;
    }

    if (statement.expression.text === "use client") {
      return true;
    }
  }

  return false;
}

function addStringModuleSpecifier(
  specifiers: Set<string>,
  moduleSpecifier: ts.Expression | undefined,
): void {
  if (moduleSpecifier && ts.isStringLiteral(moduleSpecifier)) {
    specifiers.add(moduleSpecifier.text);
  }
}

function collectModuleSpecifiers(sourceFile: ts.SourceFile): string[] {
  const specifiers = new Set<string>();

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      addStringModuleSpecifier(specifiers, statement.moduleSpecifier);
    }

    if (ts.isExportDeclaration(statement)) {
      addStringModuleSpecifier(specifiers, statement.moduleSpecifier);
    }
  }

  function visit(node: ts.Node): void {
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      addStringModuleSpecifier(specifiers, node.arguments[0]);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return [...specifiers].sort();
}

function collectImportBindingNames(sourceFile: ts.SourceFile): string[] {
  const names = new Set<string>();

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.importClause) {
      continue;
    }

    const { importClause } = statement;
    if (importClause.name) {
      names.add(importClause.name.text);
    }

    const { namedBindings } = importClause;
    if (!namedBindings) {
      continue;
    }

    if (ts.isNamespaceImport(namedBindings)) {
      names.add(namedBindings.name.text);
      continue;
    }

    for (const element of namedBindings.elements) {
      names.add(element.name.text);
      if (element.propertyName) {
        names.add(element.propertyName.text);
      }
    }
  }

  return [...names].sort();
}

function getJsxTagNameText(
  sourceFile: ts.SourceFile,
  tagName: ts.JsxTagNameExpression,
): string {
  if (ts.isIdentifier(tagName)) {
    return tagName.text;
  }

  return tagName.getText(sourceFile);
}

function collectJsxTagNames(node: ts.Node | null): string[] {
  if (!node) {
    return [];
  }

  const sourceFile = node.getSourceFile();
  const tagNames = new Set<string>();

  function visit(current: ts.Node): void {
    if (
      ts.isJsxOpeningElement(current) ||
      ts.isJsxSelfClosingElement(current)
    ) {
      tagNames.add(getJsxTagNameText(sourceFile, current.tagName));
    }

    ts.forEachChild(current, visit);
  }

  visit(node);

  return [...tagNames].sort();
}

function unwrapExpression(expression: ts.Expression): ts.Expression {
  if (ts.isParenthesizedExpression(expression)) {
    return unwrapExpression(expression.expression);
  }

  if (ts.isAsExpression(expression)) {
    return unwrapExpression(expression.expression);
  }

  if (ts.isSatisfiesExpression(expression)) {
    return unwrapExpression(expression.expression);
  }

  if (ts.isNonNullExpression(expression)) {
    return unwrapExpression(expression.expression);
  }

  return expression;
}

function hasExportModifier(statement: ts.Statement): boolean {
  return (
    ts.canHaveModifiers(statement) &&
    (ts.getModifiers(statement) ?? []).some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    )
  );
}

function findTopLevelVariableDeclaration(
  sourceFile: ts.SourceFile,
  variableName: string,
  options: FindVariableOptions,
): ts.VariableDeclaration | null {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    if (options.exportedOnly === true && !hasExportModifier(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === variableName
      ) {
        return declaration;
      }
    }
  }

  return null;
}

function findVariableDeclaration(
  sourceFile: ts.SourceFile,
  variableName: string,
  options: FindVariableOptions = {},
): ts.VariableDeclaration | null {
  if (options.exportedOnly === true) {
    return findTopLevelVariableDeclaration(sourceFile, variableName, options);
  }

  let foundDeclaration: ts.VariableDeclaration | null = null;

  function visit(node: ts.Node): void {
    if (foundDeclaration) {
      return;
    }

    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === variableName
    ) {
      foundDeclaration = node;
      return;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return foundDeclaration;
}

function getExportedStringArrayFirstItem(
  moduleFacts: ModuleFacts,
  exportName: string,
): string | null {
  const declaration = findVariableDeclaration(
    moduleFacts.sourceFile,
    exportName,
    {
      exportedOnly: true,
    },
  );

  const initializer = declaration?.initializer
    ? unwrapExpression(declaration.initializer)
    : null;

  if (!initializer || !ts.isArrayLiteralExpression(initializer)) {
    return null;
  }

  const [firstElement] = initializer.elements;
  return firstElement && ts.isStringLiteral(firstElement)
    ? firstElement.text
    : null;
}

function getPropertyNameText(name: ts.PropertyName): string | null {
  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteral(name) ||
    ts.isNumericLiteral(name)
  ) {
    return name.text;
  }

  return null;
}

function getObjectPropertyInitializer(
  moduleFacts: ModuleFacts,
  objectName: string,
  propertyName: string,
): ts.Expression | null {
  const declaration = findVariableDeclaration(
    moduleFacts.sourceFile,
    objectName,
  );
  const initializer = declaration?.initializer
    ? unwrapExpression(declaration.initializer)
    : null;

  if (!initializer || !ts.isObjectLiteralExpression(initializer)) {
    return null;
  }

  for (const property of initializer.properties) {
    if (
      ts.isPropertyAssignment(property) &&
      getPropertyNameText(property.name) === propertyName
    ) {
      return unwrapExpression(property.initializer);
    }
  }

  return null;
}

function getRootJsxTagName(expression: ts.Expression | null): string | null {
  if (!expression) {
    return null;
  }

  const unwrappedExpression = unwrapExpression(expression);
  const sourceFile = unwrappedExpression.getSourceFile();

  if (ts.isJsxSelfClosingElement(unwrappedExpression)) {
    return getJsxTagNameText(sourceFile, unwrappedExpression.tagName);
  }

  if (ts.isJsxElement(unwrappedExpression)) {
    return getJsxTagNameText(
      sourceFile,
      unwrappedExpression.openingElement.tagName,
    );
  }

  return null;
}

function getForbiddenHeroMotionModules(
  specifiers: readonly string[],
): string[] {
  return specifiers.filter(
    (specifier) =>
      FORBIDDEN_HERO_MOTION_MODULES.has(specifier) ||
      FORBIDDEN_HERO_MOTION_MODULE_PREFIXES.some((prefix) =>
        specifier.startsWith(prefix),
      ),
  );
}

function getForbiddenHeroMotionBindings(names: readonly string[]): string[] {
  return names.filter((name) => FORBIDDEN_HERO_MOTION_BINDINGS.has(name));
}

describe("homepage LCP motion boundary", () => {
  it("keeps the first-screen hero outside the client motion graph", () => {
    const heroModule = readModuleFacts(HERO_VIEW_PATH);

    expect(hasUseClientDirective(heroModule.sourceFile)).toBe(false);
    expect(getForbiddenHeroMotionModules(heroModule.moduleSpecifiers)).toEqual(
      [],
    );
    expect(
      getForbiddenHeroMotionBindings(heroModule.importBindingNames),
    ).toEqual([]);
    expect(getForbiddenHeroMotionBindings(heroModule.jsxTagNames)).toEqual([]);
  });

  it("keeps the home route hero first and directly rendered", () => {
    const pageModule = readModuleFacts(HOME_PAGE_PATH);
    const pageExpressionModule = readModuleFacts(PAGE_EXPRESSION_PATH);
    const heroInitializer = getObjectPropertyInitializer(
      pageModule,
      "homeSections",
      "hero",
    );

    expect(
      getExportedStringArrayFirstItem(
        pageExpressionModule,
        "SINGLE_SITE_HOME_SECTION_ORDER",
      ),
    ).toBe("hero");
    expect(pageModule.moduleSpecifiers).toContain(HERO_SECTION_IMPORT);
    expect(getRootJsxTagName(heroInitializer)).toBe("HeroSection");
    expect(
      getForbiddenHeroMotionBindings(collectJsxTagNames(heroInitializer)),
    ).toEqual([]);
  });
});
