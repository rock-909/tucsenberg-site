#!/usr/bin/env node

const fs = require("node:fs");
const {
  access,
  lstat,
  mkdir,
  readFile,
  rename,
  symlink,
  writeFile,
} = require("node:fs/promises");
const path = require("node:path");
const matter = require("gray-matter");
const { config: loadDotenv } = require("dotenv");
const yaml = require("js-yaml");
const ts = require("typescript");
const { runBrandCheck } = require("./quality/checks/brand");
const {
  buildKey,
  collectPairs,
  parseContentSlugArgs,
  parseFrontmatter,
  runContentSlugCheck,
  validateContentFrontmatterContract,
  validateCollectionPair,
  validateMdxSlugSync,
} = require("./quality/checks/content-slugs");
const {
  getExpectedClientBoundary,
  getExpectedRadixLayer,
  getExpectedThemeBoundary,
} = require("./component-governance-registry-truth");
const {
  collectClientBoundaryFiles,
  hasTopLevelUseClientDirective,
  runClientBoundaryBudgetCheck,
  runClientBoundaryCli,
} = require("./quality/checks/client-boundary");
const {
  analyzeFile,
  analyzeSource,
  collectRegisteredGuardrailExceptionIds,
  getActiveGuardrailExceptionSection,
  isProductionFile,
  isStructuralGuardrailExemptPath,
  isTestFile,
  parseGuardrailException,
  runEslintDisableCheck,
  STRUCTURAL_GUARDRAIL_RULES,
} = require("./quality/checks/eslint-disable");
const {
  collectLeafPaths,
  compareLocales,
  runTranslationCheck,
  validateLocale,
} = require("./quality/checks/translations");
const {
  RELEASE_PROOF_MANIFEST,
  RELEASE_PROOF_SEQUENCE,
  RELEASE_VERIFY_COMMANDS,
  formatReleaseCommand,
  getReleaseProofDocsCommandBlock,
  runReleaseVerify,
} = require("./quality/checks/release-verify");
const {
  CHECKS: TRUTH_DOC_CHECKS,
  collectCurrentTruthDocFindings,
  findCommandLineIndex,
  findOutOfOrderCommand,
  runTruthDocsCheck,
} = require("./quality/checks/current-truth-docs");
const {
  collectCloudflareOfficialCompareFailures,
  runCloudflareOfficialCompareCli,
} = require("./quality/checks/cloudflare-official-compare");
const {
  runCloudflareStaticAssetHeaderCli,
} = require("./quality/checks/cloudflare-static-asset-headers");
const {
  runValidateProductionConfigCli,
  shouldValidateProductionRuntimeContract,
  validateProductionConfig,
  validateProductionRuntimeContract,
  validatePublicLaunchTrustContent,
} = require("./quality/checks/production-config");
const {
  CONTENT_READINESS_PROFILE_IDS,
  collectContentReadinessFindings,
  runContentReadinessCheck,
  runContentReadinessCli,
} = require("./quality/checks/content-readiness");
const {
  runCloudflarePreviewDeployedProof,
  runCloudflarePreviewSmoke,
  runDeployedSmoke,
  runPublicPreviewSmoke,
} = require("./quality/checks/cloudflare-smoke");
const i18nLocalesConfig = require("../i18n-locales.config.js");

const ROOT = process.cwd();

function parseJsoncText(filePath, content) {
  const parsed = ts.parseConfigFileTextToJson(filePath, content);
  if (parsed.error) {
    throw new Error(
      ts.flattenDiagnosticMessageText(parsed.error.messageText, "\n"),
    );
  }
  return parsed.config;
}

function toRepoPath(rootDir, absolutePath) {
  return path.relative(rootDir, absolutePath).split(path.sep).join("/");
}

function getLineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}

// ---------------------------------------------------------------------------
// content manifest
// ---------------------------------------------------------------------------

const CONTENT_TYPES = ["posts", "pages", "products"];
const CONTENT_MANIFEST_LOCALES = i18nLocalesConfig.locales;
const CONTENT_MANIFEST_SOURCES = [
  {
    source: "active-content",
    root: "content",
  },
  {
    source: "profile-fixture",
    root: "profile-fixtures/showcase-full/content",
    profileId: "showcase-full",
  },
];
const VALID_CONTENT_EXTENSIONS = new Set([".mdx", ".md"]);

function createContentManifestContext(rootDir = ROOT) {
  return {
    rootDir,
    contentDir: path.join(rootDir, "content"),
    importersOutput: path.join(
      rootDir,
      "src",
      "lib",
      "mdx-importers.generated.ts",
    ),
    manifestTsOutput: path.join(
      rootDir,
      "src",
      "lib",
      "content-manifest.generated.ts",
    ),
  };
}

function scanContentManifestDirectory(
  context,
  sourceConfig,
  contentType,
  locale,
) {
  const dirPath = path.join(
    context.rootDir,
    sourceConfig.root,
    contentType,
    locale,
  );
  const entries = [];

  if (!fs.existsSync(dirPath)) {
    return entries;
  }

  const files = fs.readdirSync(dirPath).sort();

  for (const file of files) {
    const ext = path.extname(file);
    if (!VALID_CONTENT_EXTENSIONS.has(ext)) {
      continue;
    }

    const slug = path.basename(file, ext);
    const filePath = path.join(dirPath, file);
    const fileContent = fs.readFileSync(filePath, "utf8");
    const { data: metadata, content } = matter(fileContent, {
      engines: {
        yaml: (source) => yaml.load(source),
      },
    });
    const relativePath = path
      .relative(context.rootDir, filePath)
      .split(path.sep)
      .join("/");
    const stableFilePath = `/${relativePath}`;

    entries.push({
      type: contentType,
      locale,
      slug,
      extension: ext,
      filePath: stableFilePath,
      relativePath,
      source: sourceConfig.source,
      ...(sourceConfig.profileId ? { profileId: sourceConfig.profileId } : {}),
      metadata,
      content,
    });
  }

  return entries;
}

function buildContentManifestKey(type, locale, slug) {
  return `${type}/${locale}/${slug}`;
}

function assertContentManifestFrontmatterValid(context) {
  const result = validateContentFrontmatterContract({
    rootDir: context.rootDir,
    collections: CONTENT_TYPES,
    locales: CONTENT_MANIFEST_LOCALES,
    strictFrontmatter: false,
    contentRoots: CONTENT_MANIFEST_SOURCES.map(
      (sourceConfig) => sourceConfig.root,
    ),
  });

  if (result.ok) {
    return;
  }

  const detail = result.issues
    .slice(0, 10)
    .map((issue) => `- ${issue.filePath}: ${issue.message}`)
    .join("\n");

  throw new Error(`Content manifest frontmatter validation failed:\n${detail}`);
}

function generateContentManifest(context = createContentManifestContext()) {
  assertContentManifestFrontmatterValid(context);

  const entries = [];

  for (const sourceConfig of CONTENT_MANIFEST_SOURCES) {
    for (const contentType of CONTENT_TYPES) {
      for (const locale of CONTENT_MANIFEST_LOCALES) {
        entries.push(
          ...scanContentManifestDirectory(
            context,
            sourceConfig,
            contentType,
            locale,
          ),
        );
      }
    }
  }

  const byKey = {};
  for (const entry of entries) {
    const key = buildContentManifestKey(entry.type, entry.locale, entry.slug);
    if (byKey[key]) {
      throw new Error(
        `Duplicate slug "${key}": found in both "${byKey[key].filePath}" and "${entry.filePath}"`,
      );
    }
    byKey[key] = entry;
  }

  return {
    entries,
    byKey,
  };
}

function ensureOutputDir(outputPath) {
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}

let atomicWriteCounter = 0;

function writeFileAtomic(outputPath, content) {
  ensureOutputDir(outputPath);
  atomicWriteCounter += 1;
  const tempPath = `${outputPath}.tmp-${process.pid}-${Date.now()}-${atomicWriteCounter}`;
  fs.writeFileSync(tempPath, content);
  fs.renameSync(tempPath, outputPath);
}

function generateImportersCode(context, entries) {
  const entriesByType = new Map();

  for (const entry of entries) {
    let typeMap = entriesByType.get(entry.type);
    if (typeMap === undefined) {
      typeMap = new Map();
      entriesByType.set(entry.type, typeMap);
    }
    let localeEntries = typeMap.get(entry.locale);
    if (localeEntries === undefined) {
      localeEntries = [];
      typeMap.set(entry.locale, localeEntries);
    }
    localeEntries.push(entry);
  }

  const lines = [
    "/**",
    " * AUTO-GENERATED FILE - DO NOT EDIT",
    " *",
    " * Generated by: node scripts/starter-checks.js content-manifest",
    " *",
    " * This file provides static import maps for MDX content.",
    " * To update, add/remove/rename content files and re-run the generator.",
    " */",
    "",
    "import type { ComponentType } from 'react';",
    "",
    "export interface MDXContentModule {",
    "  default: ComponentType;",
    "  frontmatter?: Record<string, unknown>;",
    "}",
    "",
    "type ContentImporter = () => Promise<MDXContentModule>;",
    "",
  ];

  const typeToExportName = {
    posts: "postImporters",
    pages: "pageImporters",
    products: "productImporters",
  };

  for (const contentType of CONTENT_TYPES) {
    const typeMap = entriesByType.get(contentType);
    const exportName = typeToExportName[contentType];

    lines.push(
      `export const ${exportName}: Record<string, Record<string, ContentImporter>> = {`,
    );

    for (const locale of CONTENT_MANIFEST_LOCALES) {
      const localeEntries = typeMap?.get(locale) ?? [];
      lines.push(`  ${locale}: {`);

      for (const entry of localeEntries) {
        const generatedDir = path.join(context.rootDir, "src", "lib");
        const relativeImporterPath = path
          .relative(
            generatedDir,
            path.join(context.rootDir, entry.relativePath),
          )
          .split(path.sep)
          .join("/");
        const importerPath = relativeImporterPath.startsWith(".")
          ? relativeImporterPath
          : `./${relativeImporterPath}`;
        lines.push(`    '${entry.slug}': () => import('${importerPath}'),`);
      }

      lines.push("  },");
    }

    lines.push("};");
    lines.push("");
  }

  return lines.join("\n");
}

function generateManifestTsCode(manifest) {
  const entriesJson = JSON.stringify(manifest.entries, null, 2);
  const entryIndexes = new Map(
    manifest.entries.map((entry, index) => [entry, index]),
  );
  const byKeyIndex = {};

  for (const [key, entry] of Object.entries(manifest.byKey)) {
    byKeyIndex[key] = entryIndexes.get(entry);
  }

  const byKeyIndexJson = JSON.stringify(byKeyIndex, null, 2);

  return `/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Generated by: node scripts/starter-checks.js content-manifest
 *
 * This file provides statically bundled content manifest data.
 * No runtime fs dependency - works in dev and production builds.
 */

import type { ContentType, Locale } from '@/types/content.types';

export interface ContentEntry {
  type: ContentType;
  locale: Locale;
  slug: string;
  extension: string;
  filePath: string;
  relativePath: string;
  source: "active-content" | "profile-fixture";
  profileId?: "showcase-full";
  metadata: Record<string, unknown>;
  content: string;
}

export interface ContentManifest {
  entries: ContentEntry[];
  byKey: Record<string, ContentEntry>;
}

const _entries: ContentEntry[] = ${entriesJson};

const _byKeyIndex: Record<string, number> = ${byKeyIndexJson};

const _byKey: Record<string, ContentEntry> = Object.fromEntries(
  Object.entries(_byKeyIndex).map(([key, idx]) => [key, _entries[idx]!]),
);

export const CONTENT_MANIFEST: ContentManifest = {
  entries: _entries,
  byKey: _byKey,
} as const;
`;
}

function readTextIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
}

function runContentManifestGenerator(
  context = createContentManifestContext(),
  options = {},
) {
  const checkOnly = options.check === true;
  console.log(
    checkOnly
      ? "Checking content manifest and import map..."
      : "Generating content manifest and import map...",
  );

  const manifest = generateContentManifest(context);
  const importersCode = generateImportersCode(context, manifest.entries);
  const manifestTsCode = generateManifestTsCode(manifest);

  if (checkOnly) {
    const staleOutputs = [
      [context.importersOutput, importersCode],
      [context.manifestTsOutput, manifestTsCode],
    ].flatMap(([filePath, expected]) =>
      readTextIfExists(filePath) === expected ? [] : [filePath],
    );

    if (staleOutputs.length === 0) {
      console.log("Content manifest artifacts are fresh.");
      return true;
    }

    console.error("Content manifest artifacts are stale:");
    for (const filePath of staleOutputs) {
      console.error(`  - ${filePath}`);
    }
    console.error(
      "Run `node scripts/starter-checks.js content-manifest` to refresh them.",
    );
    return false;
  }

  if (context.reportOutput !== undefined) {
    writeFileAtomic(context.reportOutput, JSON.stringify(manifest, null, 2));
  }
  writeFileAtomic(context.importersOutput, importersCode);
  writeFileAtomic(context.manifestTsOutput, manifestTsCode);

  console.log(`Generated manifest with ${manifest.entries.length} entries`);
  let outputIndex = 1;
  if (context.reportOutput !== undefined) {
    console.log(`Output ${outputIndex}: ${context.reportOutput}`);
    outputIndex += 1;
  }
  console.log(`Output ${outputIndex}: ${context.importersOutput}`);
  outputIndex += 1;
  console.log(`Output ${outputIndex}: ${context.manifestTsOutput}`);

  const summary = {};
  for (const entry of manifest.entries) {
    const key = `${entry.type}/${entry.locale}`;
    summary[key] = (summary[key] ?? 0) + 1;
  }

  console.log("\nSummary:");
  for (const [key, count] of Object.entries(summary)) {
    console.log(`  ${key}: ${count} files`);
  }

  return true;
}

// ---------------------------------------------------------------------------
// production config
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// component governance
// ---------------------------------------------------------------------------

const COMPONENT_GOVERNANCE_REGISTRY_PATH =
  "src/components/component-governance.registry.json";
const COMPONENT_GOVERNANCE_COMPONENTS_ROOT = "src/components";
const COMPONENT_GOVERNANCE_APP_ROOT = "src/app";
const COMPONENT_GOVERNANCE_UI_ROOT = "src/components/ui";
const COMPONENT_GOVERNANCE_REQUIRED_STORY_VALUE = "required";
const COMPONENT_GOVERNANCE_AGENT_INDEX_FIELDS = [
  "radixLayer",
  "surface",
  "clientBoundary",
  "themeBoundary",
  "useWhen",
  "avoidWhen",
];
const COMPONENT_GOVERNANCE_AGENT_INDEX_ALLOWED_VALUES = {
  radixLayer: new Set(["primitive", "themes", "local", "mixed"]),
  surface: new Set([
    "control",
    "navigation",
    "feedback",
    "form",
    "form-internal",
    "data",
    "narrative",
    "layout",
    "utility",
    "theme",
  ]),
  clientBoundary: new Set(["server-safe", "client"]),
  themeBoundary: new Set(["self-contained", "parent-scoped", "none"]),
};
const COMPONENT_GOVERNANCE_SOURCE_FILE_PATTERN = /\.(?:ts|tsx|js|jsx)$/;
const COMPONENT_GOVERNANCE_UI_PRIMITIVE_FILE_PATTERN = /\.(?:tsx|jsx)$/;
const COMPONENT_GOVERNANCE_EXCLUDED_FILE_PATTERN =
  /(?:\.stories\.[^.]+|\.(?:test|spec)\.[^.]+|\/__tests__\/)/;
const COMPONENT_GOVERNANCE_RADIX_IMPORT_PATTERN = /from\s+["']@radix-ui\//;
const COMPONENT_GOVERNANCE_RADIX_THEME_PILOT_IMPORT_PATTERN =
  /from\s+["']@\/components\/ui\/radix-theme["']/;
const COMPONENT_GOVERNANCE_RADIX_THEMES_APPROVED_WRAPPERS = new Set([
  "src/components/ui/radix-theme.tsx",
  "src/components/ui/contact-form-shell.tsx",
  "src/components/ui/contact-form-control.tsx",
  "src/components/ui/input.tsx",
  "src/components/ui/textarea.tsx",
  "src/components/ui/status-callout.tsx",
  "src/components/ui/badge.tsx",
  "src/components/ui/data-card.tsx",
]);
const COMPONENT_GOVERNANCE_RADIX_THEMES_IMPORT_PATTERN =
  /(?:from\s+["']@radix-ui\/themes(?:\/[^"']*)?["']|import\s*\(\s*["']@radix-ui\/themes(?:\/[^"']*)?["']\s*\)|require\s*\(\s*["']@radix-ui\/themes(?:\/[^"']*)?["']\s*\))/;
const COMPONENT_GOVERNANCE_RADIX_THEMES_INTERNAL_CLASS_PATTERN =
  /(?:^|[\s"'`.[_-])rt-[A-Za-z0-9_-]+/;
const COMPONENT_GOVERNANCE_STATIC_THEME_COLORS_MODULE_PATTERN =
  "(?:@/config/static-theme-colors|(?:\\.\\.?/)+config/static-theme-colors)";
const COMPONENT_GOVERNANCE_STATIC_THEME_COLORS_IMPORT_PATTERN = new RegExp(
  `(?:from\\s+["']${COMPONENT_GOVERNANCE_STATIC_THEME_COLORS_MODULE_PATTERN}["']|import\\s*\\(\\s*["']${COMPONENT_GOVERNANCE_STATIC_THEME_COLORS_MODULE_PATTERN}["']\\s*\\)|require\\s*\\(\\s*["']${COMPONENT_GOVERNANCE_STATIC_THEME_COLORS_MODULE_PATTERN}["']\\s*\\))`,
);
const COMPONENT_GOVERNANCE_RAW_TAILWIND_PALETTE_CLASS_PATTERN =
  /(?:^|[\s"'`])(?:[a-z-]+:)*(?:bg|text|border|ring|outline|divide|from|via|to|stroke|fill)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?:\/\d{1,3})?(?=$|[\s"'`])/;

function toRelativePath(rootDir, filePath) {
  return path.relative(rootDir, filePath).replaceAll("\\", "/");
}

function exists(rootDir, relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function readText(rootDir, relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function getPatternLineNumber(source, pattern) {
  const lines = source.split("\n");
  const index = lines.findIndex((line) => pattern.test(line));
  return index === -1 ? 1 : index + 1;
}

function walkFiles(rootDir, relativeRoot) {
  const absoluteRoot = path.join(rootDir, relativeRoot);
  if (!fs.existsSync(absoluteRoot)) return [];

  const files = [];
  const pending = [absoluteRoot];

  while (pending.length > 0) {
    const currentDir = pending.pop();
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = path.join(currentDir, entry.name);
      const relativePath = toRelativePath(rootDir, absolutePath);

      if (entry.isDirectory()) {
        if (entry.name === "__tests__") continue;
        pending.push(absolutePath);
        continue;
      }

      if (entry.isFile()) {
        files.push(relativePath);
      }
    }
  }

  return files.sort();
}

function getScannedSourceFiles(rootDir) {
  const files = [];

  for (const root of [
    COMPONENT_GOVERNANCE_COMPONENTS_ROOT,
    COMPONENT_GOVERNANCE_APP_ROOT,
  ]) {
    for (const file of walkFiles(rootDir, root)) {
      if (!COMPONENT_GOVERNANCE_SOURCE_FILE_PATTERN.test(file)) continue;
      if (COMPONENT_GOVERNANCE_EXCLUDED_FILE_PATTERN.test(file)) continue;
      files.push(file);
    }
  }

  return files;
}

function getUiPrimitiveNames(rootDir) {
  const primitiveNames = [];

  for (const file of walkFiles(rootDir, COMPONENT_GOVERNANCE_UI_ROOT)) {
    if (path.dirname(file) !== COMPONENT_GOVERNANCE_UI_ROOT) continue;
    if (!COMPONENT_GOVERNANCE_UI_PRIMITIVE_FILE_PATTERN.test(file)) continue;
    if (COMPONENT_GOVERNANCE_EXCLUDED_FILE_PATTERN.test(file)) continue;
    primitiveNames.push(
      path
        .basename(file)
        .replace(COMPONENT_GOVERNANCE_UI_PRIMITIVE_FILE_PATTERN, ""),
    );
  }

  return primitiveNames.sort();
}

function createFinding(file, kind, detail, line = 1) {
  return { file, line, kind, detail };
}

function readRegistry(rootDir, errors) {
  if (!exists(rootDir, COMPONENT_GOVERNANCE_REGISTRY_PATH)) {
    errors.push(
      createFinding(
        COMPONENT_GOVERNANCE_REGISTRY_PATH,
        "registry-missing",
        "Component governance registry is missing.",
      ),
    );
    return null;
  }

  try {
    return JSON.parse(readText(rootDir, COMPONENT_GOVERNANCE_REGISTRY_PATH));
  } catch (error) {
    errors.push(
      createFinding(
        COMPONENT_GOVERNANCE_REGISTRY_PATH,
        "registry-invalid-json",
        `Component governance registry is not valid JSON: ${error.message}`,
      ),
    );
    return null;
  }
}

function collectRegistryAgentMetadataFindings(
  componentName,
  component,
  errors,
) {
  for (const field of COMPONENT_GOVERNANCE_AGENT_INDEX_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(component, field)) {
      errors.push(
        createFinding(
          COMPONENT_GOVERNANCE_REGISTRY_PATH,
          "registry-agent-field-missing",
          `Registry item "${componentName}" must define "${field}" for agent component selection.`,
        ),
      );
      continue;
    }

    const value = component[field];
    const allowedValues =
      COMPONENT_GOVERNANCE_AGENT_INDEX_ALLOWED_VALUES[field];

    if (allowedValues) {
      if (typeof value !== "string" || !allowedValues.has(value)) {
        errors.push(
          createFinding(
            COMPONENT_GOVERNANCE_REGISTRY_PATH,
            "registry-agent-field-invalid",
            `Registry item "${componentName}" has invalid "${field}" value.`,
          ),
        );
      }
      continue;
    }

    if (typeof value !== "string" || value.trim().length < 12) {
      errors.push(
        createFinding(
          COMPONENT_GOVERNANCE_REGISTRY_PATH,
          "registry-agent-field-invalid",
          `Registry item "${componentName}" must define a useful "${field}" sentence.`,
        ),
      );
    }
  }
}

function collectRegistryAgentSourceTruthFindings(
  rootDir,
  componentName,
  component,
  errors,
) {
  const sourcePath = `${COMPONENT_GOVERNANCE_UI_ROOT}/${componentName}.tsx`;

  if (!exists(rootDir, sourcePath)) {
    return;
  }

  const source = readText(rootDir, sourcePath);
  const sourceTruthChecks = [
    {
      field: "clientBoundary",
      expected: getExpectedClientBoundary(source),
      detail:
        'Registry clientBoundary must match the wrapper source "use client" directive.',
    },
    {
      field: "radixLayer",
      expected: getExpectedRadixLayer(source),
      detail:
        "Registry radixLayer must match Radix imports in the wrapper source.",
    },
    {
      field: "themeBoundary",
      expected: getExpectedThemeBoundary(source),
      detail:
        "Registry themeBoundary must match Radix Themes scoping in the wrapper source.",
    },
  ];

  for (const check of sourceTruthChecks) {
    if (component[check.field] !== check.expected) {
      errors.push(
        createFinding(
          COMPONENT_GOVERNANCE_REGISTRY_PATH,
          "registry-agent-source-mismatch",
          `Registry item "${componentName}" has ${check.field} "${component[check.field]}", but wrapper source expects "${check.expected}". ${check.detail}`,
        ),
      );
    }
  }
}

function collectRegistryFindings(rootDir, registry, errors) {
  if (!registry || typeof registry !== "object") return;

  const components = registry.components;
  if (!components || typeof components !== "object") {
    errors.push(
      createFinding(
        COMPONENT_GOVERNANCE_REGISTRY_PATH,
        "registry-components-missing",
        "Registry must define a components object.",
      ),
    );
    return;
  }

  const primitiveNames = getUiPrimitiveNames(rootDir);
  const primitiveNameSet = new Set(primitiveNames);
  const registeredNames = Object.keys(components).sort();
  const registeredNameSet = new Set(registeredNames);

  for (const primitiveName of primitiveNames) {
    if (!registeredNameSet.has(primitiveName)) {
      errors.push(
        createFinding(
          `${COMPONENT_GOVERNANCE_UI_ROOT}/${primitiveName}.tsx`,
          "ui-primitive-missing-from-registry",
          `UI primitive "${primitiveName}" is missing from the governance registry.`,
        ),
      );
    }
  }

  for (const componentName of registeredNames) {
    const component = components[componentName];

    if (!primitiveNameSet.has(componentName)) {
      errors.push(
        createFinding(
          `${COMPONENT_GOVERNANCE_UI_ROOT}/${componentName}.tsx`,
          "registry-primitive-missing-source",
          `Registry lists "${componentName}", but the UI primitive file does not exist.`,
        ),
      );
    }

    if (
      !component ||
      typeof component !== "object" ||
      !Object.prototype.hasOwnProperty.call(component, "story")
    ) {
      errors.push(
        createFinding(
          COMPONENT_GOVERNANCE_REGISTRY_PATH,
          "registry-story-missing",
          `Registry item "${componentName}" must define story governance.`,
        ),
      );
      continue;
    }

    if (component.story !== COMPONENT_GOVERNANCE_REQUIRED_STORY_VALUE) {
      errors.push(
        createFinding(
          COMPONENT_GOVERNANCE_REGISTRY_PATH,
          "registry-story-invalid",
          `Registry item "${componentName}" story must be "required".`,
        ),
      );
      continue;
    }

    collectRegistryAgentMetadataFindings(componentName, component, errors);
    collectRegistryAgentSourceTruthFindings(
      rootDir,
      componentName,
      component,
      errors,
    );

    const storyPath = `${COMPONENT_GOVERNANCE_UI_ROOT}/${componentName}.stories.tsx`;
    if (!exists(rootDir, storyPath)) {
      errors.push(
        createFinding(
          storyPath,
          "required-story-missing",
          `Required story for UI primitive "${componentName}" is missing.`,
        ),
      );
    }
  }
}

function collectTextScanFindings(rootDir, errors) {
  for (const file of getScannedSourceFiles(rootDir)) {
    const source = readText(rootDir, file);

    const isOutsideUiWrapper = !file.startsWith(
      `${COMPONENT_GOVERNANCE_UI_ROOT}/`,
    );
    const importsRadixThemes =
      COMPONENT_GOVERNANCE_RADIX_THEMES_IMPORT_PATTERN.test(source);

    if (
      isOutsideUiWrapper &&
      COMPONENT_GOVERNANCE_RADIX_THEME_PILOT_IMPORT_PATTERN.test(source)
    ) {
      errors.push(
        createFinding(
          file,
          "radix-theme-pilot-import-outside-ui-wrapper",
          "RadixThemePilot may only be imported inside approved src/components/ui wrappers.",
          getPatternLineNumber(
            source,
            COMPONENT_GOVERNANCE_RADIX_THEME_PILOT_IMPORT_PATTERN,
          ),
        ),
      );
    } else if (isOutsideUiWrapper && importsRadixThemes) {
      errors.push(
        createFinding(
          file,
          "radix-themes-import-outside-ui-wrapper",
          "Radix Themes may only be imported through approved src/components/ui wrappers.",
          getPatternLineNumber(
            source,
            COMPONENT_GOVERNANCE_RADIX_THEMES_IMPORT_PATTERN,
          ),
        ),
      );
    } else if (
      importsRadixThemes &&
      !COMPONENT_GOVERNANCE_RADIX_THEMES_APPROVED_WRAPPERS.has(file)
    ) {
      errors.push(
        createFinding(
          file,
          "radix-themes-import-unapproved-ui-wrapper",
          "Radix Themes may only be imported by approved pilot UI wrappers.",
          getPatternLineNumber(
            source,
            COMPONENT_GOVERNANCE_RADIX_THEMES_IMPORT_PATTERN,
          ),
        ),
      );
    } else if (
      isOutsideUiWrapper &&
      COMPONENT_GOVERNANCE_RADIX_IMPORT_PATTERN.test(source)
    ) {
      errors.push(
        createFinding(
          file,
          "radix-import-outside-ui",
          "Production UI must import Radix through src/components/ui wrappers.",
          getPatternLineNumber(
            source,
            COMPONENT_GOVERNANCE_RADIX_IMPORT_PATTERN,
          ),
        ),
      );
    }

    if (COMPONENT_GOVERNANCE_RADIX_THEMES_INTERNAL_CLASS_PATTERN.test(source)) {
      errors.push(
        createFinding(
          file,
          "radix-themes-internal-class",
          "Production UI must not style or depend on Radix Themes internal .rt-* classes.",
          getPatternLineNumber(
            source,
            COMPONENT_GOVERNANCE_RADIX_THEMES_INTERNAL_CLASS_PATTERN,
          ),
        ),
      );
    }

    if (COMPONENT_GOVERNANCE_RAW_TAILWIND_PALETTE_CLASS_PATTERN.test(source)) {
      errors.push(
        createFinding(
          file,
          "raw-tailwind-palette-class",
          "Production UI must use design tokens instead of obvious raw Tailwind palette classes.",
          getPatternLineNumber(
            source,
            COMPONENT_GOVERNANCE_RAW_TAILWIND_PALETTE_CLASS_PATTERN,
          ),
        ),
      );
    }

    if (COMPONENT_GOVERNANCE_STATIC_THEME_COLORS_IMPORT_PATTERN.test(source)) {
      errors.push(
        createFinding(
          file,
          "static-theme-colors-browser-import",
          "Browser UI must not import static theme color config directly.",
          getPatternLineNumber(
            source,
            COMPONENT_GOVERNANCE_STATIC_THEME_COLORS_IMPORT_PATTERN,
          ),
        ),
      );
    }
  }
}

function collectComponentGovernanceFindings(rootDir = process.cwd()) {
  const errors = [];
  const warnings = [];
  const registry = readRegistry(rootDir, errors);

  collectRegistryFindings(rootDir, registry, errors);
  collectTextScanFindings(rootDir, errors);

  return {
    status: errors.length === 0 ? "passed" : "failed",
    errors,
    warnings,
  };
}

function runComponentGovernanceCli() {
  const payload = collectComponentGovernanceFindings(process.cwd());

  console.log(
    `[component-governance] ${payload.status}: ${payload.errors.length} error(s), ${payload.warnings.length} warning(s)`,
  );

  for (const error of payload.errors) {
    console.log(
      `- ERROR ${error.file}:${error.line} ${error.kind}: ${error.detail}`,
    );
  }

  for (const warning of payload.warnings) {
    console.log(
      `- WARN ${warning.file}:${warning.line} ${warning.kind}: ${warning.detail}`,
    );
  }

  if (payload.status === "failed") {
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// content readiness
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// truth docs
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Cloudflare official compare
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Cloudflare preview and deployed smoke
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// CLI routing
// ---------------------------------------------------------------------------

function printUsage() {
  console.error(`Usage: node scripts/starter-checks.js <command> [options]

Commands:
  truth-docs          Check current truth docs and release runbook order
  brand               Check old brand residue
  content-slugs       Check localized MDX slug pairs
  content-manifest    Generate content manifest and static MDX import map (--check verifies freshness)
  translations        Check split critical/deferred translation shapes
  validate-production-config Validate production and public-launch config gates
  eslint-disable      Check eslint-disable exception hygiene
  component-governance Check component registry, Storybook, and UI wrapper drift
  content-readiness   Check buyer-visible starter residue (--profile <id>, --strict-client-launch promotes launch blockers to errors)
  client-boundary     Check top-level use client budget
  cf-preview-smoke    Probe local Cloudflare preview behavior
  public-preview-smoke Probe public preview page route health
  deployed-smoke      Probe deployed URL route health
  cf-preview-deployed Deploy preview workers and run deployed smoke
  cf-official-compare Check Cloudflare source/generated deploy config contract
  cf-static-asset-headers Check Cloudflare Static Assets _headers artifact
  release-verify      Run full release verification flow
`);
}

async function main(argv = process.argv.slice(2)) {
  const [command, ...args] = argv;

  let ok;
  switch (command) {
    case "truth-docs":
      ok = runTruthDocsCheck();
      break;
    case "brand":
      ok = runBrandCheck();
      break;
    case "content-slugs":
      ok = runContentSlugCheck(args);
      break;
    case "content-manifest":
      ok = runContentManifestGenerator(createContentManifestContext(), {
        check: args.includes("--check"),
      });
      break;
    case "translations":
      ok = runTranslationCheck();
      break;
    case "validate-production-config":
      ok = runValidateProductionConfigCli();
      break;
    case "eslint-disable":
      ok = runEslintDisableCheck();
      break;
    case "component-governance":
      ok = runComponentGovernanceCli();
      break;
    case "content-readiness":
      ok = runContentReadinessCli(args);
      break;
    case "client-boundary":
      ok = runClientBoundaryCli();
      break;
    case "cf-preview-smoke":
      ok = await runCloudflarePreviewSmoke(args);
      break;
    case "public-preview-smoke":
      ok = await runPublicPreviewSmoke(args);
      break;
    case "deployed-smoke":
      ok = await runDeployedSmoke(args);
      break;
    case "cf-preview-deployed":
      ok = runCloudflarePreviewDeployedProof();
      break;
    case "cf-official-compare":
      ok = runCloudflareOfficialCompareCli(args);
      break;
    case "cf-static-asset-headers":
      ok = runCloudflareStaticAssetHeaderCli({ rootDir: ROOT });
      break;
    case "release-verify":
      ok = await runReleaseVerify({ rootDir: ROOT });
      break;
    case "--help":
    case "-h":
      printUsage();
      ok = true;
      break;
    default:
      printUsage();
      ok = false;
  }

  if (typeof ok === "number") {
    process.exitCode = ok;
  } else if (!ok) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("[starter-checks] Unexpected error:", error);
    process.exit(1);
  });
}

module.exports = {
  CONTENT_READINESS_PROFILE_IDS,
  CHECKS: TRUTH_DOC_CHECKS,
  RELEASE_PROOF_MANIFEST,
  RELEASE_PROOF_SEQUENCE,
  RELEASE_VERIFY_COMMANDS,
  formatReleaseCommand,
  analyzeFile,
  analyzeSource,
  buildKey,
  collectClientBoundaryFiles,
  collectCloudflareOfficialCompareFailures,
  collectComponentGovernanceFindings,
  collectContentReadinessFindings,
  collectCurrentTruthDocFindings,
  collectLeafPaths,
  collectPairs,
  collectRegisteredGuardrailExceptionIds,
  compareLocales,
  createContentManifestContext,
  findCommandLineIndex,
  findOutOfOrderCommand,
  assertContentManifestFrontmatterValid,
  generateContentManifest,
  writeFileAtomic,
  getActiveGuardrailExceptionSection,
  getReleaseProofDocsCommandBlock,
  hasTopLevelUseClientDirective,
  isProductionFile,
  isStructuralGuardrailExemptPath,
  isTestFile,
  parseArgs: parseContentSlugArgs,
  parseFrontmatter,
  parseGuardrailException,
  runBrandCheck,
  runCloudflareOfficialCompareCli,
  runCloudflarePreviewDeployedProof,
  runCloudflarePreviewSmoke,
  runClientBoundaryBudgetCheck,
  runComponentGovernanceCli,
  runContentManifestGenerator,
  runContentReadinessCheck,
  runContentSlugCheck,
  runDeployedSmoke,
  runEslintDisableCheck,
  runReleaseVerify,
  runTranslationCheck,
  runValidateProductionConfigCli,
  STRUCTURAL_GUARDRAIL_RULES,
  shouldValidateProductionRuntimeContract,
  validateContentFrontmatterContract,
  validateCollectionPair,
  validateLocale,
  validateMdxSlugSync,
  validateProductionConfig,
  validateProductionRuntimeContract,
  validatePublicLaunchTrustContent,
};
