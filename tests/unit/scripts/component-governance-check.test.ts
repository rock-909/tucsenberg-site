import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { collectComponentGovernanceFindings } from "../../../scripts/starter-checks.js";

interface ComponentGovernanceFinding {
  file: string;
  line: number;
  kind: string;
  detail: string;
}

const TEMP_TRASH_ROOT = path.join(
  os.tmpdir(),
  "showcase-component-governance-test-trash",
);

function createFixture(files: Record<string, string>): string {
  const rootDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "showcase-component-governance-"),
  );

  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = path.join(rootDir, relativePath);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- test fixture path is created inside a test-owned temporary directory
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- test fixture path is created inside a test-owned temporary directory
    fs.writeFileSync(fullPath, content, "utf8");
  }

  return rootDir;
}

function moveFixtureToTrash(rootDir: string): void {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- cleanup only checks the test-owned temporary fixture directory
  if (!fs.existsSync(rootDir)) return;

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- cleanup moves fixtures to a recoverable os.tmpdir trash folder
  fs.mkdirSync(TEMP_TRASH_ROOT, { recursive: true });
  const targetDir = path.join(
    TEMP_TRASH_ROOT,
    `${path.basename(rootDir)}-${Date.now()}`,
  );

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixture cleanup uses recoverable rename instead of permanent deletion
  fs.renameSync(rootDir, targetDir);
}

function registry(components: Record<string, unknown>): string {
  return JSON.stringify({ version: 1, components }, null, 2);
}

function baseFiles(extraFiles: Record<string, string> = {}) {
  return {
    "src/components/component-governance.registry.json": registry({
      button: { story: "required" },
    }),
    "src/components/ui/button.tsx": "export function Button() { return null; }",
    "src/components/ui/button.stories.tsx":
      "export default { title: 'UI/Button' };",
    ...extraFiles,
  };
}

function expectFinding(
  findings: ComponentGovernanceFinding[],
  kind: string,
  file?: string,
): void {
  expect(findings).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        kind,
        ...(file ? { file } : {}),
      }),
    ]),
  );
}

describe("component-governance-check", () => {
  const fixtureRoots: string[] = [];

  afterEach(() => {
    for (const rootDir of fixtureRoots.splice(0)) {
      moveFixtureToTrash(rootDir);
    }
  });

  it("passes valid primitive registry without warning on business components that lack stories", () => {
    const rootDir = createFixture(
      baseFiles({
        "src/components/products/product-card.tsx":
          "export function ProductCard() { return null; }",
        "src/components/sections/hero-section.tsx":
          "export function HeroSection() { return null; }",
      }),
    );
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("does not warn for component folders outside the phase one story backlog", () => {
    const rootDir = createFixture(
      baseFiles({
        "src/components/layout/header.tsx":
          "export function Header() { return null; }",
        "src/components/content/about-page-shell.tsx":
          "export function AboutPageShell() { return null; }",
      }),
    );
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("fails when the component governance registry is missing", () => {
    const rootDir = createFixture({
      "src/components/ui/button.tsx":
        "export function Button() { return null; }",
    });
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(
      result.errors,
      "registry-missing",
      "src/components/component-governance.registry.json",
    );
  });

  it("fails when a UI primitive is missing from the registry", () => {
    const rootDir = createFixture(
      baseFiles({
        "src/components/ui/input.tsx":
          "export function Input() { return null; }",
      }),
    );
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(result.errors, "ui-primitive-missing-from-registry");
  });

  it("fails when the registry lists a nonexistent primitive", () => {
    const rootDir = createFixture({
      "src/components/component-governance.registry.json": registry({
        ghost: { story: "required" },
      }),
      "src/components/ui/button.tsx":
        "export function Button() { return null; }",
    });
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(result.errors, "registry-primitive-missing-source");
  });

  it("fails when a registry item does not define the story property", () => {
    const rootDir = createFixture({
      "src/components/component-governance.registry.json": registry({
        button: {},
      }),
      "src/components/ui/button.tsx":
        "export function Button() { return null; }",
    });
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(result.errors, "registry-story-missing");
  });

  it("fails when a registry item uses a story value other than required", () => {
    const rootDir = createFixture({
      "src/components/component-governance.registry.json": registry({
        button: { story: "optional" },
      }),
      "src/components/ui/button.tsx":
        "export function Button() { return null; }",
      "src/components/ui/button.stories.tsx":
        "export default { title: 'UI/Button' };",
    });
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(result.errors, "registry-story-invalid");
  });

  it("fails when a required primitive story file is missing", () => {
    const rootDir = createFixture({
      "src/components/component-governance.registry.json": registry({
        button: { story: "required" },
      }),
      "src/components/ui/button.tsx":
        "export function Button() { return null; }",
    });
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(
      result.errors,
      "required-story-missing",
      "src/components/ui/button.stories.tsx",
    );
  });

  it("fails when production UI code outside src/components/ui imports Radix directly", () => {
    const rootDir = createFixture(
      baseFiles({
        "src/components/layout/header.tsx":
          'import { Slot } from "@radix-ui/react-slot";\nexport function Header() { return null; }',
      }),
    );
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(
      result.errors,
      "radix-import-outside-ui",
      "src/components/layout/header.tsx",
    );
  });

  it("allows direct Radix imports inside src/components/ui", () => {
    const rootDir = createFixture({
      "src/components/component-governance.registry.json": registry({
        button: { story: "required" },
      }),
      "src/components/ui/button.tsx":
        'import { Slot } from "@radix-ui/react-slot";\nexport function Button() { return <Slot />; }',
      "src/components/ui/button.stories.tsx":
        "export default { title: 'UI/Button' };",
    });
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
  });

  it("fails when Radix Themes is imported outside approved UI wrappers", () => {
    const rootDir = createFixture(
      baseFiles({
        "src/components/forms/contact-form.tsx":
          'import { TextField } from "@radix-ui/themes";\nexport function ContactForm() { return <TextField.Root />; }',
      }),
    );
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(
      result.errors,
      "radix-themes-import-outside-ui-wrapper",
      "src/components/forms/contact-form.tsx",
    );
  });

  it("fails when Radix Themes is dynamically loaded outside approved UI wrappers", () => {
    const rootDir = createFixture(
      baseFiles({
        "src/components/forms/contact-form.tsx":
          'export async function loadContactFormUi() { return import("@radix-ui/themes"); }',
        "src/components/contact/contact-card.tsx":
          'const themes = require("@radix-ui/themes");\nexport function ContactCard() { return themes; }',
      }),
    );
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(
      result.errors,
      "radix-themes-import-outside-ui-wrapper",
      "src/components/forms/contact-form.tsx",
    );
    expectFinding(
      result.errors,
      "radix-themes-import-outside-ui-wrapper",
      "src/components/contact/contact-card.tsx",
    );
  });

  it("allows Radix Themes imports inside approved UI wrappers", () => {
    const rootDir = createFixture({
      "src/components/component-governance.registry.json": registry({
        "radix-theme": { story: "required" },
      }),
      "src/components/ui/radix-theme.tsx":
        'import { Theme } from "@radix-ui/themes";\nexport function RadixThemePilot({ children }: { children: React.ReactNode }) { return <Theme>{children}</Theme>; }',
      "src/components/ui/radix-theme.stories.tsx":
        "export default { title: 'UI/RadixThemePilot' };",
    });
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
  });

  it("fails when Radix Themes is imported from an unapproved UI wrapper", () => {
    const rootDir = createFixture({
      "src/components/component-governance.registry.json": registry({
        badge: { story: "required" },
      }),
      "src/components/ui/badge.tsx":
        'import { Badge } from "@radix-ui/themes";\nexport function LocalBadge() { return <Badge />; }',
      "src/components/ui/badge.stories.tsx":
        "export default { title: 'UI/Badge' };",
    });
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(
      result.errors,
      "radix-themes-import-unapproved-ui-wrapper",
      "src/components/ui/badge.tsx",
    );
  });

  it("fails when Radix Themes subpath imports are used outside approved wrappers", () => {
    const rootDir = createFixture(
      baseFiles({
        "src/components/forms/contact-form.tsx":
          'export async function loadContactFormUi() { return import("@radix-ui/themes/components/text-field"); }',
        "src/components/contact/contact-card.tsx":
          'const themes = require("@radix-ui/themes/components/card");\nexport function ContactCard() { return themes; }',
      }),
    );
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(
      result.errors,
      "radix-themes-import-outside-ui-wrapper",
      "src/components/forms/contact-form.tsx",
    );
    expectFinding(
      result.errors,
      "radix-themes-import-outside-ui-wrapper",
      "src/components/contact/contact-card.tsx",
    );
  });

  it("fails when production UI code styles Radix Themes internal classes", () => {
    const rootDir = createFixture(
      baseFiles({
        "src/components/ui/button.tsx":
          'export function Button() { return <button className="rt-Button" />; }',
        "src/components/sections/hero-section.tsx":
          'export function HeroSection() { return <div className="[&_.rt-Card]:p-4" />; }',
      }),
    );
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(
      result.errors,
      "radix-themes-internal-class",
      "src/components/ui/button.tsx",
    );
    expectFinding(
      result.errors,
      "radix-themes-internal-class",
      "src/components/sections/hero-section.tsx",
    );
  });

  it("fails on obvious raw Tailwind palette classes in production files", () => {
    const rootDir = createFixture(
      baseFiles({
        "src/app/[locale]/page.tsx":
          'export default function Page() { return <div className="bg-blue-500 text-white" />; }',
      }),
    );
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(
      result.errors,
      "raw-tailwind-palette-class",
      "src/app/[locale]/page.tsx",
    );
  });

  it("ignores raw Tailwind palette classes in story and test files", () => {
    const rootDir = createFixture(
      baseFiles({
        "src/components/products/product-card.stories.tsx":
          'export const Default = () => <div className="bg-blue-500" />;',
        "src/components/products/product-card.test.tsx":
          'it("uses palette classes", () => "bg-blue-500");',
      }),
    );
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
  });

  it("fails when browser UI imports static theme colors by static, dynamic, or require path", () => {
    const rootDir = createFixture(
      baseFiles({
        "src/components/theme/theme-switcher.tsx":
          'import { colors } from "@/config/static-theme-colors";\nexport function ThemeSwitcher() { return null; }',
        "src/app/[locale]/theme/page.tsx":
          'import { colors } from "../../../config/static-theme-colors";\nexport default function Page() { return null; }',
        "src/components/footer/footer-colors.tsx":
          'export async function loadColors() { return import("@/config/static-theme-colors"); }',
        "src/components/contact/contact-colors.tsx":
          'const colors = require("../../config/static-theme-colors");\nexport function ContactColors() { return colors.primary; }',
      }),
    );
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(
      result.errors,
      "static-theme-colors-browser-import",
      "src/components/theme/theme-switcher.tsx",
    );
    expectFinding(
      result.errors,
      "static-theme-colors-browser-import",
      "src/app/[locale]/theme/page.tsx",
    );
    expectFinding(
      result.errors,
      "static-theme-colors-browser-import",
      "src/components/footer/footer-colors.tsx",
    );
    expectFinding(
      result.errors,
      "static-theme-colors-browser-import",
      "src/components/contact/contact-colors.tsx",
    );
  });
});
