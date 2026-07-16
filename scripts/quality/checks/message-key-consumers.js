const ts = require("typescript");

function getPropertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text;
  return undefined;
}

function createConsumerCollector({
  unwrapExpression,
  getStaticString,
  getCallName,
}) {
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

  function findNamedVariableInitializer(sourceFile, sourceName) {
    let initializer;
    function visit(node) {
      if (
        initializer === undefined &&
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === sourceName &&
        node.initializer
      ) {
        initializer = unwrapExpression(node.initializer);
        return;
      }
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    return initializer;
  }

  function collectFilteredObjectEntryKeys(sourceFile, sourceName, filters) {
    const initializer = findNamedVariableInitializer(sourceFile, sourceName);
    const keys = new Set();
    if (!initializer || !ts.isObjectLiteralExpression(initializer)) return keys;
    for (const property of initializer.properties) {
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
    return keys;
  }

  function collectNamedCollectionValues(sourceFile, consumer) {
    const values = new Set();
    const initializer = findNamedVariableInitializer(
      sourceFile,
      consumer.sourceName,
    );
    const allowedEntryKeys = consumer.entryKeySource
      ? collectFilteredObjectEntryKeys(
          sourceFile,
          consumer.entryKeySource.sourceName,
          consumer.entryKeySource.filters,
        )
      : null;

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
      initializer &&
      consumer.valueProperty &&
      consumer.entryFilters &&
      ts.isObjectLiteralExpression(initializer)
    ) {
      for (const property of initializer.properties) {
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
    } else if (initializer) {
      collectValues(initializer);
    }
    return { matchedCollection: initializer !== undefined, values };
  }

  function getPropertyAccessPath(node, rootName) {
    const segments = [];
    let current = node;
    while (ts.isPropertyAccessExpression(current)) {
      segments.unshift(current.name.text);
      current = unwrapExpression(current.expression);
    }
    return ts.isIdentifier(current) && current.text === rootName
      ? segments
      : null;
  }

  function collectPropertyAccessKeys(sourceFile, consumer, catalogKeys) {
    const keys = new Set();
    let matchedRoot = false;

    function visit(node) {
      if (
        ts.isPropertyAccessExpression(node) &&
        !(
          ts.isPropertyAccessExpression(node.parent) &&
          node.parent.expression === node
        )
      ) {
        const pathSegments = getPropertyAccessPath(node, consumer.rootName);
        if (pathSegments && pathSegments.length > 0) {
          matchedRoot = true;
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
    return { keys, matchedRoot };
  }

  function collectCallArgumentKeys(sourceFile, consumer) {
    const keys = new Set();
    let matchedCall = false;

    function visit(node) {
      if (ts.isCallExpression(node) && getCallName(node) === consumer.callee) {
        const value = getStaticString(node.arguments[0], new Map());
        if (value !== undefined) {
          matchedCall = true;
          for (const prefix of consumer.prefixes) keys.add(`${prefix}${value}`);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    return { keys, matchedCall };
  }

  function collectPropertyValueKeys(sourceFile, consumer) {
    const keys = new Set();
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
    visit(sourceFile);
    return { keys, matchedProperty };
  }

  return {
    collectCallArgumentKeys,
    collectNamedCollectionValues,
    collectPropertyAccessKeys,
    collectPropertyValueKeys,
  };
}

function collectDerivedKeyConsumerUsage({
  sourceEntries,
  catalogKeys,
  derivedKeyConsumers,
  unwrapExpression,
  getStaticString,
  getCallName,
}) {
  const collectors = createConsumerCollector({
    unwrapExpression,
    getStaticString,
    getCallName,
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
    const sourceFile = ts.createSourceFile(
      consumer.file,
      content,
      ts.ScriptTarget.Latest,
      true,
      consumer.file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );

    let keys = new Set();
    let matched = false;
    if (consumer.kind === "collection-values") {
      const result = collectors.collectNamedCollectionValues(
        sourceFile,
        consumer,
      );
      matched = result.matchedCollection && result.values.size > 0;
      for (const value of result.values) {
        for (const suffix of consumer.suffixes) {
          keys.add(`${consumer.prefix}${value}${suffix}`);
        }
      }
    } else if (consumer.kind === "property-accesses") {
      const result = collectors.collectPropertyAccessKeys(
        sourceFile,
        consumer,
        catalogKeys,
      );
      matched = result.matchedRoot;
      keys = result.keys;
    } else if (consumer.kind === "call-arguments") {
      const result = collectors.collectCallArgumentKeys(sourceFile, consumer);
      matched = result.matchedCall;
      keys = result.keys;
    } else if (consumer.kind === "property-values") {
      const result = collectors.collectPropertyValueKeys(sourceFile, consumer);
      matched = result.matchedProperty;
      keys = result.keys;
    }

    if (!matched || keys.size === 0) {
      findings.push({
        file: "scripts/quality/message-key-usage-baseline.js",
        error: `derived message key consumer is stale "${consumer.file}#${consumer.kind}"`,
      });
      continue;
    }
    for (const key of keys) staticKeys.add(key);
  }
  return { findings, staticKeys };
}

module.exports = { collectDerivedKeyConsumerUsage };
