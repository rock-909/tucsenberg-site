const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const I18N_LOCALES = require("../../../i18n-locales.config").locales;
const MESSAGES_DIR = path.join(ROOT, "messages");

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
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

function getLocaleSplitPaths(locale) {
  return {
    critical: path.join(MESSAGES_DIR, locale, "critical.json"),
    deferred: path.join(MESSAGES_DIR, locale, "deferred.json"),
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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
  console.log("Translation Validation (split canonical)");
  console.log("========================================");

  const localeData = {};
  let allValid = true;

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
  runTranslationCheck,
  validateLocale,
};
