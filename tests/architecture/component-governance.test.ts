import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const SOURCE_ROOT = "src";
const COMPONENT_GOVERNANCE_REGISTRY_PATH =
  "src/components/component-governance.registry.json";
const PACKAGE_MANIFEST_PATH = "package.json";
const STORYBOOK_CONFIG_PATH = ".storybook/main.ts";
const STORY_EXPLORATION_ROOT = "src/stories";
const UI_WRAPPER_ROOT = "src/components/ui";
const STORY_OR_TEST_FILE_PATTERN =
  /(?:\.stories\.(?:ts|tsx|js|jsx|mdx)|\.(?:test|spec)\.(?:ts|tsx|js|jsx)|\/__tests__\/)/;
const SOURCE_FILE_PATTERN = /\.(?:ts|tsx)$/;
const STORY_FILE_PATTERN = /\.(?:stories)\.(?:ts|tsx|js|jsx|mdx)$/;
const TSX_FILE_PATTERN = /\.tsx$/;
const RADIX_IMPORT_PATTERN = /from\s+["']@radix-ui\//;
const REQUIRED_STORY_VALUE = "required";
const STORYBOOK_MCP_ADDON = "@storybook/addon-mcp";

interface PackageManifest {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface ComponentGovernanceRegistry {
  version: number;
  components: Record<string, ComponentGovernanceRegistryItem>;
}

interface ComponentGovernanceRegistryItem {
  story?: string;
}

function walkFiles(root: string): string[] {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed architecture test root
  return readdirSync(root).flatMap((entry) => {
    const fullPath = join(root, entry);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed architecture test traversal
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      return walkFiles(fullPath);
    }

    return fullPath;
  });
}

function normalizePath(filePath: string): string {
  return relative(process.cwd(), filePath).replaceAll("\\", "/");
}

function readComponentGovernanceRegistry(): ComponentGovernanceRegistry {
  return JSON.parse(
    readFileSync(COMPONENT_GOVERNANCE_REGISTRY_PATH, "utf8"),
  ) as ComponentGovernanceRegistry;
}

function readPackageManifest(): PackageManifest {
  return JSON.parse(
    readFileSync(PACKAGE_MANIFEST_PATH, "utf8"),
  ) as PackageManifest;
}

function getUiPrimitiveNames(): string[] {
  return readdirSync(UI_WRAPPER_ROOT)
    .filter((entry) => TSX_FILE_PATTERN.test(entry))
    .filter((entry) => !STORY_FILE_PATTERN.test(entry))
    .map((entry) => entry.replace(TSX_FILE_PATTERN, ""))
    .sort();
}

function isStoryModulePath(importPath: string, importerDirectory: string) {
  if (importPath === "@/stories" || importPath.startsWith("@/stories/")) {
    return true;
  }

  if (!importPath.startsWith(".")) {
    return false;
  }

  const normalizedImportPath = join(importerDirectory, importPath).replaceAll(
    "\\",
    "/",
  );

  return (
    normalizedImportPath === STORY_EXPLORATION_ROOT ||
    normalizedImportPath.startsWith(`${STORY_EXPLORATION_ROOT}/`)
  );
}

function hasStoryImport(source: string, filePath: string): boolean {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TSX,
  );

  const importerDirectory = filePath.split("/").slice(0, -1).join("/");

  return sourceFile.statements.some((statement) => {
    if (
      !ts.isImportDeclaration(statement) &&
      !ts.isExportDeclaration(statement)
    ) {
      return false;
    }

    const moduleSpecifier = statement.moduleSpecifier;

    if (!moduleSpecifier || !ts.isStringLiteral(moduleSpecifier)) {
      return false;
    }

    const importPath = moduleSpecifier.text;
    return isStoryModulePath(importPath, importerDirectory);
  });
}

describe("component governance", () => {
  it("keeps the UI primitive governance registry aligned with source files", () => {
    const registry = readComponentGovernanceRegistry();
    const registryComponentNames = Object.keys(registry.components).sort();

    expect(registry.version).toBe(1);
    expect(registryComponentNames).toEqual(getUiPrimitiveNames());

    for (const [componentName, component] of Object.entries(
      registry.components,
    )) {
      expect(
        component,
        `${componentName} should define story governance`,
      ).toHaveProperty("story");
      expect(
        component.story,
        `${componentName} story governance should be strictly required`,
      ).toBe(REQUIRED_STORY_VALUE);
    }
  });

  it("keeps required Storybook coverage for registered UI primitives", () => {
    const registry = readComponentGovernanceRegistry();
    const missingRequiredStories = Object.entries(registry.components)
      .filter(([, component]) => component.story === REQUIRED_STORY_VALUE)
      .map(
        ([componentName]) => `${UI_WRAPPER_ROOT}/${componentName}.stories.tsx`,
      )
      .filter((storyPath) => {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- story paths are built from fixed governance inventory
        return !existsSync(storyPath);
      });

    expect(missingRequiredStories).toEqual([]);
  });

  it("keeps direct Radix imports inside the UI wrapper layer", () => {
    const violations = walkFiles(SOURCE_ROOT)
      .map(normalizePath)
      .filter((filePath) => SOURCE_FILE_PATTERN.test(filePath))
      .filter((filePath) => !filePath.startsWith(`${UI_WRAPPER_ROOT}/`))
      .filter((filePath) => !STORY_OR_TEST_FILE_PATTERN.test(filePath))
      .filter((filePath) => {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads source files
        const source = readFileSync(filePath, "utf8");
        return RADIX_IMPORT_PATTERN.test(source);
      });

    expect(violations).toEqual([]);
  });

  it("keeps Storybook exploration out of production imports", () => {
    const violations = walkFiles(SOURCE_ROOT)
      .map(normalizePath)
      .filter((filePath) => SOURCE_FILE_PATTERN.test(filePath))
      .filter((filePath) => !filePath.startsWith(`${STORY_EXPLORATION_ROOT}/`))
      .filter((filePath) => !STORY_OR_TEST_FILE_PATTERN.test(filePath))
      .filter((filePath) => {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads source files
        const source = readFileSync(filePath, "utf8");
        return hasStoryImport(source, filePath);
      });

    expect(violations).toEqual([]);
  });

  it("keeps Storybook MCP out of project-local Storybook wiring", () => {
    const manifest = readPackageManifest();
    const storybookConfig = readFileSync(STORYBOOK_CONFIG_PATH, "utf8");

    expect(storybookConfig).not.toContain(STORYBOOK_MCP_ADDON);
    expect(manifest.dependencies ?? {}).not.toHaveProperty(STORYBOOK_MCP_ADDON);
    expect(manifest.devDependencies ?? {}).not.toHaveProperty(
      STORYBOOK_MCP_ADDON,
    );
  });

  it("detects Storybook exploration imports without matching similarly named modules", () => {
    const importerPath = "src/components/example.ts";

    expect(hasStoryImport('import "@/stories";', importerPath)).toBe(true);
    expect(
      hasStoryImport(
        'export { Example } from "@/stories/example";',
        importerPath,
      ),
    ).toBe(true);
    expect(hasStoryImport('import "../stories/example";', importerPath)).toBe(
      true,
    );
    expect(hasStoryImport('import "@/stories-utils";', importerPath)).toBe(
      false,
    );
    expect(hasStoryImport("export { Example };", importerPath)).toBe(false);
  });
});
