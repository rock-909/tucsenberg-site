const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const I18N_LOCALES = require("../../../i18n-locales.config").locales;
const MESSAGES_DIR = path.join(ROOT, "messages");
const MESSAGE_TYPES = ["critical", "deferred"];
const CATALOG_MESSAGE_PACK_IDS = require("../../../messages/message-packs.json");
const MESSAGE_PACK_IDS = [...new Set(CATALOG_MESSAGE_PACK_IDS)];

const REQUIRED_PACK_FILES = MESSAGE_PACK_IDS.flatMap((packId) =>
  I18N_LOCALES.flatMap((locale) =>
    MESSAGE_TYPES.map((type) => getPackRelativePath(packId, locale, type)),
  ),
);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getPackRoot(packId) {
  return packId === "base" ? "messages/base" : `messages/profiles/${packId}`;
}

function getPackRelativePath(packId, locale, type) {
  return path.posix.join(getPackRoot(packId), locale, `${type}.json`);
}

function getPackAbsolutePath(packId, locale, type) {
  return path.join(ROOT, getPackRelativePath(packId, locale, type));
}

function getLocaleSplitPaths(locale) {
  return {
    critical: path.join(MESSAGES_DIR, locale, "critical.json"),
    deferred: path.join(MESSAGES_DIR, locale, "deferred.json"),
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function collectLeafPaths(obj, prefix = "") {
  const paths = [];

  if (!isPlainObject(obj)) return paths;

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(value)) {
      paths.push(...collectLeafPaths(value, currentPath));
    } else {
      paths.push(currentPath);
    }
  }

  return paths;
}

// Local copy to avoid importing runtime src/ into a build script; keep in sync with src/lib/merge-objects.ts
function mergeObjects(target, source) {
  const result = { ...target };

  for (const [key, sourceValue] of Object.entries(source)) {
    if (sourceValue === undefined) continue;
    const targetValue = result[key];

    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      result[key] = mergeObjects(targetValue, sourceValue);
      continue;
    }

    result[key] = sourceValue;
  }

  return result;
}

function composeCatalogMessages(locale) {
  const composed = { critical: {}, deferred: {} };

  for (const packId of CATALOG_MESSAGE_PACK_IDS) {
    for (const type of MESSAGE_TYPES) {
      const packPath = getPackAbsolutePath(packId, locale, type);
      const packMessages = readJson(packPath);
      composed[type] = mergeObjects(composed[type], packMessages);
    }
  }

  return composed;
}

function validatePackFile(packId, locale, type) {
  const relativePath = getPackRelativePath(packId, locale, type);
  const absolutePath = path.join(ROOT, relativePath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`   Error: pack file not found: ${relativePath}`);
    return false;
  }

  const messages = readJson(absolutePath);
  const leafPaths = collectLeafPaths(messages);

  if (leafPaths.length !== new Set(leafPaths).size) {
    const duplicates = leafPaths.filter(
      (leafPath, index) => leafPaths.indexOf(leafPath) !== index,
    );
    console.error(
      `   Error: duplicate leaf paths in ${relativePath}: ${duplicates.slice(0, 5).join(", ")}`,
    );
    return false;
  }

  return {
    packId,
    locale,
    type,
    leafPaths: new Set(leafPaths),
    leafCount: leafPaths.length,
  };
}

function compareLeafPathSets(leftLabel, leftPaths, rightLabel, rightPaths) {
  const missingInRight = [...leftPaths].filter(
    (leafPath) => !rightPaths.has(leafPath),
  );
  const extraInRight = [...rightPaths].filter(
    (leafPath) => !leftPaths.has(leafPath),
  );

  if (missingInRight.length === 0 && extraInRight.length === 0) {
    console.log(`   ${rightLabel} matches ${leftLabel}`);
    return true;
  }

  if (missingInRight.length > 0) {
    console.error(
      `   Error: ${rightLabel} is missing ${missingInRight.length} leaf paths from ${leftLabel}:`,
    );
    missingInRight
      .slice(0, 5)
      .forEach((leafPath) => console.error(`      - ${leafPath}`));
  }

  if (extraInRight.length > 0) {
    console.error(
      `   Error: ${rightLabel} has ${extraInRight.length} extra leaf paths vs ${leftLabel}:`,
    );
    extraInRight
      .slice(0, 5)
      .forEach((leafPath) => console.error(`      - ${leafPath}`));
  }

  return false;
}

// Dormant under single-locale (en). Auto-activates when LOCALES_CONFIG gains locales — owner 2026-07-11 decision to keep.
function validatePackLocaleParity() {
  console.log("\nValidating pack locale parity...");
  let allMatch = true;

  for (const packId of MESSAGE_PACK_IDS) {
    for (const type of MESSAGE_TYPES) {
      const [firstLocale, ...otherLocales] = I18N_LOCALES;
      const first = validatePackFile(packId, firstLocale, type);
      if (!first) {
        allMatch = false;
        continue;
      }

      for (const locale of otherLocales) {
        const current = validatePackFile(packId, locale, type);
        if (!current) {
          allMatch = false;
          continue;
        }

        if (
          !compareLeafPathSets(
            `${packId}/${firstLocale}/${type}`,
            first.leafPaths,
            `${packId}/${locale}/${type}`,
            current.leafPaths,
          )
        ) {
          allMatch = false;
        }
      }
    }
  }

  return allMatch;
}

// Dormant under single-locale (en). Auto-activates when LOCALES_CONFIG gains locales — owner 2026-07-11 decision to keep.
function validateComposedCatalogParity() {
  console.log("\nValidating composed catalog locale parity...");
  let allMatch = true;

  const [firstLocale, ...otherLocales] = I18N_LOCALES;
  const firstComposed = composeCatalogMessages(firstLocale);
  const firstAllPaths = new Set([
    ...collectLeafPaths(firstComposed.critical),
    ...collectLeafPaths(firstComposed.deferred),
  ]);

  for (const locale of otherLocales) {
    const composed = composeCatalogMessages(locale);
    const allPaths = new Set([
      ...collectLeafPaths(composed.critical),
      ...collectLeafPaths(composed.deferred),
    ]);

    if (
      !compareLeafPathSets(
        `catalog/${firstLocale}`,
        firstAllPaths,
        `catalog/${locale}`,
        allPaths,
      )
    ) {
      allMatch = false;
    }
  }

  return allMatch;
}

function validateCompatibilityFiles() {
  console.log("\nValidating compatibility files against catalog packs...");
  let allMatch = true;

  for (const locale of I18N_LOCALES) {
    const composed = composeCatalogMessages(locale);
    const { critical: criticalPath, deferred: deferredPath } =
      getLocaleSplitPaths(locale);

    for (const [type, composedMessages] of [
      ["critical", composed.critical],
      ["deferred", composed.deferred],
    ]) {
      const compatibilityPath =
        type === "critical" ? criticalPath : deferredPath;
      const relativePath = path.relative(ROOT, compatibilityPath);

      if (!fs.existsSync(compatibilityPath)) {
        console.error(
          `   Error: compatibility file not found: ${relativePath}`,
        );
        allMatch = false;
        continue;
      }

      const actual = readJson(compatibilityPath);
      const expectedText = `${JSON.stringify(composedMessages, null, 2)}\n`;
      const actualText = `${JSON.stringify(actual, null, 2)}\n`;

      if (expectedText !== actualText) {
        console.error(
          `   Error: ${relativePath} does not match composed catalog ${type} packs`,
        );
        allMatch = false;
        continue;
      }

      console.log(`   ${relativePath} matches composed catalog ${type}`);
    }
  }

  return allMatch;
}

function validateRequiredPackFiles() {
  console.log("\nValidating required pack files...");
  let allValid = true;

  for (const relativePath of REQUIRED_PACK_FILES) {
    const absolutePath = path.join(ROOT, relativePath);
    if (!fs.existsSync(absolutePath)) {
      console.error(`   Error: required pack file not found: ${relativePath}`);
      allValid = false;
    }
  }

  if (allValid) {
    console.log(
      `   All ${REQUIRED_PACK_FILES.length} required pack files exist`,
    );
  }

  return allValid;
}

function validateLocale(locale) {
  console.log(`\nValidating split canonical locale: ${locale}`);

  const { critical: criticalPath, deferred: deferredPath } =
    getLocaleSplitPaths(locale);

  if (!fs.existsSync(criticalPath)) {
    console.error(`   Error: critical.json not found: ${criticalPath}`);
    return false;
  }

  if (!fs.existsSync(deferredPath)) {
    console.error(`   Error: deferred.json not found: ${deferredPath}`);
    return false;
  }

  const critical = readJson(criticalPath);
  const deferred = readJson(deferredPath);
  const criticalKeys = collectLeafPaths(critical);
  const deferredKeys = collectLeafPaths(deferred);
  const criticalSet = new Set(criticalKeys);
  const deferredSet = new Set(deferredKeys);

  console.log(`   Critical keys: ${criticalKeys.length}`);
  console.log(`   Deferred keys: ${deferredKeys.length}`);
  console.log(`   Total keys: ${criticalKeys.length + deferredKeys.length}`);

  const deferredDuplicates = criticalKeys.filter((key) => deferredSet.has(key));
  if (deferredDuplicates.length > 0) {
    console.error(
      `   Error: Found ${deferredDuplicates.length} duplicate keys:`,
    );
    deferredDuplicates
      .slice(0, 10)
      .forEach((key) => console.error(`      - ${key}`));
    return false;
  }

  console.log("   No duplicate keys found");

  return {
    locale,
    criticalKeys: criticalSet,
    deferredKeys: deferredSet,
    totalKeys: criticalKeys.length + deferredKeys.length,
  };
}

// Dormant under single-locale (en). Auto-activates when LOCALES_CONFIG gains locales — owner 2026-07-11 decision to keep.
function compareLocales(localeData) {
  console.log("\nComparing locales...");
  const locales = Object.keys(localeData);
  if (locales.length < 2) {
    console.log("   Only one locale found, skipping comparison");
    return true;
  }

  const [firstLocale, ...otherLocales] = locales;
  const firstData = localeData[firstLocale];
  let allMatch = true;

  for (const locale of otherLocales) {
    const data = localeData[locale];

    if (data.totalKeys !== firstData.totalKeys) {
      console.error(
        `   Error: ${locale} has ${data.totalKeys} keys, but ${firstLocale} has ${firstData.totalKeys} keys`,
      );
      allMatch = false;
      continue;
    }

    const allKeys = new Set([...data.criticalKeys, ...data.deferredKeys]);
    const firstAllKeys = new Set([
      ...firstData.criticalKeys,
      ...firstData.deferredKeys,
    ]);
    const missingInLocale = [...firstAllKeys].filter(
      (key) => !allKeys.has(key),
    );
    const extraInLocale = [...allKeys].filter((key) => !firstAllKeys.has(key));

    if (missingInLocale.length > 0) {
      console.error(
        `   Error: ${locale} is missing ${missingInLocale.length} keys:`,
      );
      missingInLocale
        .slice(0, 5)
        .forEach((key) => console.error(`      - ${key}`));
      allMatch = false;
    }

    if (extraInLocale.length > 0) {
      console.error(
        `   Error: ${locale} has ${extraInLocale.length} extra keys:`,
      );
      extraInLocale
        .slice(0, 5)
        .forEach((key) => console.error(`      - ${key}`));
      allMatch = false;
    }

    if (missingInLocale.length === 0 && extraInLocale.length === 0) {
      console.log(`   ${locale} matches ${firstLocale}`);
    }
  }

  return allMatch;
}

function runTranslationCheck() {
  console.log("Translation Validation (catalog message packs)");
  console.log("===============================================");

  let allValid = true;

  if (!validateRequiredPackFiles()) {
    allValid = false;
  }

  for (const packId of MESSAGE_PACK_IDS) {
    for (const locale of I18N_LOCALES) {
      for (const type of MESSAGE_TYPES) {
        const result = validatePackFile(packId, locale, type);
        if (!result) {
          allValid = false;
        }
      }
    }
  }

  if (!validatePackLocaleParity()) {
    allValid = false;
  }

  if (!validateComposedCatalogParity()) {
    allValid = false;
  }

  if (!validateCompatibilityFiles()) {
    allValid = false;
  }

  const localeData = {};

  for (const locale of I18N_LOCALES) {
    const result = validateLocale(locale);
    if (!result) {
      allValid = false;
    } else {
      localeData[locale] = result;
    }
  }

  if (!allValid) {
    console.error("\nValidation failed.\n");
    return false;
  }

  if (!compareLocales(localeData)) {
    console.error("\nLocales do not match.\n");
    return false;
  }

  console.log("\nAll validations passed.");
  for (const [locale, data] of Object.entries(localeData)) {
    console.log(
      `${locale.toUpperCase()}: ${data.totalKeys} total keys (${data.criticalKeys.size} critical + ${data.deferredKeys.size} deferred)`,
    );
  }

  return true;
}

module.exports = {
  collectLeafPaths,
  compareLocales,
  composeCatalogMessages,
  runTranslationCheck,
  validateLocale,
};
