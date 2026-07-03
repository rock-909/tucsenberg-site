const fs = require("node:fs");
const path = require("node:path");
const matter = require("gray-matter");
const { glob } = require("glob");
const yaml = require("js-yaml");

const DEFAULT_COLLECTIONS = ["posts", "pages", "products"];
const FALLBACK_LOCALES = ["en"];
const DEFAULT_CONTENT_EXTENSIONS = ["md", "mdx"];
const DEFAULT_CONTENT_ROOTS = ["content"];
const CONTENT_SLUG_SYNC_ROOTS = [
  "content",
  "profile-fixtures/showcase-full/content",
];
const REPORT_DIR = "reports";
const CONTENT_SLUG_REPORT_FILENAME = "content-slug-sync-report.json";
const REQUIRED_FRONTMATTER_STRING_FIELDS = [
  "locale",
  "title",
  "description",
  "slug",
  "publishedAt",
  "updatedAt",
];
const REQUIRED_SEO_STRING_FIELDS = ["title", "description"];
const OPTIONAL_DATE_FIELDS = ["lastReviewed"];
const STRICT_STARTER_OG_IMAGES = new Set([
  "/images/og-image.jpg",
  "/images/about-og.jpg",
]);
const DATE_FIELD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const matterOptions = {
  engines: {
    yaml: {
      parse: (str) => yaml.load(str),
      stringify: (obj) => yaml.dump(obj),
    },
  },
};

function loadDefaultLocales(rootDir = process.cwd()) {
  const localeConfigPath = path.join(rootDir, "i18n-locales.config.js");

  if (!fs.existsSync(localeConfigPath)) {
    return FALLBACK_LOCALES;
  }

  const configSource = fs.readFileSync(localeConfigPath, "utf8");
  const localesMatch = configSource.match(/locales:\s*\[([^\]]*)\]/u);
  if (!localesMatch) {
    return FALLBACK_LOCALES;
  }

  const locales = localesMatch[1].split(",").flatMap((rawLocale) => {
    const locale = rawLocale.trim().replace(/^["']|["']$/gu, "");
    return locale ? [locale] : [];
  });

  return locales.length > 0 ? locales : FALLBACK_LOCALES;
}

const DEFAULT_LOCALES = loadDefaultLocales();

function buildKey(rootDir, filePath, contentRoot, collection, locale) {
  const localeRoot = path.join(rootDir, contentRoot, collection, locale);
  const relative = path.relative(localeRoot, filePath);
  return `${contentRoot}/${collection}/${relative.replace(/\\/g, "/")}`;
}

function parseFrontmatter(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(content, matterOptions);

    if (!data || typeof data.slug !== "string") {
      return {
        slug: null,
        error: "frontmatter.slug is missing or not a string",
      };
    }

    return { slug: data.slug, error: null };
  } catch (err) {
    return { slug: null, error: `Failed to parse: ${err.message}` };
  }
}

function collectPairs(
  rootDir,
  contentRoot,
  collection,
  baseLocale,
  targetLocale,
) {
  const basePattern = path.join(
    rootDir,
    contentRoot,
    collection,
    baseLocale,
    "**/*.mdx",
  );
  const targetPattern = path.join(
    rootDir,
    contentRoot,
    collection,
    targetLocale,
    "**/*.mdx",
  );
  const pairMap = new Map();

  for (const filePath of glob.sync(basePattern).sort()) {
    const key = buildKey(
      rootDir,
      filePath,
      contentRoot,
      collection,
      baseLocale,
    );
    const entry = pairMap.get(key) || {};
    entry.basePath = filePath;
    pairMap.set(key, entry);
  }

  for (const filePath of glob.sync(targetPattern).sort()) {
    const key = buildKey(
      rootDir,
      filePath,
      contentRoot,
      collection,
      targetLocale,
    );
    const entry = pairMap.get(key) || {};
    entry.targetPath = filePath;
    pairMap.set(key, entry);
  }

  return pairMap;
}

function validateCollectionPair(
  rootDir,
  contentRoot,
  collection,
  baseLocale,
  targetLocale,
) {
  const issues = [];
  const pairMap = collectPairs(
    rootDir,
    contentRoot,
    collection,
    baseLocale,
    targetLocale,
  );
  let fileCount = 0;

  const orderedPairs = Array.from(pairMap.entries()).sort(([keyA], [keyB]) =>
    keyA.localeCompare(keyB),
  );

  for (const [, { basePath, targetPath }] of orderedPairs) {
    fileCount += (basePath ? 1 : 0) + (targetPath ? 1 : 0);

    if (!basePath || !targetPath) {
      const missingLocale = !basePath ? baseLocale : targetLocale;
      const existingPath = basePath || targetPath;
      issues.push({
        type: "missing_pair",
        collection,
        baseLocale,
        targetLocale,
        basePath,
        targetPath,
        message: `Missing ${missingLocale} counterpart for: ${path.basename(existingPath)}`,
      });
      continue;
    }

    const baseResult = parseFrontmatter(basePath);
    const targetResult = parseFrontmatter(targetPath);

    if (baseResult.error || targetResult.error) {
      issues.push({
        type: "parse_error",
        collection,
        baseLocale,
        targetLocale,
        basePath,
        targetPath,
        message: "Failed to parse frontmatter.slug",
        error: baseResult.error || targetResult.error,
      });
      continue;
    }

    if (baseResult.slug !== targetResult.slug) {
      issues.push({
        type: "slug_mismatch",
        collection,
        baseLocale,
        targetLocale,
        basePath,
        targetPath,
        baseSlug: baseResult.slug,
        targetSlug: targetResult.slug,
        message: `Slug mismatch: "${baseResult.slug}" (${baseLocale}) vs "${targetResult.slug}" (${targetLocale})`,
      });
    }
  }

  return {
    issues,
    pairCount: pairMap.size,
    fileCount,
  };
}

function validateMdxSlugSync(options) {
  const {
    rootDir,
    collections = DEFAULT_COLLECTIONS,
    locales = DEFAULT_LOCALES,
    baseLocale = locales[0],
    contentRoots = CONTENT_SLUG_SYNC_ROOTS,
  } = options;
  const issues = [];
  const targetLocales = locales.filter((locale) => locale !== baseLocale);
  let totalFiles = 0;
  let totalPairs = 0;

  for (const contentRoot of contentRoots) {
    for (const collection of collections) {
      for (const targetLocale of targetLocales) {
        const result = validateCollectionPair(
          rootDir,
          contentRoot,
          collection,
          baseLocale,
          targetLocale,
        );
        issues.push(...result.issues);
        totalFiles += result.fileCount;
        totalPairs += result.pairCount;
      }
    }
  }

  return {
    ok: issues.length === 0,
    checkedCollections: collections,
    checkedLocales: locales,
    issues,
    stats: {
      totalFiles,
      totalPairs,
      missingPairs: issues.filter((issue) => issue.type === "missing_pair")
        .length,
      slugMismatches: issues.filter((issue) => issue.type === "slug_mismatch")
        .length,
      parseErrors: issues.filter((issue) => issue.type === "parse_error")
        .length,
    },
  };
}

function parseFrontmatterData(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(content, matterOptions);

    return { data: data || {}, error: null };
  } catch (err) {
    return { data: {}, error: `Failed to parse: ${err.message}` };
  }
}

function pushFrontmatterIssue(issues, issue) {
  issues.push({
    ...issue,
    message: `[${issue.type}] ${issue.field}: ${issue.message}`,
  });
}

function validateFrontmatterFile({
  collection,
  expectedLocale,
  filePath,
  strictFrontmatter,
}) {
  const issues = [];
  const { data, error } = parseFrontmatterData(filePath);
  const expectedSlug = path.basename(filePath, path.extname(filePath));

  if (error) {
    pushFrontmatterIssue(issues, {
      type: "invalid_field",
      collection,
      locale: expectedLocale,
      filePath,
      field: "frontmatter",
      message: error,
    });
    return issues;
  }

  for (const field of REQUIRED_FRONTMATTER_STRING_FIELDS) {
    if (!(field in data)) {
      pushFrontmatterIssue(issues, {
        type: "missing_field",
        collection,
        locale: expectedLocale,
        filePath,
        field,
        message: `${field} is required`,
      });
      continue;
    }

    if (typeof data[field] !== "string" || data[field].trim() === "") {
      pushFrontmatterIssue(issues, {
        type: "invalid_field",
        collection,
        locale: expectedLocale,
        filePath,
        field,
        message: `${field} must be a non-empty string`,
      });
    }
  }

  if (typeof data.locale === "string" && data.locale !== expectedLocale) {
    pushFrontmatterIssue(issues, {
      type: "invalid_field",
      collection,
      locale: expectedLocale,
      filePath,
      field: "locale",
      message: `locale must match directory locale "${expectedLocale}"`,
    });
  }

  if (typeof data.slug === "string" && data.slug !== expectedSlug) {
    pushFrontmatterIssue(issues, {
      type: "invalid_field",
      collection,
      locale: expectedLocale,
      filePath,
      field: "slug",
      message: `slug must match file slug "${expectedSlug}"`,
    });
  }

  for (const field of ["publishedAt", "updatedAt", ...OPTIONAL_DATE_FIELDS]) {
    if (
      field in data &&
      (typeof data[field] !== "string" || !DATE_FIELD_PATTERN.test(data[field]))
    ) {
      pushFrontmatterIssue(issues, {
        type: "invalid_field",
        collection,
        locale: expectedLocale,
        filePath,
        field,
        message: `${field} must use YYYY-MM-DD`,
      });
    }
  }

  if ("draft" in data && typeof data.draft !== "boolean") {
    pushFrontmatterIssue(issues, {
      type: "invalid_field",
      collection,
      locale: expectedLocale,
      filePath,
      field: "draft",
      message: "draft must be boolean when present",
    });
  }

  const seo =
    data.seo && typeof data.seo === "object" && !Array.isArray(data.seo)
      ? data.seo
      : {};
  for (const field of REQUIRED_SEO_STRING_FIELDS) {
    if (!(field in seo)) {
      pushFrontmatterIssue(issues, {
        type: "missing_seo_field",
        collection,
        locale: expectedLocale,
        filePath,
        field: `seo.${field}`,
        message: `seo.${field} is required`,
      });
      continue;
    }

    if (typeof seo[field] !== "string" || seo[field].trim() === "") {
      pushFrontmatterIssue(issues, {
        type: "invalid_field",
        collection,
        locale: expectedLocale,
        filePath,
        field: `seo.${field}`,
        message: `seo.${field} must be a non-empty string`,
      });
    }
  }

  if (
    strictFrontmatter &&
    typeof seo.ogImage === "string" &&
    STRICT_STARTER_OG_IMAGES.has(seo.ogImage)
  ) {
    pushFrontmatterIssue(issues, {
      type: "starter_og_image",
      collection,
      locale: expectedLocale,
      filePath,
      field: "seo.ogImage",
      message: `starter OG image must be replaced: ${seo.ogImage}`,
    });
  }

  return issues;
}

function validateContentFrontmatterContract(options) {
  const {
    rootDir,
    collections = DEFAULT_COLLECTIONS,
    locales = DEFAULT_LOCALES,
    extensions = DEFAULT_CONTENT_EXTENSIONS,
    strictFrontmatter = false,
    contentRoots = ["content"],
  } = options;
  const issues = [];
  let totalFiles = 0;

  for (const contentRoot of contentRoots) {
    for (const collection of collections) {
      for (const locale of locales) {
        const patterns = extensions.map((extension) =>
          path.join(
            rootDir,
            contentRoot,
            collection,
            locale,
            `**/*.${extension}`,
          ),
        );
        const filePaths = Array.from(
          new Set(patterns.flatMap((pattern) => glob.sync(pattern))),
        ).sort();
        for (const filePath of filePaths) {
          totalFiles += 1;
          issues.push(
            ...validateFrontmatterFile({
              collection,
              expectedLocale: locale,
              filePath,
              strictFrontmatter,
            }),
          );
        }
      }
    }
  }

  return {
    ok: issues.length === 0,
    checkedCollections: collections,
    checkedLocales: locales,
    issues,
    stats: {
      totalFiles,
      missingFields: issues.filter((issue) => issue.type === "missing_field")
        .length,
      invalidFields: issues.filter((issue) => issue.type === "invalid_field")
        .length,
      missingSeoFields: issues.filter(
        (issue) => issue.type === "missing_seo_field",
      ).length,
      starterOgImages: issues.filter(
        (issue) => issue.type === "starter_og_image",
      ).length,
    },
  };
}

function parseContentSlugArgs(args) {
  const options = {
    json: false,
    quiet: false,
    help: false,
    strictFrontmatter: false,
    collections: DEFAULT_COLLECTIONS,
    locales: DEFAULT_LOCALES,
    localesExplicit: false,
  };

  for (const arg of args) {
    if (arg === "--json") {
      options.json = true;
    } else if (arg === "--quiet") {
      options.quiet = true;
    } else if (arg === "--strict-frontmatter") {
      options.strictFrontmatter = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg.startsWith("--collections=")) {
      options.collections = arg
        .split("=")[1]
        .split(",")
        .flatMap((item) => {
          const trimmed = item.trim();
          return trimmed ? [trimmed] : [];
        });
    } else if (arg.startsWith("--locales=")) {
      options.localesExplicit = true;
      options.locales = arg
        .split("=")[1]
        .split(",")
        .flatMap((item) => {
          const trimmed = item.trim();
          return trimmed ? [trimmed] : [];
        });
    }
  }

  return options;
}

function printContentSlugHelp() {
  console.log(`
MDX Content Slug Sync Validator

Usage:
  node scripts/starter-checks.js content-slugs [options]

Options:
  --json              Output JSON report to reports/content-slug-sync-report.json
  --collections=x,y   Collections to check (default: posts,pages,products)
  --locales=x,y       Locales to check (default: ${DEFAULT_LOCALES.join(",")})
  --strict-frontmatter Run opt-in frontmatter/SEO contract checks
  --quiet             Only output errors
  --help, -h          Show this help

Examples:
  node scripts/starter-checks.js content-slugs
  node scripts/starter-checks.js content-slugs --json
  node scripts/starter-checks.js content-slugs --strict-frontmatter
  node scripts/starter-checks.js content-slugs --collections=products --locales=en,ja
`);
}

function printContentSlugSummary(result, options) {
  console.log("\nMDX Slug Sync Validation");
  console.log("========================\n");

  if (!options.quiet) {
    console.log(`Collections: ${result.checkedCollections.join(", ")}`);
    console.log(`Locales: ${result.checkedLocales.join(", ")}`);
    console.log(`Total files: ${result.stats.totalFiles}`);
    console.log(`Total pairs: ${result.stats.totalPairs}\n`);
  }

  if (result.ok) {
    console.log("All slug validations passed.\n");
    return;
  }

  const missingPairs = result.issues.filter(
    (issue) => issue.type === "missing_pair",
  );
  if (missingPairs.length > 0) {
    console.log(`Missing Pairs (${missingPairs.length}):`);
    for (const issue of missingPairs) {
      const existingFile = issue.basePath || issue.targetPath;
      const missingLocale = issue.basePath
        ? issue.targetLocale
        : issue.baseLocale;
      console.log(
        `   - [${issue.collection}] ${path.basename(existingFile)} (missing ${missingLocale})`,
      );
    }
    console.log("");
  }

  const slugMismatches = result.issues.filter(
    (issue) => issue.type === "slug_mismatch",
  );
  if (slugMismatches.length > 0) {
    console.log(`Slug Mismatches (${slugMismatches.length}):`);
    for (const issue of slugMismatches) {
      console.log(
        `   - [${issue.collection}] ${path.basename(issue.basePath)}`,
      );
      console.log(`     ${issue.baseLocale}: "${issue.baseSlug}"`);
      console.log(`     ${issue.targetLocale}: "${issue.targetSlug}"`);
    }
    console.log("");
  }

  const parseErrors = result.issues.filter(
    (issue) => issue.type === "parse_error",
  );
  if (parseErrors.length > 0) {
    console.log(`Parse Errors (${parseErrors.length}):`);
    for (const issue of parseErrors) {
      const file = issue.basePath || issue.targetPath;
      console.log(`   - [${issue.collection}] ${path.basename(file)}`);
      if (issue.error) console.log(`     Error: ${issue.error}`);
    }
    console.log("");
  }

  console.log("Summary:");
  console.log(`   Missing pairs: ${result.stats.missingPairs}`);
  console.log(`   Slug mismatches: ${result.stats.slugMismatches}`);
  console.log(`   Parse errors: ${result.stats.parseErrors}`);
  console.log(`   Total issues: ${result.issues.length}\n`);
}

function printFrontmatterContractSummary(result, options) {
  console.log("\nFrontmatter/SEO Contract Validation");
  console.log("===================================\n");

  if (!options.quiet) {
    console.log(`Collections: ${result.checkedCollections.join(", ")}`);
    console.log(`Locales: ${result.checkedLocales.join(", ")}`);
    console.log(`Total files: ${result.stats.totalFiles}\n`);
  }

  if (result.ok) {
    console.log("All frontmatter/SEO contract validations passed.\n");
    return;
  }

  const groups = [
    ["Missing Fields", "missing_field"],
    ["Invalid Fields", "invalid_field"],
    ["Missing SEO Fields", "missing_seo_field"],
    ["Starter OG Images", "starter_og_image"],
  ];

  for (const [label, type] of groups) {
    const groupedIssues = result.issues.filter((issue) => issue.type === type);
    if (groupedIssues.length === 0) continue;

    console.log(`${label} (${groupedIssues.length}):`);
    for (const issue of groupedIssues) {
      console.log(
        `   - [${issue.collection}/${issue.locale}] ${path.basename(issue.filePath)} ${issue.field}`,
      );
      console.log(`     ${issue.message}`);
    }
    console.log("");
  }

  console.log("Frontmatter/SEO summary:");
  console.log(`   Missing fields: ${result.stats.missingFields}`);
  console.log(`   Invalid fields: ${result.stats.invalidFields}`);
  console.log(`   Missing SEO fields: ${result.stats.missingSeoFields}`);
  console.log(`   Starter OG images: ${result.stats.starterOgImages}`);
  console.log(`   Total issues: ${result.issues.length}\n`);
}

function writeContentSlugJsonReport(result, rootDir) {
  const reportDir = path.join(rootDir, REPORT_DIR);
  const reportPath = path.join(reportDir, CONTENT_SLUG_REPORT_FILENAME);

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        tool: "content-slug-sync",
        version: "1.0.0",
        ...result,
      },
      null,
      2,
    ),
  );
  console.log(`JSON report saved to: ${reportPath}\n`);
}

function runContentSlugCheck(args = [], rootDir = process.cwd()) {
  const options = parseContentSlugArgs(args);
  if (options.help) {
    printContentSlugHelp();
    return true;
  }
  if (options.collections.length === 0) {
    console.error("Error: No collections specified");
    return false;
  }
  const isImplicitSingleLocale =
    options.locales.length < 2 && !options.localesExplicit;

  if (options.locales.length < 2) {
    if (options.localesExplicit) {
      console.error("Error: At least 2 locales are required for comparison");
      return false;
    }
  }

  const result = validateMdxSlugSync({
    rootDir,
    collections: options.collections,
    locales: options.locales,
    contentRoots: CONTENT_SLUG_SYNC_ROOTS,
  });
  if (isImplicitSingleLocale) {
    console.log("\nMDX Slug Sync Validation");
    console.log("========================\n");
    console.log(`Collections: ${options.collections.join(", ")}`);
    console.log(`Locales: ${options.locales.join(", ")}`);
    console.log("Single locale site: localized slug pair comparison skipped.");
  } else {
    printContentSlugSummary(result, options);
  }
  let finalResult = result;

  if (options.strictFrontmatter) {
    const frontmatterResult = validateContentFrontmatterContract({
      rootDir,
      collections: options.collections,
      locales: options.locales,
      strictFrontmatter: true,
      contentRoots: CONTENT_SLUG_SYNC_ROOTS,
    });
    printFrontmatterContractSummary(frontmatterResult, options);

    finalResult = {
      ...result,
      ok: result.ok && frontmatterResult.ok,
      slugSync: result,
      frontmatterContract: frontmatterResult,
    };
  }

  if (options.json) writeContentSlugJsonReport(finalResult, rootDir);

  return finalResult.ok;
}

module.exports = {
  buildKey,
  collectPairs,
  parseContentSlugArgs,
  parseFrontmatter,
  runContentSlugCheck,
  validateContentFrontmatterContract,
  validateCollectionPair,
  validateMdxSlugSync,
  writeContentSlugJsonReport,
};
