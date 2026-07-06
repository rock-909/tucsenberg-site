import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const focusedComponentGovernance = require("../../../scripts/quality/checks/component-governance.js");
const starterChecksFacade = require("../../../scripts/starter-checks.js");
const { collectComponentGovernanceFindings } = starterChecksFacade;

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

const VALID_BUTTON_REGISTRY_ITEM = {
  story: "required",
  radixLayer: "primitive",
  surface: "control",
  clientBoundary: "server-safe",
  themeBoundary: "none",
  useWhen: "Use for CTAs and clickable actions.",
  avoidWhen: "Do not handwrite button styling in pages.",
};

function registry(components: Record<string, unknown>): string {
  return JSON.stringify({ version: 1, components }, null, 2);
}

function baseFiles(extraFiles: Record<string, string> = {}) {
  return {
    "src/components/component-governance.registry.json": registry({
      button: VALID_BUTTON_REGISTRY_ITEM,
    }),
    "src/components/ui/button.tsx":
      'import { Slot } from "@radix-ui/react-slot";\nexport function Button() { return <Slot />; }',
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

  it("keeps starter-checks component governance exports wired to the focused module", () => {
    expect(starterChecksFacade.collectComponentGovernanceFindings).toBe(
      focusedComponentGovernance.collectComponentGovernanceFindings,
    );
    expect(starterChecksFacade.runComponentGovernanceCli).toBe(
      focusedComponentGovernance.runComponentGovernanceCli,
    );
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

  it("fails when a registry item is missing agent selection metadata", () => {
    const rootDir = createFixture(
      baseFiles({
        "src/components/component-governance.registry.json": registry({
          button: {
            story: "required",
            radixLayer: "primitive",
            surface: "control",
            clientBoundary: "server-safe",
            themeBoundary: "none",
            useWhen: "Use for CTAs and clickable actions.",
          },
        }),
      }),
    );
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(result.errors, "registry-agent-field-missing");
  });

  it("fails when a registry item uses invalid agent selection metadata", () => {
    const rootDir = createFixture(
      baseFiles({
        "src/components/component-governance.registry.json": registry({
          button: {
            story: "required",
            radixLayer: "vendor",
            surface: "control",
            clientBoundary: "server-safe",
            themeBoundary: "none",
            useWhen: "Use for CTAs and clickable actions.",
            avoidWhen: "Do not handwrite button styling in pages.",
          },
        }),
      }),
    );
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(result.errors, "registry-agent-field-invalid");
  });

  it("passes when a registry item includes valid agent selection metadata", () => {
    const rootDir = createFixture(
      baseFiles({
        "src/components/component-governance.registry.json": registry({
          button: VALID_BUTTON_REGISTRY_ITEM,
        }),
      }),
    );
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
  });

  it("fails when registry clientBoundary drifts from wrapper source", () => {
    const rootDir = createFixture(
      baseFiles({
        "src/components/component-governance.registry.json": registry({
          button: {
            ...VALID_BUTTON_REGISTRY_ITEM,
            clientBoundary: "server-safe",
          },
        }),
        "src/components/ui/button.tsx":
          '"use client";\nimport { Slot } from "@radix-ui/react-slot";\nexport function Button() { return <Slot />; }',
      }),
    );
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(result.errors, "registry-agent-source-mismatch");
  });

  it("fails when registry radixLayer drifts from wrapper source", () => {
    const rootDir = createFixture(
      baseFiles({
        "src/components/component-governance.registry.json": registry({
          button: {
            ...VALID_BUTTON_REGISTRY_ITEM,
            radixLayer: "themes",
          },
        }),
        "src/components/ui/button.tsx":
          'import { Slot } from "@radix-ui/react-slot";\nexport function Button() { return <Slot />; }',
      }),
    );
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(result.errors, "registry-agent-source-mismatch");
  });

  it("fails when registry themeBoundary drifts from wrapper source", () => {
    const rootDir = createFixture({
      "src/components/component-governance.registry.json": registry({
        "data-card": {
          story: "required",
          radixLayer: "themes",
          surface: "data",
          clientBoundary: "server-safe",
          themeBoundary: "parent-scoped",
          useWhen:
            "Use for specs, parameters, trade terms, form fallback, and structured facts.",
          avoidWhen:
            "Do not use for persuasive marketing, resources, or product story cards.",
        },
      }),
      "src/components/ui/data-card.tsx":
        'import { Card as RadixCard } from "@radix-ui/themes";\nimport { RadixThemePilot } from "@/components/ui/radix-theme";\nexport function DataCard() { return <RadixThemePilot><RadixCard /></RadixThemePilot>; }',
      "src/components/ui/data-card.stories.tsx":
        "export default { title: 'UI/DataCard' };",
    });
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(result.errors, "registry-agent-source-mismatch");
  });

  it("fails when business code imports RadixThemePilot outside ui wrappers", () => {
    const rootDir = createFixture(
      baseFiles({
        "src/components/sections/hero-section.tsx":
          'import { RadixThemePilot } from "@/components/ui/radix-theme";\nexport function HeroSection() { return null; }',
      }),
    );
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(
      result.errors,
      "radix-theme-pilot-import-outside-ui-wrapper",
      "src/components/sections/hero-section.tsx",
    );
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
        button: VALID_BUTTON_REGISTRY_ITEM,
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

  it("allows Radix Themes imports inside approved stable UI wrappers", () => {
    const rootDir = createFixture({
      "src/components/component-governance.registry.json": registry({
        badge: {
          story: "required",
          radixLayer: "themes",
          surface: "feedback",
          clientBoundary: "server-safe",
          themeBoundary: "self-contained",
          useWhen:
            "Use for small status chips or labels with semantic variants.",
          avoidWhen:
            "Do not use for long narrative text or raw Radix palette names.",
        },
        "data-card": {
          story: "required",
          radixLayer: "themes",
          surface: "data",
          clientBoundary: "server-safe",
          themeBoundary: "self-contained",
          useWhen:
            "Use for specs, parameters, trade terms, form fallback, and structured facts.",
          avoidWhen:
            "Do not use for persuasive marketing, resources, or product story cards.",
        },
        input: {
          story: "required",
          radixLayer: "themes",
          surface: "form",
          clientBoundary: "server-safe",
          themeBoundary: "self-contained",
          useWhen: "Use for text, email, search, number, tel, and URL fields.",
          avoidWhen:
            "Do not use for file or hidden inputs that must stay native.",
        },
        "radix-theme": {
          story: "required",
          radixLayer: "themes",
          surface: "theme",
          clientBoundary: "server-safe",
          themeBoundary: "self-contained",
          useWhen:
            "Use only inside approved UI wrappers to scope Radix Themes.",
          avoidWhen:
            "Do not import from pages, sections, forms, product, contact, or layout code.",
        },
        "status-callout": {
          story: "required",
          radixLayer: "themes",
          surface: "feedback",
          clientBoundary: "server-safe",
          themeBoundary: "self-contained",
          useWhen:
            "Use for info, success, warning, error, unavailable, or form status messages.",
          avoidWhen: "Do not build ad hoc alert panels in business components.",
        },
        textarea: {
          story: "required",
          radixLayer: "themes",
          surface: "form",
          clientBoundary: "server-safe",
          themeBoundary: "self-contained",
          useWhen: "Use for multiline text entry.",
          avoidWhen: "Do not handwrite textarea styles in business components.",
        },
      }),
      "src/components/ui/badge.tsx":
        'import { Badge } from "@radix-ui/themes";\nimport { RadixThemePilot } from "@/components/ui/radix-theme";\nexport function LocalBadge() { return <RadixThemePilot><Badge /></RadixThemePilot>; }',
      "src/components/ui/badge.stories.tsx":
        "export default { title: 'UI/Badge' };",
      "src/components/ui/data-card.tsx":
        'import { Card } from "@radix-ui/themes";\nimport { RadixThemePilot } from "@/components/ui/radix-theme";\nexport function DataCard() { return <RadixThemePilot><Card /></RadixThemePilot>; }',
      "src/components/ui/data-card.stories.tsx":
        "export default { title: 'UI/DataCard' };",
      "src/components/ui/input.tsx":
        'import { TextField } from "@radix-ui/themes";\nimport { RadixThemePilot } from "@/components/ui/radix-theme";\nexport function Input() { return <RadixThemePilot><TextField.Root /></RadixThemePilot>; }',
      "src/components/ui/input.stories.tsx":
        "export default { title: 'UI/Input' };",
      "src/components/ui/radix-theme.tsx":
        'import { Theme } from "@radix-ui/themes";\nexport function RadixThemePilot({ children }: { children: React.ReactNode }) { return <Theme>{children}</Theme>; }',
      "src/components/ui/radix-theme.stories.tsx":
        "export default { title: 'UI/RadixThemePilot' };",
      "src/components/ui/status-callout.tsx":
        'import { Callout } from "@radix-ui/themes";\nimport { RadixThemePilot } from "@/components/ui/radix-theme";\nexport function StatusCallout() { return <RadixThemePilot><Callout.Root /></RadixThemePilot>; }',
      "src/components/ui/status-callout.stories.tsx":
        "export default { title: 'UI/StatusCallout' };",
      "src/components/ui/textarea.tsx":
        'import { TextArea } from "@radix-ui/themes";\nimport { RadixThemePilot } from "@/components/ui/radix-theme";\nexport function Textarea() { return <RadixThemePilot><TextArea /></RadixThemePilot>; }',
      "src/components/ui/textarea.stories.tsx":
        "export default { title: 'UI/Textarea' };",
    });
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
  });

  it("fails when Radix Themes is imported from an unapproved UI wrapper", () => {
    const rootDir = createFixture({
      "src/components/component-governance.registry.json": registry({
        checkbox: { story: "required" },
      }),
      "src/components/ui/checkbox.tsx":
        'import { Checkbox } from "@radix-ui/themes";\nexport function LocalCheckbox() { return <Checkbox />; }',
      "src/components/ui/checkbox.stories.tsx":
        "export default { title: 'UI/Checkbox' };",
    });
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(
      result.errors,
      "radix-themes-import-unapproved-ui-wrapper",
      "src/components/ui/checkbox.tsx",
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
