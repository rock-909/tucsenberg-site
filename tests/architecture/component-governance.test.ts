import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  getExpectedClientBoundary,
  getExpectedRadixLayer,
  getExpectedThemeBoundary,
  RADIX_THEMES_IMPORT_PATTERN,
} from "../../scripts/component-governance-registry-truth.js";

const SOURCE_ROOT = "src";
const COMPONENT_GOVERNANCE_REGISTRY_PATH =
  "src/components/component-governance.registry.json";
const UI_COMPONENT_PLAYBOOK_PATH = "docs/design/组件使用手册.md";
const UI_COMPONENT_INDEX_PATH = "docs/design/组件索引.md";
const AGENTS_MD_PATH = "AGENTS.md";
const CLAUDE_MD_PATH = "CLAUDE.md";
const REGISTRY_PLAYBOOK_RETIREMENT_STOP_LINE =
  "Do not delete, archive, or shrink Registry / Playbook until a later approved retirement proof explicitly authorizes it and confirms equal-or-stronger AI discoverability and machine governance.";
const COMPONENT_CHECK_SCRIPT =
  "pnpm component:governance:test && pnpm component:governance && pnpm exec storybook build";
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
const UI_CHECKBOX_WRAPPER_IMPORT_PATTERN =
  /from\s+["'](?:@\/components\/ui\/checkbox|\.\.[^"']*\/ui\/checkbox)["']/;
const PROTECTED_NATIVE_CHECKBOX_SURFACES = [
  "src/components/forms",
  "src/components/cookie",
] as const;
const REQUIRED_STORY_VALUE = "required";
const RADIX_LAYER_VALUES = ["primitive", "themes", "local", "mixed"] as const;
const SURFACE_VALUES = [
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
] as const;
const CLIENT_BOUNDARY_VALUES = ["server-safe", "client"] as const;
const THEME_BOUNDARY_VALUES = [
  "self-contained",
  "parent-scoped",
  "none",
] as const;
const REQUIRED_AGENT_INDEX_FIELDS = [
  "radixLayer",
  "surface",
  "clientBoundary",
  "themeBoundary",
  "useWhen",
  "avoidWhen",
] as const;
const STORYBOOK_MCP_ADDON = "@storybook/addon-mcp";

interface PackageManifest {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

interface ComponentGovernanceRegistry {
  version: number;
  components: Record<string, ComponentGovernanceRegistryItem>;
}

type ComponentRadixLayer = "primitive" | "themes" | "local" | "mixed";
type ComponentSurface =
  | "control"
  | "navigation"
  | "feedback"
  | "form"
  | "form-internal"
  | "data"
  | "narrative"
  | "layout"
  | "utility"
  | "theme";
type ComponentClientBoundary = "server-safe" | "client";
type ComponentThemeBoundary = "self-contained" | "parent-scoped" | "none";

interface ComponentGovernanceRegistryItem {
  avoidWhen?: string;
  clientBoundary?: ComponentClientBoundary;
  radixLayer?: ComponentRadixLayer;
  story?: string;
  surface?: ComponentSurface;
  themeBoundary?: ComponentThemeBoundary;
  useWhen?: string;
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

function readFixedText(filePath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture tests read fixed repo docs
  return readFileSync(filePath, "utf8");
}

function getUiPrimitiveNames(): string[] {
  return readdirSync(UI_WRAPPER_ROOT)
    .filter((entry) => TSX_FILE_PATTERN.test(entry))
    .filter((entry) => !STORY_FILE_PATTERN.test(entry))
    .map((entry) => entry.replace(TSX_FILE_PATTERN, ""))
    .sort();
}

function getUiPrimitiveSource(componentName: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- component paths are built from fixed governance inventory
  return readFileSync(`${UI_WRAPPER_ROOT}/${componentName}.tsx`, "utf8");
}

function getUiPrimitiveSourceFile(componentName: string): ts.SourceFile {
  const filePath = `${UI_WRAPPER_ROOT}/${componentName}.tsx`;
  const source = getUiPrimitiveSource(componentName);

  return ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
}

function collectExportedBindingNames(sourceFile: ts.SourceFile): string[] {
  const names: string[] = [];

  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement) && statement.exportClause) {
      if (ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) {
          names.push(element.name.text);
        }
      }
    }

    const isExported =
      ts.canHaveModifiers(statement) &&
      ts
        .getModifiers(statement)
        ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);

    if (!isExported) {
      continue;
    }

    if (ts.isFunctionDeclaration(statement) && statement.name) {
      names.push(statement.name.text);
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          names.push(declaration.name.text);
        }
      }
    }

    if (ts.isClassDeclaration(statement) && statement.name) {
      names.push(statement.name.text);
    }
  }

  return names;
}

function getUiPrimitiveExportedNames(componentName: string): string[] {
  return collectExportedBindingNames(getUiPrimitiveSourceFile(componentName));
}

function getPackageDependencies(
  manifest: PackageManifest,
): Record<string, string> {
  return {
    ...(manifest.dependencies ?? {}),
    ...(manifest.devDependencies ?? {}),
  };
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

      for (const field of REQUIRED_AGENT_INDEX_FIELDS) {
        expect(
          component,
          `${componentName} should define ${field} for agent component selection`,
        ).toHaveProperty(field);
      }

      expect(
        RADIX_LAYER_VALUES,
        `${componentName} should use an approved radixLayer`,
      ).toContain(component.radixLayer);
      expect(
        SURFACE_VALUES,
        `${componentName} should use an approved surface`,
      ).toContain(component.surface);
      expect(
        CLIENT_BOUNDARY_VALUES,
        `${componentName} should use an approved clientBoundary`,
      ).toContain(component.clientBoundary);
      expect(
        THEME_BOUNDARY_VALUES,
        `${componentName} should use an approved themeBoundary`,
      ).toContain(component.themeBoundary);
      expect(
        component.useWhen,
        `${componentName} useWhen should be a short agent-facing sentence`,
      ).toEqual(expect.any(String));
      expect(component.useWhen?.trim().length).toBeGreaterThanOrEqual(12);
      expect(
        component.avoidWhen,
        `${componentName} avoidWhen should be a short agent-facing sentence`,
      ).toEqual(expect.any(String));
      expect(component.avoidWhen?.trim().length).toBeGreaterThanOrEqual(12);

      const source = getUiPrimitiveSource(componentName);

      expect(
        component.clientBoundary,
        `${componentName} clientBoundary should match its "use client" directive`,
      ).toBe(getExpectedClientBoundary(source));
      expect(
        component.radixLayer,
        `${componentName} radixLayer should match its Radix imports`,
      ).toBe(getExpectedRadixLayer(source));
      expect(
        component.themeBoundary,
        `${componentName} themeBoundary should match Radix Themes scoping in source`,
      ).toBe(getExpectedThemeBoundary(source));
    }
  });

  it("keeps high-risk component selection metadata explicit", () => {
    const registry = readComponentGovernanceRegistry();

    expect(registry.components.card).toEqual(
      expect.objectContaining({
        radixLayer: "local",
        surface: "narrative",
        themeBoundary: "none",
      }),
    );
    expect(registry.components["data-card"]).toEqual(
      expect.objectContaining({
        radixLayer: "themes",
        surface: "data",
        themeBoundary: "self-contained",
      }),
    );
    expect(registry.components["contact-form-control"]).toEqual(
      expect.objectContaining({
        radixLayer: "themes",
        surface: "form-internal",
        themeBoundary: "parent-scoped",
      }),
    );
    expect(registry.components["radix-theme"]).toEqual(
      expect.objectContaining({
        radixLayer: "themes",
        surface: "theme",
        themeBoundary: "self-contained",
      }),
    );
    expect(registry.components.dialog).toEqual(
      expect.objectContaining({
        radixLayer: "primitive",
        surface: "control",
        themeBoundary: "none",
        useWhen: expect.stringContaining("modal"),
      }),
    );
    expect(registry.components.sheet).toEqual(
      expect.objectContaining({
        radixLayer: "primitive",
        surface: "control",
        themeBoundary: "none",
        useWhen: expect.stringContaining("drawer"),
      }),
    );
  });

  it("keeps governed primitive metadata and dependency boundaries explicit", () => {
    const registry = readComponentGovernanceRegistry();
    const manifest = readPackageManifest();
    const dependencies = getPackageDependencies(manifest);

    expect(registry.components.checkbox).toEqual(
      expect.objectContaining({
        radixLayer: "primitive",
        surface: "form",
        clientBoundary: "client",
        themeBoundary: "none",
      }),
    );
    expect(registry.components.select).toEqual(
      expect.objectContaining({
        radixLayer: "primitive",
        surface: "form",
        clientBoundary: "client",
        themeBoundary: "none",
      }),
    );
    expect(registry.components["radio-group"]).toEqual(
      expect.objectContaining({
        radixLayer: "primitive",
        surface: "form",
        clientBoundary: "client",
        themeBoundary: "none",
      }),
    );

    expect(registry.components.tabs).toEqual(
      expect.objectContaining({
        radixLayer: "primitive",
        surface: "navigation",
        clientBoundary: "client",
        themeBoundary: "none",
      }),
    );
    expect(registry.components.tooltip).toEqual(
      expect.objectContaining({
        radixLayer: "primitive",
        surface: "feedback",
        clientBoundary: "client",
        themeBoundary: "none",
      }),
    );
    expect(registry.components.popover).toEqual(
      expect.objectContaining({
        radixLayer: "primitive",
        surface: "control",
        clientBoundary: "client",
        themeBoundary: "none",
      }),
    );

    expect(dependencies).toHaveProperty("@radix-ui/react-tabs");
    expect(dependencies).toHaveProperty("@radix-ui/react-tooltip");
    expect(dependencies).toHaveProperty("@radix-ui/react-popover");
    expect(dependencies).toHaveProperty("@radix-ui/react-checkbox");
    expect(dependencies).toHaveProperty("@radix-ui/react-select");
    expect(dependencies).toHaveProperty("@radix-ui/react-radio-group");
  });

  it("keeps the completed AIFS primitive wrapper baseline explicit", () => {
    const registry = readComponentGovernanceRegistry();
    const requiredPrimitiveWrappers = [
      "tabs",
      "tooltip",
      "popover",
      "select",
      "radio-group",
      "checkbox",
    ];

    for (const componentName of requiredPrimitiveWrappers) {
      expect(
        registry.components,
        `${componentName} must remain in the governed wrapper baseline`,
      ).toHaveProperty(componentName);
      expect(registry.components[componentName]?.radixLayer).toBe("primitive");
      expect(registry.components[componentName]?.story).toBe(
        REQUIRED_STORY_VALUE,
      );
    }
  });

  it("detects portal export shapes through AST export names", () => {
    const fixtureSource = [
      "export function TooltipPortal() { return null; }",
      "export const PopoverPortal = PopoverPrimitive.Portal;",
      "export { Portal as TooltipPortal } from '@radix-ui/react-tooltip';",
    ].join("\n");
    const fixtureFile = ts.createSourceFile(
      "fixture.tsx",
      fixtureSource,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );

    expect(collectExportedBindingNames(fixtureFile)).toEqual(
      expect.arrayContaining(["TooltipPortal", "PopoverPortal"]),
    );
  });

  it("keeps tooltip and popover portal wrappers internal", () => {
    const tooltipExports = getUiPrimitiveExportedNames("tooltip");
    const popoverExports = getUiPrimitiveExportedNames("popover");

    expect(tooltipExports).not.toContain("TooltipPortal");
    expect(popoverExports).not.toContain("PopoverPortal");
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

  it("keeps contact and cookie surfaces from importing the Checkbox wrapper before migration proof", () => {
    const violations = walkFiles(SOURCE_ROOT)
      .map(normalizePath)
      .filter((filePath) => SOURCE_FILE_PATTERN.test(filePath))
      .filter((filePath) => !STORY_OR_TEST_FILE_PATTERN.test(filePath))
      .filter((filePath) =>
        PROTECTED_NATIVE_CHECKBOX_SURFACES.some((surfaceRoot) =>
          filePath.startsWith(`${surfaceRoot}/`),
        ),
      )
      .filter((filePath) => {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads source files
        const source = readFileSync(filePath, "utf8");
        return UI_CHECKBOX_WRAPPER_IMPORT_PATTERN.test(source);
      });

    expect(violations).toEqual([]);
  });

  it("keeps direct Radix Themes imports inside approved UI wrappers", () => {
    const violations = walkFiles(SOURCE_ROOT)
      .map(normalizePath)
      .filter((filePath) => SOURCE_FILE_PATTERN.test(filePath))
      .filter((filePath) => !filePath.startsWith(`${UI_WRAPPER_ROOT}/`))
      .filter((filePath) => !STORY_OR_TEST_FILE_PATTERN.test(filePath))
      .filter((filePath) => {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads source files
        const source = readFileSync(filePath, "utf8");
        return RADIX_THEMES_IMPORT_PATTERN.test(source);
      });

    expect(violations).toEqual([]);
  });

  it("keeps component:check as the wrapper governance gate", () => {
    const manifest = readPackageManifest();
    const governanceTestScript =
      manifest.scripts?.["component:governance:test"] ?? "";
    const governanceScript = manifest.scripts?.["component:governance"] ?? "";
    const componentCheckScript = manifest.scripts?.["component:check"] ?? "";

    expect(governanceTestScript).toContain(
      "tests/architecture/component-governance.test.ts",
    );
    expect(governanceTestScript).toContain(
      "tests/architecture/ui-component-index.test.ts",
    );
    expect(governanceTestScript).toContain(
      "tests/unit/scripts/component-governance-check.test.ts",
    );
    expect(governanceScript).toContain("component-governance");
    expect(componentCheckScript).toBe(COMPONENT_CHECK_SCRIPT);
    expect(componentCheckScript).not.toContain("|| true");
    expect(componentCheckScript).not.toContain("; true");
    expect(componentCheckScript).not.toContain("--passWithNoTests");
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

  it("keeps Registry and Playbook active in the materialized site docs", () => {
    expect(existsSync(COMPONENT_GOVERNANCE_REGISTRY_PATH)).toBe(true);
    expect(existsSync(UI_COMPONENT_PLAYBOOK_PATH)).toBe(true);
    expect(existsSync(UI_COMPONENT_INDEX_PATH)).toBe(true);

    const playbook = readFixedText(UI_COMPONENT_PLAYBOOK_PATH);
    const index = readFixedText(UI_COMPONENT_INDEX_PATH);
    const agents = readFixedText(AGENTS_MD_PATH);
    const claude = readFixedText(CLAUDE_MD_PATH);

    expect(playbook).toContain(
      "short human/agent component selection playbook",
    );
    expect(playbook).toContain("Project-level");
    expect(playbook).toContain(".claude/rules/ui.md");
    expect(playbook).toContain("full maintained wrapper inventory");
    expect(playbook).toContain("组件索引.md");
    expect(playbook).toContain("Registry and Playbook are retained");
    expect(playbook).toContain(
      "AI discoverability and machine governance will not get weaker",
    );
    expect(playbook).toContain("Do not delete, archive, or shrink");
    expect(index).toContain("maintained mirror");
    expect(index).toContain("durable component discovery source for agents");
    expect(agents).toContain(REGISTRY_PLAYBOOK_RETIREMENT_STOP_LINE);
    expect(claude).toContain(REGISTRY_PLAYBOOK_RETIREMENT_STOP_LINE);
    expect(agents).not.toContain("until replacement proof exists");
    expect(claude).not.toContain("until replacement proof exists");
  });
});
