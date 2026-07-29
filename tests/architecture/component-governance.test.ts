import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  findRadixPackageReference,
  findRadixThemesReference,
  getExpectedClientBoundary,
  getExpectedRadixLayer,
} from "../../scripts/component-governance-registry-truth.js";

const SOURCE_ROOT = "src";
const ROOT_PRODUCTION_SOURCE_FILES = ["mdx-components.tsx"] as const;
const COMPONENT_GOVERNANCE_REGISTRY_PATH =
  "src/components/component-governance.registry.json";
const PACKAGE_MANIFEST_PATH = "package.json";
const STORYBOOK_CONFIG_PATH = ".storybook/main.ts";
const STORY_EXPLORATION_ROOT = "src/stories";
const UI_WRAPPER_ROOT = "src/components/ui";
const STORY_OR_TEST_FILE_PATTERN =
  /(?:\.stories\.(?:ts|tsx|js|jsx|mdx)|\.(?:test|spec)\.(?:ts|tsx|js|jsx)|\/__tests__\/|^src\/(?:test|testing)\/)/;
const SOURCE_FILE_PATTERN = /\.(?:[cm]?[jt]sx?)$/;
const STORY_FILE_PATTERN = /\.(?:stories)\.(?:ts|tsx|js|jsx|mdx)$/;
const TSX_FILE_PATTERN = /\.tsx$/;
const REQUIRED_STORY_VALUE = "required";
const RADIX_LAYER_VALUES = ["primitive", "local"] as const;
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
const REQUIRED_AGENT_INDEX_FIELDS = [
  "radixLayer",
  "surface",
  "clientBoundary",
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

type ComponentRadixLayer = "primitive" | "local";
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

interface ComponentGovernanceRegistryItem {
  avoidWhen?: string;
  clientBoundary?: ComponentClientBoundary;
  radixLayer?: ComponentRadixLayer;
  story?: string;
  surface?: ComponentSurface;
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
    }
  });

  it("keeps high-risk component selection metadata explicit", () => {
    const registry = readComponentGovernanceRegistry();

    expect(registry.components.card).toEqual(
      expect.objectContaining({
        radixLayer: "local",
        surface: "narrative",
      }),
    );
    expect(registry.components["status-callout"]).toEqual(
      expect.objectContaining({
        radixLayer: "local",
        surface: "feedback",
      }),
    );
    expect(registry.components.sheet).toEqual(
      expect.objectContaining({
        radixLayer: "primitive",
        surface: "control",
        useWhen: expect.stringContaining("drawer"),
      }),
    );
  });

  it("keeps every governed Radix wrapper backed by a declared dependency", () => {
    const registry = readComponentGovernanceRegistry();
    const dependencies = getPackageDependencies(readPackageManifest());

    // 从注册表实际内容派生，而不是钉死一份组件名单：退役一个 wrapper 不该让这里变红，
    // 但留下一个 import 不到包的 wrapper 必须变红。
    const undeclared = Object.keys(registry.components)
      .filter(
        (componentName) =>
          registry.components[componentName]?.radixLayer === "primitive",
      )
      .map((componentName) => ({
        componentName,
        reference: findRadixPackageReference(
          getUiPrimitiveSource(componentName),
          `${UI_WRAPPER_ROOT}/${componentName}.tsx`,
        ),
      }))
      .filter(
        ({ reference }) =>
          reference !== null && !(reference.specifier in dependencies),
      )
      .map(({ componentName }) => componentName);

    expect(undeclared).toEqual([]);
    expect(dependencies).not.toHaveProperty("@radix-ui/themes");
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
    const violations = [
      ...walkFiles(SOURCE_ROOT),
      ...ROOT_PRODUCTION_SOURCE_FILES,
    ]
      .map(normalizePath)
      .filter((filePath) => SOURCE_FILE_PATTERN.test(filePath))
      .filter((filePath) => !filePath.startsWith(`${UI_WRAPPER_ROOT}/`))
      .filter((filePath) => !STORY_OR_TEST_FILE_PATTERN.test(filePath))
      .filter((filePath) => {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads source files
        const source = readFileSync(filePath, "utf8");
        return findRadixPackageReference(source, filePath) !== null;
      });

    expect(violations).toEqual([]);
  });

  it("keeps the retired Radix Themes package out of production source", () => {
    const violations = [
      ...walkFiles(SOURCE_ROOT),
      ...ROOT_PRODUCTION_SOURCE_FILES,
    ]
      .map(normalizePath)
      .filter((filePath) => SOURCE_FILE_PATTERN.test(filePath))
      .filter((filePath) => !STORY_OR_TEST_FILE_PATTERN.test(filePath))
      .filter((filePath) => {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads source files
        const source = readFileSync(filePath, "utf8");
        return findRadixThemesReference(source, filePath) !== null;
      });

    expect(violations).toEqual([]);
  });

  it("keeps component:check as the wrapper governance gate", () => {
    const manifest = readPackageManifest();
    const governanceTestScript =
      manifest.scripts?.["component:governance:test"] ?? "";
    const governanceScript = manifest.scripts?.["component:governance"] ?? "";
    const componentCheckScript = manifest.scripts?.["component:check"] ?? "";

    // vitest 把参数当过滤器：路径指向一个不存在的文件时，它安静地少跑一个，
    // 不报错。所以这里断言的不是"清单写了哪几个"，而是**写下的每一条都还在磁盘
    // 上**——这才是漏跑真正的成因。
    const filteredPaths = governanceTestScript
      .split(/\s+/u)
      .filter((token) => token.endsWith(".test.ts"));

    expect(filteredPaths.length).toBeGreaterThan(0);
    for (const filePath of filteredPaths) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- path comes from this repo's own package.json script
      expect(existsSync(filePath), `${filePath} 在清单里但文件不在`).toBe(true);
    }

    expect(governanceScript).toContain("component-governance");

    // `component:governance` 是 `component:governance:test` 的子串，所以单独
    // toContain 它会在 component:check 被砍到只剩 test（scanner 和 storybook
    // build 都丢了）时照样绿。按 && 拆开，逐段点名。
    const checkStages = componentCheckScript.split("&&").map((s) => s.trim());

    expect(checkStages).toEqual(
      expect.arrayContaining([
        "pnpm component:governance:test",
        "pnpm component:governance",
        "pnpm exec storybook build",
      ]),
    );
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

  // Playbook and index wording is asserted once, in ui-component-playbook.test.ts
  // and ui-component-index.test.ts. Duplicating it here made either copy able to
  // drift into a false gate.
  // 这里原本还有一条 "keeps Registry and Playbook active"，断言三个文件存在。
  // registry 缺了这个文件里每条断言都会先炸；文档缺了它也证明不了什么。
  // 连同已退役的 组件索引.md 一起删于 2026-07-26。
});
