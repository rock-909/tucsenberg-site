const fs = require("node:fs");
const path = require("node:path");
const {
  getExpectedClientBoundary,
  getExpectedRadixLayer,
} = require("../../component-governance-registry-truth");

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
  "useWhen",
  "avoidWhen",
];
const COMPONENT_GOVERNANCE_AGENT_INDEX_ALLOWED_VALUES = {
  radixLayer: new Set(["primitive", "local"]),
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
};
const COMPONENT_GOVERNANCE_SOURCE_FILE_PATTERN = /\.(?:ts|tsx|js|jsx)$/;
const COMPONENT_GOVERNANCE_UI_PRIMITIVE_FILE_PATTERN = /\.(?:tsx|jsx)$/;
const COMPONENT_GOVERNANCE_EXCLUDED_FILE_PATTERN =
  /(?:\.stories\.[^.]+|\.(?:test|spec)\.[^.]+|\/__tests__\/)/;
const COMPONENT_GOVERNANCE_RADIX_IMPORT_PATTERN = /from\s+["']@radix-ui\//;
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

    if (importsRadixThemes) {
      errors.push(
        createFinding(
          file,
          "radix-themes-import-forbidden",
          "Production UI must not import the retired @radix-ui/themes package.",
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

module.exports = {
  collectComponentGovernanceFindings,
  runComponentGovernanceCli,
};
