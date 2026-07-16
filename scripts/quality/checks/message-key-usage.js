const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const ts = require("typescript");
const { composeCatalogMessages, collectLeafPaths } = require("./translations");
const {
  DYNAMIC_MESSAGE_KEY_PREFIXES,
  MESSAGE_DERIVED_KEY_CONSUMERS,
  MESSAGE_OBJECT_KEY_CONSUMERS,
  TRANSLATOR_BINDING_OVERRIDES,
  TRANSLATOR_PARAMETER_OVERRIDES,
  UNUSED_MESSAGE_KEYS,
} = require("../message-key-usage-baseline");

const ROOT = process.cwd();
const DEFAULT_LOCALE = require("../../../i18n-locales.config").defaultLocale;
const SOURCE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".mdx",
  ".mjs",
  ".ts",
  ".tsx",
]);
const SOURCE_ROOTS = [".storybook", "content", "scripts", "src", "tests"];
const SELF_FILES = new Set([
  "scripts/quality/checks/message-key-usage.js",
  "scripts/quality/message-key-usage-baseline.js",
]);

function getCatalogKeys(locale = DEFAULT_LOCALE) {
  const composed = composeCatalogMessages(locale);
  return new Set([
    ...collectLeafPaths(composed.critical),
    ...collectLeafPaths(composed.deferred),
  ]);
}

function collectUsageSourceFiles(rootDir = ROOT) {
  const output = execFileSync(
    "git",
    ["ls-files", "-z", "--", ...SOURCE_ROOTS],
    {
      cwd: rootDir,
      encoding: "utf8",
    },
  );
  return output
    .split("\0")
    .filter(Boolean)
    .filter((file) => SOURCE_EXTENSIONS.has(path.extname(file)))
    .filter((file) => !SELF_FILES.has(file));
}

function unwrapExpression(node) {
  let current = node;
  while (
    current &&
    (ts.isAsExpression(current) ||
      ts.isAwaitExpression(current) ||
      ts.isNonNullExpression(current) ||
      ts.isParenthesizedExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isTypeAssertionExpression(current))
  ) {
    current = current.expression;
  }
  return current;
}

function getStaticString(node, constants) {
  const current = unwrapExpression(node);
  if (
    current &&
    (ts.isStringLiteral(current) || ts.isNoSubstitutionTemplateLiteral(current))
  ) {
    return current.text;
  }
  if (current && ts.isIdentifier(current)) return constants.get(current.text);
  return undefined;
}

function getCallName(callExpression) {
  const callee = callExpression.expression;
  if (ts.isIdentifier(callee)) return callee.text;
  if (ts.isPropertyAccessExpression(callee)) return callee.name.text;
  return undefined;
}

function getTranslationNamespace(callExpression, constants) {
  const firstArgument = callExpression.arguments[0];
  const direct = getStaticString(firstArgument, constants);
  if (direct !== undefined) return direct;
  if (firstArgument && ts.isObjectLiteralExpression(firstArgument)) {
    const namespaceProperty = firstArgument.properties.find(
      (property) =>
        ts.isPropertyAssignment(property) &&
        property.name.getText() === "namespace",
    );
    if (namespaceProperty && ts.isPropertyAssignment(namespaceProperty)) {
      return getStaticString(namespaceProperty.initializer, constants);
    }
  }
  return firstArgument === undefined ? "" : undefined;
}

function getTranslatorNamespaceFromExpression(node, constants) {
  const expression = unwrapExpression(node);
  if (!expression || !ts.isCallExpression(expression)) return undefined;
  const callName = getCallName(expression);
  if (callName !== "getTranslations" && callName !== "useTranslations") {
    return undefined;
  }
  return getTranslationNamespace(expression, constants);
}

function joinMessageKey(namespace, key) {
  return namespace ? `${namespace}.${key}` : key;
}

function getPromiseAllInputs(node) {
  const initializer = unwrapExpression(node);
  if (
    !initializer ||
    !ts.isCallExpression(initializer) ||
    !ts.isPropertyAccessExpression(initializer.expression) ||
    initializer.expression.expression.getText() !== "Promise" ||
    initializer.expression.name.text !== "all"
  ) {
    return null;
  }
  const inputs = unwrapExpression(initializer.arguments[0]);
  return inputs && ts.isArrayLiteralExpression(inputs) ? inputs.elements : null;
}

function collectTranslatorBindings({
  sourceFile,
  file,
  constants,
  translatorBindingOverrides,
}) {
  const translatorBindings = new Map();
  for (const override of translatorBindingOverrides) {
    if (override.file === file) {
      translatorBindings.set(override.identifier, override.namespace);
    }
  }

  function collectBindings(node) {
    if (!ts.isVariableDeclaration(node) || !node.initializer) {
      ts.forEachChild(node, collectBindings);
      return;
    }
    if (ts.isIdentifier(node.name)) {
      const namespace = getTranslatorNamespaceFromExpression(
        node.initializer,
        constants,
      );
      if (namespace !== undefined) {
        translatorBindings.set(node.name.text, namespace);
      }
    } else if (ts.isArrayBindingPattern(node.name)) {
      const inputs = getPromiseAllInputs(node.initializer);
      for (const [index, binding] of node.name.elements.entries()) {
        if (!inputs || !ts.isBindingElement(binding)) continue;
        if (!ts.isIdentifier(binding.name)) continue;
        const namespace = getTranslatorNamespaceFromExpression(
          inputs[index],
          constants,
        );
        if (namespace !== undefined) {
          translatorBindings.set(binding.name.text, namespace);
        }
      }
    }
    ts.forEachChild(node, collectBindings);
  }
  collectBindings(sourceFile);
  return translatorBindings;
}

function collectForwardedTranslatorCalls(sourceFile, translatorBindings) {
  const forwardedTranslatorCalls = new Set();

  function collectForwardedBindings(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer
    ) {
      const initializer = unwrapExpression(node.initializer);
      if (
        initializer &&
        ts.isArrowFunction(initializer) &&
        initializer.parameters.length === 1 &&
        ts.isIdentifier(initializer.parameters[0].name)
      ) {
        const body = unwrapExpression(initializer.body);
        if (body && ts.isCallExpression(body)) {
          let translator = body.expression;
          if (ts.isPropertyAccessExpression(translator)) {
            translator = translator.expression;
          }
          const argument = unwrapExpression(body.arguments[0]);
          if (
            ts.isIdentifier(translator) &&
            translatorBindings.has(translator.text) &&
            argument &&
            ts.isIdentifier(argument) &&
            argument.text === initializer.parameters[0].name.text
          ) {
            translatorBindings.set(
              node.name.text,
              translatorBindings.get(translator.text),
            );
            forwardedTranslatorCalls.add(body);
          }
        }
      }
    }
    ts.forEachChild(node, collectForwardedBindings);
  }
  collectForwardedBindings(sourceFile);
  return forwardedTranslatorCalls;
}

function collectTranslatorCallUsage({
  node,
  translatorBindings,
  explicitOverrides,
  parameterOverrides,
  constants,
  staticKeys,
  dynamicPrefixes,
}) {
  let translator = node.expression;
  if (ts.isPropertyAccessExpression(translator)) {
    translator = translator.expression;
  }
  if (!ts.isIdentifier(translator)) return;
  const shadowingFunction = getShadowingFunctionParameter(translator);
  const scopedOverride = shadowingFunction
    ? parameterOverrides.find(
        (override) =>
          override.identifier === translator.text &&
          override.functionName === getFunctionName(shadowingFunction),
      )
    : undefined;
  const overrideNamespace =
    scopedOverride?.namespace ?? explicitOverrides.get(translator.text);
  if (overrideNamespace === undefined && shadowingFunction !== null) {
    return;
  }
  if (
    overrideNamespace === undefined &&
    !translatorBindings.has(translator.text)
  ) {
    return;
  }

  const namespace =
    overrideNamespace ?? translatorBindings.get(translator.text);
  const keyArgument = unwrapExpression(node.arguments[0]);
  const key = getStaticString(keyArgument, constants);
  if (key !== undefined) {
    staticKeys.add(joinMessageKey(namespace, key));
  } else if (keyArgument && ts.isTemplateExpression(keyArgument)) {
    dynamicPrefixes.add(joinMessageKey(namespace, keyArgument.head.text));
  } else {
    dynamicPrefixes.add(namespace ? `${namespace}.` : "");
  }
}

function bindingNameContains(bindingName, identifierName) {
  if (ts.isIdentifier(bindingName)) return bindingName.text === identifierName;
  return bindingName.elements.some(
    (element) =>
      ts.isBindingElement(element) &&
      bindingNameContains(element.name, identifierName),
  );
}

function getFunctionName(node) {
  if (node.name && ts.isIdentifier(node.name)) return node.name.text;
  if (
    node.parent &&
    ts.isVariableDeclaration(node.parent) &&
    ts.isIdentifier(node.parent.name)
  ) {
    return node.parent.name.text;
  }
  return null;
}

function getShadowingFunctionParameter(identifier) {
  let current = identifier.parent;
  while (current) {
    if (
      ts.isFunctionLike(current) &&
      current.parameters.some((parameter) =>
        bindingNameContains(parameter.name, identifier.text),
      )
    ) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

function collectRequiredMessagePathUsage({
  node,
  constants,
  staticKeys,
  dynamicPrefixes,
}) {
  if (getCallName(node) !== "readRequiredMessagePath") return;
  const pathArgument = unwrapExpression(node.arguments[1]);
  if (!pathArgument || !ts.isArrayLiteralExpression(pathArgument)) return;

  const segments = [];
  let dynamic = false;
  for (const element of pathArgument.elements) {
    const segment = getStaticString(element, constants);
    if (segment === undefined) {
      dynamic = true;
      break;
    }
    segments.push(segment);
  }
  if (segments.length === 0) return;
  const key = segments.join(".");
  if (dynamic) dynamicPrefixes.add(`${key}.`);
  else staticKeys.add(key);
}

function collectSourceUsage({
  file,
  content,
  catalogKeys,
  constants,
  translatorBindingOverrides,
  translatorParameterOverrides,
}) {
  const scriptKind = file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    file,
    content,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
  const translatorBindings = collectTranslatorBindings({
    sourceFile,
    file,
    constants,
    translatorBindingOverrides,
  });
  const explicitOverrides = new Map(
    translatorBindingOverrides
      .filter((override) => override.file === file)
      .map((override) => [override.identifier, override.namespace]),
  );
  const parameterOverrides = translatorParameterOverrides.filter(
    (override) => override.file === file,
  );
  const forwardedTranslatorCalls = collectForwardedTranslatorCalls(
    sourceFile,
    translatorBindings,
  );
  const staticKeys = new Set();
  const dynamicPrefixes = new Set();

  function collectNode(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (catalogKeys.has(node.text)) staticKeys.add(node.text);
    }

    if (ts.isCallExpression(node) && !forwardedTranslatorCalls.has(node)) {
      collectTranslatorCallUsage({
        node,
        translatorBindings,
        explicitOverrides,
        parameterOverrides,
        constants,
        staticKeys,
        dynamicPrefixes,
      });
      collectRequiredMessagePathUsage({
        node,
        constants,
        staticKeys,
        dynamicPrefixes,
      });
    }
    ts.forEachChild(node, collectNode);
  }
  collectNode(sourceFile);

  return { dynamicPrefixes, staticKeys };
}

function collectObjectKeyConsumerUsage({ sourceEntries, objectKeyConsumers }) {
  const sourceByFile = new Map(
    sourceEntries.map((entry) => [entry.file, entry.content]),
  );
  const findings = [];
  const staticKeys = new Set();

  for (const consumer of objectKeyConsumers) {
    const content = sourceByFile.get(consumer.file);
    if (content === undefined) {
      findings.push({
        file: "scripts/quality/message-key-usage-baseline.js",
        error: `message object-key consumer source is missing "${consumer.file}"`,
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
    let matchedObject = false;

    function visit(node) {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === consumer.objectName
      ) {
        const initializer = unwrapExpression(node.initializer);
        if (initializer && ts.isObjectLiteralExpression(initializer)) {
          matchedObject = true;
          for (const property of initializer.properties) {
            if (!ts.isPropertyAssignment(property)) continue;
            const propertyName = getStaticString(property.name, new Map());
            if (propertyName !== undefined) {
              staticKeys.add(`${consumer.prefix}${propertyName}`);
            } else if (ts.isIdentifier(property.name)) {
              staticKeys.add(`${consumer.prefix}${property.name.text}`);
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);

    if (!matchedObject) {
      findings.push({
        file: "scripts/quality/message-key-usage-baseline.js",
        error: `message object-key consumer is stale "${consumer.file}#${consumer.objectName}"`,
      });
    }
  }

  return { findings, staticKeys };
}

function getPropertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text;
  return undefined;
}

function collectNamedCollectionValues(sourceFile, consumer) {
  const values = new Set();
  let matchedCollection = false;

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
        const value = getStaticString(element, new Map());
        if (value !== undefined) values.add(value);
      }
      return;
    }
    if (current && ts.isObjectLiteralExpression(current)) {
      for (const property of current.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const value = getStaticString(property.initializer, new Map());
        if (value !== undefined) values.add(value);
      }
    }
  }

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === consumer.sourceName &&
      node.initializer
    ) {
      matchedCollection = true;
      collectValues(node.initializer);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return { matchedCollection, values };
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

function collectDerivedKeyConsumerUsage({
  sourceEntries,
  catalogKeys,
  derivedKeyConsumers,
}) {
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
      const result = collectNamedCollectionValues(sourceFile, consumer);
      matched = result.matchedCollection && result.values.size > 0;
      for (const value of result.values) {
        if (consumer.excludeValues?.includes(value)) continue;
        for (const suffix of consumer.suffixes) {
          keys.add(`${consumer.prefix}${value}${suffix}`);
        }
      }
    } else if (consumer.kind === "property-accesses") {
      const result = collectPropertyAccessKeys(
        sourceFile,
        consumer,
        catalogKeys,
      );
      matched = result.matchedRoot;
      keys = result.keys;
    } else if (consumer.kind === "call-arguments") {
      const result = collectCallArgumentKeys(sourceFile, consumer);
      matched = result.matchedCall;
      keys = result.keys;
    } else if (consumer.kind === "exact-keys") {
      matched = consumer.anchors.every((anchor) => content.includes(anchor));
      keys = new Set(consumer.keys);
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

function collectGlobalStringConstants(sourceEntries) {
  const constants = new Map();
  const ambiguousNames = new Set();
  for (const { file, content } of sourceEntries) {
    const sourceFile = ts.createSourceFile(
      file,
      content,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    function visit(node) {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.initializer
      ) {
        const value = getStaticString(node.initializer, new Map());
        const name = node.name.text;
        if (value !== undefined && !ambiguousNames.has(name)) {
          if (constants.has(name) && constants.get(name) !== value) {
            constants.delete(name);
            ambiguousNames.add(name);
          } else {
            constants.set(name, value);
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);
  }
  return constants;
}

function collectSourceUsageSummary({
  sourceEntries,
  catalogKeys,
  constants,
  translatorBindingOverrides,
  translatorParameterOverrides,
}) {
  const staticKeys = new Set();
  const dynamicPrefixes = new Set();
  for (const entry of sourceEntries) {
    const usage = collectSourceUsage({
      ...entry,
      catalogKeys,
      constants,
      translatorBindingOverrides,
      translatorParameterOverrides,
    });
    for (const key of usage.staticKeys) staticKeys.add(key);
    for (const prefix of usage.dynamicPrefixes) dynamicPrefixes.add(prefix);
  }
  return { dynamicPrefixes, staticKeys };
}

function collectDynamicPrefixFindings({
  catalogKeys,
  observedDynamicPrefixes,
  dynamicPrefixAllowlist,
}) {
  const findings = [];
  const allowedPrefixes = new Set(
    dynamicPrefixAllowlist.map(({ prefix }) => prefix),
  );
  for (const prefix of observedDynamicPrefixes) {
    if (prefix && allowedPrefixes.has(prefix)) continue;
    findings.push({
      file: "scripts/quality/message-key-usage-baseline.js",
      error: `dynamic message key prefix is not allowlisted "${prefix || "<unknown>"}"`,
    });
  }
  for (const { prefix } of dynamicPrefixAllowlist) {
    if (![...catalogKeys].some((key) => key.startsWith(prefix))) {
      findings.push({
        file: "scripts/quality/message-key-usage-baseline.js",
        error: `dynamic message key prefix matches no catalog key "${prefix}"`,
      });
    } else if (!observedDynamicPrefixes.has(prefix)) {
      findings.push({
        file: "scripts/quality/message-key-usage-baseline.js",
        error: `dynamic message key prefix is stale because no consumer emits it "${prefix}"`,
      });
    }
  }
  return findings;
}

function collectMissingUsedKeyFindings(catalogKeys, staticKeys) {
  return [...staticKeys]
    .filter((key) => !catalogKeys.has(key))
    .map((key) => ({
      file: "message usage",
      error: `used message key is missing from the catalog "${key}"`,
    }));
}

function collectUnusedKeyFindings({
  catalogKeys,
  usedKeys,
  unusedKeyAllowlist,
}) {
  const findings = [];
  const unusedAllowlist = new Set(unusedKeyAllowlist);
  for (const key of catalogKeys) {
    if (usedKeys.has(key) || unusedAllowlist.has(key)) continue;
    findings.push({
      file: "messages",
      error: `message key has no detected consumer and is not baselined "${key}"`,
    });
  }
  for (const key of unusedAllowlist) {
    if (!catalogKeys.has(key)) {
      findings.push({
        file: "scripts/quality/message-key-usage-baseline.js",
        error: `unused message key baseline is stale because the key is absent "${key}"`,
      });
    } else if (usedKeys.has(key)) {
      findings.push({
        file: "scripts/quality/message-key-usage-baseline.js",
        error: `unused message key baseline is stale because the key is now consumed "${key}"`,
      });
    }
  }
  return findings;
}

function collectMessageKeyUsageFindings({
  rootDir = ROOT,
  catalogKeys = getCatalogKeys(),
  sourceFiles = collectUsageSourceFiles(rootDir),
  dynamicPrefixAllowlist = DYNAMIC_MESSAGE_KEY_PREFIXES,
  derivedKeyConsumers = MESSAGE_DERIVED_KEY_CONSUMERS,
  objectKeyConsumers = MESSAGE_OBJECT_KEY_CONSUMERS,
  translatorBindingOverrides = TRANSLATOR_BINDING_OVERRIDES,
  translatorParameterOverrides = TRANSLATOR_PARAMETER_OVERRIDES,
  unusedKeyAllowlist = UNUSED_MESSAGE_KEYS,
} = {}) {
  const sourceEntries = sourceFiles.map((file) => ({
    file,
    content: fs.readFileSync(path.join(rootDir, file), "utf8"),
  }));
  const constants = collectGlobalStringConstants(sourceEntries);
  const sourceUsage = collectSourceUsageSummary({
    sourceEntries,
    catalogKeys,
    constants,
    translatorBindingOverrides,
    translatorParameterOverrides,
  });

  const objectKeyUsage = collectObjectKeyConsumerUsage({
    sourceEntries,
    objectKeyConsumers,
  });
  const derivedKeyUsage = collectDerivedKeyConsumerUsage({
    sourceEntries,
    catalogKeys,
    derivedKeyConsumers,
  });
  const staticKeys = new Set([
    ...sourceUsage.staticKeys,
    ...objectKeyUsage.staticKeys,
    ...derivedKeyUsage.staticKeys,
  ]);
  const usedKeys = new Set(staticKeys);

  return [
    ...objectKeyUsage.findings,
    ...derivedKeyUsage.findings,
    ...collectDynamicPrefixFindings({
      catalogKeys,
      observedDynamicPrefixes: sourceUsage.dynamicPrefixes,
      dynamicPrefixAllowlist,
    }),
    ...collectMissingUsedKeyFindings(catalogKeys, staticKeys),
    ...collectUnusedKeyFindings({
      catalogKeys,
      usedKeys,
      unusedKeyAllowlist,
    }),
  ];
}

function runMessageKeyUsageCheck() {
  const findings = collectMessageKeyUsageFindings();
  if (findings.length === 0) {
    console.log("message-key-usage: passed");
    return true;
  }
  console.error("message-key-usage: failed");
  for (const finding of findings)
    console.error(`- ${finding.file}: ${finding.error}`);
  return false;
}

module.exports = {
  collectDerivedKeyConsumerUsage,
  collectObjectKeyConsumerUsage,
  collectMessageKeyUsageFindings,
  collectUsageSourceFiles,
  getCatalogKeys,
  runMessageKeyUsageCheck,
};
