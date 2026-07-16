const ts = require("typescript");

function getPropertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text;
  return undefined;
}

function getBindingIdentifier(bindingName, identifierName) {
  if (ts.isIdentifier(bindingName)) {
    return bindingName.text === identifierName ? bindingName : undefined;
  }
  for (const element of bindingName.elements) {
    if (!ts.isBindingElement(element)) continue;
    const identifier = getBindingIdentifier(element.name, identifierName);
    if (identifier) return identifier;
  }
  return undefined;
}

function findTopLevelVariableDeclarations(sourceFile, sourceName) {
  const declarations = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === sourceName
      ) {
        declarations.push(declaration);
      }
    }
  }
  return declarations;
}

function findDirectFunctionBindingIdentifiers(
  functionDeclaration,
  identifierName,
) {
  const identifiers = [];
  for (const parameter of functionDeclaration.parameters) {
    const identifier = getBindingIdentifier(parameter.name, identifierName);
    if (identifier) identifiers.push(identifier);
  }
  for (const statement of functionDeclaration.body?.statements ?? []) {
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const identifier = getBindingIdentifier(
          declaration.name,
          identifierName,
        );
        if (identifier) identifiers.push(identifier);
      }
    } else if (
      (ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement)) &&
      statement.name?.text === identifierName
    ) {
      identifiers.push(statement.name);
    }
  }
  return identifiers;
}

function findNamedFunctionDeclarations(sourceFile, functionName) {
  const declarations = [];
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === functionName) {
      declarations.push(node);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return declarations;
}

function getUniqueMatch(matches) {
  if (matches.length === 0) return { status: "missing" };
  if (matches.length > 1) return { status: "ambiguous" };
  return { match: matches[0], status: "matched" };
}

function getPropertyAccessPath(node, rootSymbol, checker, unwrapExpression) {
  const segments = [];
  let current = node;
  while (ts.isPropertyAccessExpression(current)) {
    segments.unshift(current.name.text);
    current = unwrapExpression(current.expression);
  }
  if (!ts.isIdentifier(current)) return null;
  return checker.getSymbolAtLocation(current) === rootSymbol ? segments : null;
}

function collectPropertyAccessKeys({
  sourceFile,
  checker,
  consumer,
  catalogKeys,
  unwrapExpression,
}) {
  const keys = new Set();
  const root = getUniqueMatch(
    findTopLevelVariableDeclarations(sourceFile, consumer.rootName),
  );
  if (root.status !== "matched") return { keys, status: root.status };
  const rootSymbol = checker.getSymbolAtLocation(root.match.name);
  if (!rootSymbol) return { keys, status: "missing" };
  let matchedAccess = false;

  function visit(node) {
    if (
      ts.isPropertyAccessExpression(node) &&
      !(
        ts.isPropertyAccessExpression(node.parent) &&
        node.parent.expression === node
      )
    ) {
      const pathSegments = getPropertyAccessPath(
        node,
        rootSymbol,
        checker,
        unwrapExpression,
      );
      if (pathSegments && pathSegments.length > 0) {
        matchedAccess = true;
        const key = `${consumer.prefix}${pathSegments.join(".")}`;
        const childPrefix = `${key}.`;
        const children = [...catalogKeys].filter((catalogKey) =>
          catalogKey.startsWith(childPrefix),
        );
        if (children.length > 0) {
          for (const child of children) keys.add(child);
        } else {
          keys.add(key);
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return { keys, status: matchedAccess ? "matched" : "missing" };
}

function collectCallArgumentKeys({
  sourceFile,
  checker,
  consumer,
  getStaticString,
}) {
  const keys = new Set();
  const owner = getUniqueMatch(
    findNamedFunctionDeclarations(sourceFile, consumer.ownerFunction),
  );
  if (owner.status !== "matched") return { keys, status: owner.status };
  const target = getUniqueMatch(
    findDirectFunctionBindingIdentifiers(owner.match, consumer.callee),
  );
  if (target.status !== "matched") return { keys, status: target.status };
  const targetSymbol = checker.getSymbolAtLocation(target.match);
  if (!targetSymbol) return { keys, status: "missing" };
  let matchedCall = false;

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      checker.getSymbolAtLocation(node.expression) === targetSymbol
    ) {
      const value = getStaticString(node.arguments[0], new Map());
      if (value !== undefined) {
        matchedCall = true;
        for (const prefix of consumer.prefixes) keys.add(`${prefix}${value}`);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(owner.match);
  return { keys, status: matchedCall ? "matched" : "missing" };
}

function collectPropertyValueKeys({ sourceFile, consumer, getStaticString }) {
  const keys = new Set();
  const scope = getUniqueMatch(
    findNamedFunctionDeclarations(sourceFile, consumer.functionName),
  );
  if (scope.status !== "matched") return { keys, status: scope.status };
  let matchedProperty = false;

  function visit(node) {
    if (
      ts.isPropertyAssignment(node) &&
      getPropertyName(node.name) === consumer.propertyName
    ) {
      const value = getStaticString(node.initializer, new Map());
      if (value !== undefined) {
        matchedProperty = true;
        for (const suffix of consumer.suffixes) {
          keys.add(`${consumer.prefix}${value}${suffix}`);
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(scope.match);
  return { keys, status: matchedProperty ? "matched" : "missing" };
}

function createConsumerCollector({ unwrapExpression, getStaticString }) {
  function getStaticPrimitive(node) {
    const current = unwrapExpression(node);
    if (!current) return undefined;
    if (
      ts.isStringLiteral(current) ||
      ts.isNoSubstitutionTemplateLiteral(current) ||
      ts.isNumericLiteral(current)
    ) {
      return current.text;
    }
    if (current.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (current.kind === ts.SyntaxKind.FalseKeyword) return false;
    return undefined;
  }

  function getObjectPropertyValue(object, propertyName) {
    for (const property of object.properties) {
      if (!ts.isPropertyAssignment(property)) continue;
      if (getPropertyName(property.name) !== propertyName) continue;
      return getStaticPrimitive(property.initializer);
    }
    return undefined;
  }

  function matchesEntryFilters(object, filters = []) {
    return filters.every((filter) => {
      const value = getObjectPropertyValue(object, filter.property);
      if (Object.hasOwn(filter, "equals")) return value === filter.equals;
      if (Object.hasOwn(filter, "notEquals")) {
        return value !== undefined && value !== filter.notEquals;
      }
      return false;
    });
  }

  function getTopLevelVariableInitializer(sourceFile, sourceName) {
    const result = getUniqueMatch(
      findTopLevelVariableDeclarations(sourceFile, sourceName),
    );
    if (result.status !== "matched") return result;
    const initializer = result.match.initializer
      ? unwrapExpression(result.match.initializer)
      : undefined;
    return initializer
      ? { initializer, status: "matched" }
      : { status: "missing" };
  }

  function collectFilteredObjectEntryKeys(sourceFile, sourceName, filters) {
    const source = getTopLevelVariableInitializer(sourceFile, sourceName);
    const keys = new Set();
    if (source.status !== "matched") return { keys, status: source.status };
    if (!ts.isObjectLiteralExpression(source.initializer)) {
      return { keys, status: "missing" };
    }
    for (const property of source.initializer.properties) {
      if (!ts.isPropertyAssignment(property)) continue;
      const key = getPropertyName(property.name);
      const value = unwrapExpression(property.initializer);
      if (
        key !== undefined &&
        value &&
        ts.isObjectLiteralExpression(value) &&
        matchesEntryFilters(value, filters)
      ) {
        keys.add(key);
      }
    }
    return { keys, status: "matched" };
  }

  function collectNamedCollectionValues(sourceFile, consumer) {
    const values = new Set();
    const source = getTopLevelVariableInitializer(
      sourceFile,
      consumer.sourceName,
    );
    if (source.status !== "matched") {
      return { status: source.status, values };
    }
    const entryKeys = consumer.entryKeySource
      ? collectFilteredObjectEntryKeys(
          sourceFile,
          consumer.entryKeySource.sourceName,
          consumer.entryKeySource.filters,
        )
      : null;
    if (entryKeys && entryKeys.status !== "matched") {
      return { status: entryKeys.status, values };
    }
    const allowedEntryKeys = entryKeys?.keys ?? null;

    function getCollectionValue(node) {
      const value = getStaticString(node, new Map());
      return value;
    }

    function collectValues(node) {
      if (consumer.valueProperty) {
        if (ts.isPropertyAssignment(node)) {
          const propertyName = getPropertyName(node.name);
          if (propertyName === consumer.valueProperty) {
            const value = getStaticString(node.initializer, new Map());
            if (value !== undefined) values.add(value);
          }
        }
        ts.forEachChild(node, collectValues);
        return;
      }

      const current = unwrapExpression(node);
      if (current && ts.isArrayLiteralExpression(current)) {
        for (const element of current.elements) {
          const value = getCollectionValue(element);
          if (value !== undefined) values.add(value);
        }
        return;
      }
      if (current && ts.isObjectLiteralExpression(current)) {
        for (const property of current.properties) {
          if (!ts.isPropertyAssignment(property)) continue;
          const entryKey = getPropertyName(property.name);
          if (
            allowedEntryKeys &&
            (entryKey === undefined || !allowedEntryKeys.has(entryKey))
          ) {
            continue;
          }
          const value = getCollectionValue(property.initializer);
          if (value !== undefined) values.add(value);
        }
      }
    }

    if (
      consumer.valueProperty &&
      consumer.entryFilters &&
      ts.isObjectLiteralExpression(source.initializer)
    ) {
      for (const property of source.initializer.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const entry = unwrapExpression(property.initializer);
        if (
          !entry ||
          !ts.isObjectLiteralExpression(entry) ||
          !matchesEntryFilters(entry, consumer.entryFilters)
        ) {
          continue;
        }
        const value = getObjectPropertyValue(entry, consumer.valueProperty);
        if (typeof value === "string") values.add(value);
      }
    } else {
      collectValues(source.initializer);
    }
    return { status: "matched", values };
  }

  return { collectNamedCollectionValues };
}

function collectDerivedKeyConsumerUsage({
  sourceEntries,
  sourceProgram,
  catalogKeys,
  derivedKeyConsumers,
  unwrapExpression,
  getStaticString,
}) {
  const collectors = createConsumerCollector({
    unwrapExpression,
    getStaticString,
  });
  const sourceByFile = new Map(
    sourceEntries.map((entry) => [entry.file, entry.content]),
  );
  const findings = [];
  const staticKeys = new Set();
  for (const consumer of derivedKeyConsumers) {
    const content = sourceByFile.get(consumer.file);
    if (content === undefined) {
      findings.push({
        file: "scripts/quality/message-key-usage-baseline.js",
        error: `derived message key consumer source is missing "${consumer.file}"`,
      });
      continue;
    }
    const sourceFile = sourceProgram.sourceFiles.get(consumer.file);
    if (!sourceFile) {
      findings.push({
        file: "scripts/quality/message-key-usage-baseline.js",
        error: `derived message key consumer source is missing "${consumer.file}"`,
      });
      continue;
    }

    let keys = new Set();
    let status = "missing";
    if (consumer.kind === "collection-values") {
      const result = collectors.collectNamedCollectionValues(
        sourceFile,
        consumer,
      );
      status = result.status;
      for (const value of result.values) {
        for (const suffix of consumer.suffixes) {
          keys.add(`${consumer.prefix}${value}${suffix}`);
        }
      }
    } else if (consumer.kind === "property-accesses") {
      const result = collectPropertyAccessKeys({
        sourceFile,
        checker: sourceProgram.checker,
        consumer,
        catalogKeys,
        unwrapExpression,
      });
      status = result.status;
      keys = result.keys;
    } else if (consumer.kind === "call-arguments") {
      const result = collectCallArgumentKeys({
        sourceFile,
        checker: sourceProgram.checker,
        consumer,
        getStaticString,
      });
      status = result.status;
      keys = result.keys;
    } else if (consumer.kind === "property-values") {
      const result = collectPropertyValueKeys({
        sourceFile,
        consumer,
        getStaticString,
      });
      status = result.status;
      keys = result.keys;
    }

    if (status !== "matched" || keys.size === 0) {
      findings.push({
        file: "scripts/quality/message-key-usage-baseline.js",
        error: `derived message key consumer is ${status === "ambiguous" ? "ambiguous" : "stale"} "${consumer.file}#${consumer.kind}"`,
      });
      continue;
    }
    for (const key of keys) staticKeys.add(key);
  }
  return { findings, staticKeys };
}

module.exports = { collectDerivedKeyConsumerUsage };
