/* eslint-disable max-lines, max-lines-per-function, max-statements -- profile readiness contract matrix stays in one file */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  collectContentReadinessFindings,
  runContentReadinessCheck,
} from "../../../scripts/starter-checks.js";

interface FindingShape {
  file: string;
  line: number;
  ruleId: string;
  severity: "error" | "warning";
  message: string;
}

const TEMP_TRASH_ROOT = path.join(
  os.tmpdir(),
  "showcase-content-readiness-test-trash",
);

function createFixture(files: Record<string, string>): string {
  const rootDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "showcase-content-readiness-"),
  );

  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = path.join(rootDir, relativePath);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- test fixture path is inside a test-owned temporary directory
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- test fixture path is inside a test-owned temporary directory
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

function expectFinding(
  findings: FindingShape[],
  ruleId: string,
  file?: string,
): void {
  expect(findings).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        ruleId,
        ...(file ? { file } : {}),
      }),
    ]),
  );
}

describe("content-readiness-check", () => {
  const fixtureRoots: string[] = [];

  afterEach(() => {
    for (const rootDir of fixtureRoots.splice(0)) {
      moveFixtureToTrash(rootDir);
    }
  });

  it("fails on hard fake buyer-visible content", () => {
    const rootDir = createFixture({
      "content/pages/en/about.mdx": "lorem ipsum\nCall +1 555-123-4567",
      "messages/profiles/b2b-lead/en/critical.json": JSON.stringify({
        cta: "Contact your company",
      }),
      "src/config/single-site-product-catalog.ts":
        "export const product = 'Sample Product';",
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(result.errors, "lorem-ipsum", "content/pages/en/about.mdx");
    expectFinding(result.errors, "fake-phone", "content/pages/en/about.mdx");
    expectFinding(
      result.warnings,
      "your-company",
      "messages/profiles/b2b-lead/en/critical.json",
    );
    expectFinding(
      result.warnings,
      "sample-product",
      "src/config/single-site-product-catalog.ts",
    );
  });

  it("warns on neutral starter placeholder wording without failing", () => {
    const rootDir = createFixture({
      "messages/profiles/b2b-lead/en/deferred.json": JSON.stringify({
        form: {
          placeholder: "Enter your email address",
        },
      }),
      "content/pages/en/about.mdx":
        "Replace placeholder claims with evidence your real project can support.",
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
    expectFinding(result.warnings, "placeholder");
  });

  it("does not treat JSON keys as buyer-visible residue", () => {
    const rootDir = createFixture({
      "messages/profiles/b2b-lead/en/deferred.json": JSON.stringify({
        form: {
          placeholder: "Enter your email address",
          phonePlaceholder: "Phone number",
        },
      }),
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("does not treat config asset paths as buyer-visible product residue", () => {
    const rootDir = createFixture({
      "src/config/single-site-product-catalog.ts":
        "export const product = { image: '/images/products/sample-product.svg' };",
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("does not treat absolute config asset URLs as buyer-visible product residue", () => {
    const rootDir = createFixture({
      "src/config/single-site-product-catalog.ts":
        "export const product = { image: 'https://cdn.example.com/images/products/sample-product.svg' };",
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("does not treat commented config strings as buyer-visible product residue", () => {
    const rootDir = createFixture({
      "src/config/single-site.ts": [
        '// "Sample Product" belongs in documentation, not runtime config.',
        'export const profile = { companyName: "Real Company" };',
      ].join("\n"),
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("does not treat quoted config object keys as buyer-visible content", () => {
    const rootDir = createFixture({
      "src/config/single-site.ts":
        'export const profile = { "placeholder": "Real Company" };',
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("scans static template string values in config", () => {
    const rootDir = createFixture({
      "src/config/single-site.ts":
        "export const profile = { heroTitle: `Sample Product` };",
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expectFinding(
      result.warnings,
      "sample-product",
      "src/config/single-site.ts",
    );
  });

  it("scans catalog specs and product catalog config as buyer-visible truth", () => {
    const rootDir = createFixture({
      "src/constants/product-specs/north-america.ts": [
        "export const NORTH_AMERICA_SPECS = {",
        '  technical: { material: "Replaceable core material" },',
        '  certifications: ["Example Standard A"],',
        "};",
      ].join("\n"),
      "src/config/single-site-product-catalog.ts": [
        "export const singleSiteProductCatalog = {",
        '  markets: [{ label: "Primary Offer Example" }],',
        "};",
      ].join("\n"),
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expectFinding(
      result.warnings,
      "replaceable-content",
      "src/constants/product-specs/north-america.ts",
    );
    expectFinding(
      result.warnings,
      "example-standard",
      "src/constants/product-specs/north-america.ts",
    );
    expectFinding(
      result.warnings,
      "example-offer",
      "src/config/single-site-product-catalog.ts",
    );
  });

  it("does not treat commented logo asset references as runtime references", () => {
    const rootDir = createFixture({
      "src/config/single-site.ts": [
        "// docs note: replace /images/logo.svg later",
        'export const profile = { companyName: "Real Company" };',
      ].join("\n"),
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("does not treat config module paths as buyer-visible content", () => {
    const rootDir = createFixture({
      "src/config/single-site.ts": [
        'import placeholderKit from "@acme/placeholder-kit";',
        'export { sampleProductConfig } from "./sample-product-config";',
        'export const profile = { companyName: "Real Company" };',
        "void placeholderKit;",
      ].join("\n"),
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("does not treat TypeScript string literal types as buyer-visible content", () => {
    const rootDir = createFixture({
      "src/config/single-site.ts": [
        'export type ProductName = "Sample Product";',
        'export type LogoPath = "/images/logo.svg";',
        "export interface Profile {",
        '  category: "placeholder";',
        "}",
        'export const profile = { companyName: "Real Company" };',
      ].join("\n"),
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("scans TypeScript enum string values as runtime config content", () => {
    const rootDir = createFixture({
      "src/config/single-site.ts": [
        "export enum BrandText {",
        '  Title = "Sample Product",',
        '  Logo = "/images/logo.svg",',
        "}",
      ].join("\n"),
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expectFinding(
      result.warnings,
      "sample-product",
      "src/config/single-site.ts",
    );
    expect(result.errors).toEqual([]);
  });

  it("does not scan docs tests reports generated output or test files", () => {
    const rootDir = createFixture({
      "docs/example.md": "placeholder TODO Sample Product",
      "reports/deploy/result.json": "lorem ipsum",
      "generated/content.json": "your@email",
      "tests/unit/bad.test.ts": "const text = 'Replace this image';",
      "messages/__tests__/bad.json": JSON.stringify({
        text: "lorem ipsum",
      }),
      "content/pages/en/about.test.mdx": "placeholder",
      "content/pages/en/about.spec.mdx": "TODO",
      "public/images/README.md": "placeholder TODO Sample Product",
      "content/pages/en/about.mdx": "Real company content.",
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("reports example.com as a warning without failing the check", () => {
    const rootDir = createFixture({
      "src/config/single-site.ts":
        "export const website = { domain: 'https://example.com' };",
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
    expectFinding(
      result.warnings,
      "example-domain",
      "src/config/single-site.ts",
    );
  });

  it("warns on buyer-visible starter identity residue without failing the default starter check", () => {
    const rootDir = createFixture({
      "messages/profiles/minimal/en/critical.json": JSON.stringify({
        title: "Showcase Website Starter",
      }),
      "content/pages/en/about.mdx": "Welcome to Public Demo Starter Site.",
      "src/config/single-site.ts":
        'export const site = { name: "Reusable Showcase Website Starter" };',
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
    expectFinding(result.warnings, "starter-identity");
  });

  it("promotes client-launch residue warnings to errors only in strict client launch mode", () => {
    const rootDir = createFixture({
      "messages/profiles/minimal/en/critical.json": JSON.stringify({
        title: "Showcase Website Starter",
        product: "Sample Product",
        standard: "Example Standard A",
        email: "Send requests to your@email before launch.",
        phonePlaceholder: "+1-312-555-0198",
      }),
      "content/pages/en/about.mdx": "Visit https://example.com before launch.",
    });
    fixtureRoots.push(rootDir);

    const defaultResult = runContentReadinessCheck(rootDir);
    const strictResult = runContentReadinessCheck(rootDir, {
      strictClientLaunch: true,
    });

    expect(defaultResult.status).toBe("passed");
    expectFinding(defaultResult.warnings, "starter-identity");
    expectFinding(defaultResult.warnings, "fake-phone");

    expect(strictResult.status).toBe("failed");
    expectFinding(strictResult.errors, "starter-identity");
    expectFinding(strictResult.errors, "sample-product");
    expectFinding(strictResult.errors, "example-standard");
    expectFinding(strictResult.errors, "your-email");
    expectFinding(strictResult.errors, "fake-phone");
    expectFinding(strictResult.errors, "example-domain");
  });

  it("warns on example.com in buyer-visible page content", () => {
    const rootDir = createFixture({
      "content/pages/en/about.mdx": "Visit https://example.com before launch.",
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expectFinding(
      result.warnings,
      "example-domain",
      "content/pages/en/about.mdx",
    );
  });

  it("does not treat MDX comments as buyer-visible content", () => {
    const rootDir = createFixture({
      "content/pages/en/about.mdx":
        "{/* Sample Product should stay in comment only */}\nReal content.",
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("does not treat multiline MDX comments as buyer-visible content", () => {
    const rootDir = createFixture({
      "content/pages/en/about.mdx": [
        "{/*",
        "Sample Product should stay in comment only",
        "*/}",
        "Real content.",
      ].join("\n"),
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("scans canonical split locale message files", () => {
    const rootDir = createFixture({
      "messages/base/zh/critical.json": JSON.stringify({
        headline: "lorem ipsum",
      }),
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(
      result.errors,
      "lorem-ipsum",
      "messages/base/zh/critical.json",
    );
  });

  it("reports the real JSON value line when keys repeat", () => {
    const rootDir = createFixture({
      "messages/base/en/critical.json": [
        "{",
        '  "first": {',
        '    "label": "Clean label"',
        "  },",
        '  "second": {',
        '    "label": "lorem ipsum"',
        "  }",
        "}",
      ].join("\n"),
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          file: "messages/base/en/critical.json",
          line: 6,
          ruleId: "lorem-ipsum",
        }),
      ]),
    );
  });

  it("reports the JSON value line instead of the same-word key line", () => {
    const rootDir = createFixture({
      "messages/base/en/critical.json": [
        "{",
        '  "safe": "Clean copy",',
        '  "placeholder": {',
        '    "label": "placeholder"',
        "  },",
        '  "after": "Clean copy"',
        "}",
      ].join("\n"),
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          file: "messages/base/en/critical.json",
          line: 4,
          ruleId: "placeholder",
        }),
      ]),
    );
  });

  it("warns on fake phone values when they are explicit placeholders", () => {
    const rootDir = createFixture({
      "messages/profiles/b2b-lead/en/deferred.json": JSON.stringify({
        phonePlaceholder: "+1 (555) 123-4567",
      }),
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expectFinding(
      result.warnings,
      "fake-phone",
      "messages/profiles/b2b-lead/en/deferred.json",
    );
  });

  it("keeps fake phone values blocking when placeholder is only nearby", () => {
    const rootDir = createFixture({
      "content/pages/en/contact.mdx":
        "placeholder\nCall +1 555-123-4567 before launch.",
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(result.errors, "fake-phone", "content/pages/en/contact.mdx");
  });

  it("warns on generic email placeholders without failing", () => {
    const rootDir = createFixture({
      "messages/profiles/b2b-lead/en/deferred.json": JSON.stringify({
        contact: "Send requests to your@email before launch.",
      }),
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expectFinding(
      result.warnings,
      "your-email",
      "messages/profiles/b2b-lead/en/deferred.json",
    );
  });

  it("does not scan placeholder text inside SVG assets", () => {
    const rootDir = createFixture({
      "public/images/products/product-photo.svg":
        '<svg role="img" aria-label="Sample Product placeholder"></svg>',
      "content/pages/en/about.mdx": "Real content.",
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
  });

  it("does not scan logo references inside SVG XML text", () => {
    const rootDir = createFixture({
      "public/images/products/real-product.svg":
        "<svg><text>/images/logo.svg</text></svg>",
      "content/pages/en/about.mdx": "Real content.",
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("warns on starter residue in SVG asset filenames without scanning SVG text", () => {
    const rootDir = createFixture({
      "public/images/products/sample-product.svg": '<svg role="img"></svg>',
      "content/pages/en/about.mdx": "Real content.",
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expectFinding(
      result.warnings,
      "sample-product",
      "public/images/products/sample-product.svg",
    );
  });

  it("does not treat canonical config logo placeholders as runtime image references", () => {
    const rootDir = createFixture({
      "src/config/single-site.ts": "export const logo = '/images/logo.svg';",
      "content/pages/en/about.mdx": "Real content.",
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
  });

  it("does not treat prose mentions of /images/logo.svg as runtime references", () => {
    const rootDir = createFixture({
      "content/pages/en/about.mdx": [
        "This page mentions `/images/logo.svg` as an example path.",
        "Real content.",
      ].join("\n"),
      "messages/profiles/minimal/en/critical.json": JSON.stringify({
        note: "Mention /images/logo.svg only as a replacement note.",
      }),
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("reports a missing /images/logo.svg MDX image runtime reference", () => {
    const rootDir = createFixture({
      "content/pages/en/about.mdx": "![Company logo](/images/logo.svg)",
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(
      result.errors,
      "missing-logo-asset",
      "content/pages/en/about.mdx",
    );
  });

  it("reports a missing /images/logo.svg MDX attribute runtime reference", () => {
    const rootDir = createFixture({
      "content/pages/en/about.mdx": '<img src="/images/logo.svg" alt="Logo" />',
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(
      result.errors,
      "missing-logo-asset",
      "content/pages/en/about.mdx",
    );
  });

  it("reports a missing /images/logo.svg MDX JSX image expression runtime reference", () => {
    const rootDir = createFixture({
      "content/pages/en/about.mdx":
        '<img src={"/images/logo.svg"} alt="Logo" />',
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(
      result.errors,
      "missing-logo-asset",
      "content/pages/en/about.mdx",
    );
  });

  it("reports a missing /images/logo.svg MDX JSX link expression runtime reference", () => {
    const rootDir = createFixture({
      "content/pages/en/about.mdx":
        "<a href={'/images/logo.svg'}>Logo asset</a>",
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(
      result.errors,
      "missing-logo-asset",
      "content/pages/en/about.mdx",
    );
  });

  it("reports a missing /images/logo.svg MDX JSX template expression runtime reference", () => {
    const rootDir = createFixture({
      "content/pages/en/about.mdx":
        '<img src={`/images/logo.svg`} alt="Logo" />',
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(
      result.errors,
      "missing-logo-asset",
      "content/pages/en/about.mdx",
    );
  });

  it("passes when logo.svg exists and visible content is clean", () => {
    const rootDir = createFixture({
      "src/config/single-site.ts": "export const logo = '/images/logo.svg';",
      "public/images/logo.svg": '<svg role="img"></svg>',
      "content/pages/en/about.mdx": "Real company content.",
      "messages/profiles/b2b-lead/en/critical.json": JSON.stringify({
        cta: "Contact us",
      }),
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("collectContentReadinessFindings exposes raw findings for callers", () => {
    const rootDir = createFixture({
      "content/pages/en/contact.mdx": "TODO replace this image",
    });
    fixtureRoots.push(rootDir);

    const findings = collectContentReadinessFindings(rootDir);

    expectFinding(findings, "todo-marker", "content/pages/en/contact.mdx");
    expectFinding(
      findings,
      "replace-this-image",
      "content/pages/en/contact.mdx",
    );
  });

  it("skips optional profile message packs for b2b-lead readiness", () => {
    const rootDir = createFixture({
      "messages/base/en/critical.json": JSON.stringify({
        common: { loading: "Loading" },
      }),
      "messages/profiles/minimal/en/critical.json": JSON.stringify({
        home: { hero: { title: "Real client title" } },
      }),
      "messages/profiles/b2b-lead/en/deferred.json": JSON.stringify({
        contact: { heading: "Talk to the team" },
      }),
      "messages/profiles/catalog/en/critical.json": JSON.stringify({
        catalog: { heading: "Primary Offer Example" },
      }),
      "messages/profiles/content-marketing/en/critical.json": JSON.stringify({
        blog: { heading: "Showcase Website Starter" },
      }),
      "messages/profiles/showcase-full/en/deferred.json": JSON.stringify({
        customProject: { heading: "Primary Offer Example" },
      }),
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir, {
      profileId: "b2b-lead",
      strictClientLaunch: true,
    });

    expect(result.status).toBe("passed");
    expect(result.findings).toEqual([]);
  });

  it("skips optional catalog and showcase-full residue for b2b-lead profile readiness", () => {
    const rootDir = createFixture({
      "content/pages/en/about.mdx": "Real about page content.",
      "content/pages/en/contact.mdx": "Real contact page content.",
      "content/pages/en/privacy.mdx": "Real privacy page content.",
      "content/pages/en/terms.mdx": "Real terms page content.",
      "content/pages/en/capabilities.mdx": "Sample Product",
      "messages/profiles/minimal/en/critical.json": JSON.stringify({
        home: { title: "Real homepage" },
        contact: { title: "Real contact" },
      }),
      "messages/profiles/b2b-lead/en/deferred.json": JSON.stringify({
        contact: { title: "Real contact form" },
      }),
      "messages/profiles/catalog/en/critical.json": JSON.stringify({
        catalog: { title: "Sample Product" },
      }),
      "messages/profiles/content-marketing/en/critical.json": JSON.stringify({
        blog: { title: "Visit example.com" },
      }),
      "messages/profiles/showcase-full/en/deferred.json": JSON.stringify({
        customProject: { title: "Primary Offer Example" },
      }),
      "src/config/single-site-product-catalog.ts":
        "export const catalog = { title: 'Primary Offer Example' };",
      "src/constants/product-specs/north-america.ts":
        "export const spec = { standard: 'Example Standard A' };",
      "public/images/products/sample-product.svg": "<svg />",
      "public/images/blog/welcome-cover.jpg": "fake image",
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir, {
      profileId: "b2b-lead",
      strictClientLaunch: true,
    });

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("keeps minimal readiness to core starter pages and messages", () => {
    const rootDir = createFixture({
      "content/pages/en/privacy.mdx": "Real privacy page content.",
      "content/pages/en/terms.mdx": "Real terms page content.",
      "content/pages/en/about.mdx": "Sample Product",
      "messages/base/en/critical.json": JSON.stringify({
        common: { cta: "Continue" },
        privacy: { title: "Real privacy" },
      }),
      "messages/profiles/minimal/en/critical.json": JSON.stringify({
        home: { title: "Real homepage" },
        contact: { title: "Sample Product" },
      }),
      "messages/profiles/catalog/en/deferred.json": JSON.stringify({
        products: { title: "Example Standard A" },
      }),
      "src/config/single-site.ts":
        "export const site = { name: 'Real Company' };",
      "src/config/single-site-product-catalog.ts":
        "export const catalog = { title: 'Sample Product' };",
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir, {
      profileId: "minimal",
      strictClientLaunch: true,
    });

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("reports b2b-lead owned asset placeholders by path", () => {
    const rootDir = createFixture({
      "public/images/hero/showcase-placeholder.svg": "<svg />",
      "public/images/products/sample-product.svg": "<svg />",
      "public/images/blog/welcome-cover.jpg": "fake image",
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir, {
      profileId: "b2b-lead",
      strictClientLaunch: true,
    });

    expect(result.status).toBe("failed");
    expectFinding(
      result.errors,
      "placeholder",
      "public/images/hero/showcase-placeholder.svg",
    );
    expect(result.findings).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          file: "public/images/products/sample-product.svg",
        }),
      ]),
    );
    expect(result.findings).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          file: "public/images/blog/welcome-cover.jpg",
        }),
      ]),
    );
  });

  it("reports catalog residue when catalog profile owns the catalog surface", () => {
    const rootDir = createFixture({
      "messages/profiles/catalog/en/critical.json": JSON.stringify({
        catalog: { title: "Sample Product" },
      }),
      "messages/profiles/catalog/en/deferred.json": JSON.stringify({
        products: { title: "Example Standard A" },
      }),
      "src/config/single-site-product-catalog.ts":
        "export const catalog = { title: 'Primary Offer Example' };",
      "src/constants/product-specs/north-america.ts":
        "export const spec = { standard: 'Example Standard A' };",
      "public/images/products/sample-product.svg": "<svg />",
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir, {
      profileId: "catalog",
      strictClientLaunch: true,
    });

    expect(result.status).toBe("failed");
    expectFinding(
      result.errors,
      "sample-product",
      "messages/profiles/catalog/en/critical.json",
    );
    expectFinding(
      result.errors,
      "example-standard",
      "messages/profiles/catalog/en/deferred.json",
    );
    expectFinding(
      result.errors,
      "example-offer",
      "src/config/single-site-product-catalog.ts",
    );
    expectFinding(
      result.errors,
      "example-standard",
      "src/constants/product-specs/north-america.ts",
    );
    expectFinding(
      result.errors,
      "sample-product",
      "public/images/products/sample-product.svg",
    );
  });

  it("reports TODO markers in catalog product specs for catalog readiness", () => {
    const rootDir = createFixture({
      "src/constants/product-specs/tucsenberg-product-lines.ts":
        "export const row = ['Section weight', 'TODO-OWNER', '52 kg'];",
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir, {
      profileId: "catalog",
      strictClientLaunch: true,
    });

    expect(result.status).toBe("failed");
    expectFinding(
      result.errors,
      "todo-marker",
      "src/constants/product-specs/tucsenberg-product-lines.ts",
    );
  });

  it("reports showcase-full residue across optional demo surfaces", () => {
    const rootDir = createFixture({
      "content/pages/en/custom-project-support.mdx": "lorem ipsum",
      "messages/profiles/showcase-full/en/deferred.json": JSON.stringify({
        customProject: { title: "Primary Offer Example" },
      }),
      "src/lib/blog/starter-blog.ts":
        "export const post = { title: 'Visit example.com' };",
      "public/images/blog/example-domain-cover.svg": "<svg />",
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir, {
      profileId: "showcase-full",
      strictClientLaunch: true,
    });

    expect(result.status).toBe("failed");
    expectFinding(
      result.errors,
      "lorem-ipsum",
      "content/pages/en/custom-project-support.mdx",
    );
    expectFinding(
      result.errors,
      "example-offer",
      "messages/profiles/showcase-full/en/deferred.json",
    );
    expectFinding(
      result.errors,
      "example-domain",
      "src/lib/blog/starter-blog.ts",
    );
    expectFinding(
      result.errors,
      "example-domain",
      "public/images/blog/example-domain-cover.svg",
    );
  });

  it("rejects unknown content readiness profile ids", () => {
    const rootDir = createFixture({
      "content/pages/en/about.mdx": "Real about page content.",
    });
    fixtureRoots.push(rootDir);

    expect(() =>
      runContentReadinessCheck(rootDir, {
        profileId: "unknown-profile",
      }),
    ).toThrow(/Unknown content readiness profile: unknown-profile/u);
  });

  it("ignores optional page-expression config for b2b-lead strict readiness", () => {
    const rootDir = createFixture({
      "content/pages/en/about.mdx": "Real about page content.",
      "content/pages/en/contact.mdx": "Real contact page content.",
      "content/pages/en/privacy.mdx": "Real privacy page content.",
      "content/pages/en/terms.mdx": "Real terms page content.",
      "src/config/single-site-page-expression.ts": `
        export const SINGLE_SITE_CUSTOM_PROJECT_PAGE_EXPRESSION = {
          supportedStandards: [
            "Example Standard A",
            "Example Standard B",
          ],
        };
      `,
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir, {
      profileId: "b2b-lead",
      strictClientLaunch: true,
    });

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("skips optional home.products and navigation.products subtrees for b2b-lead", () => {
    const rootDir = createFixture({
      "content/pages/en/about.mdx": "Real about page content.",
      "content/pages/en/contact.mdx": "Real contact page content.",
      "content/pages/en/privacy.mdx": "Real privacy page content.",
      "content/pages/en/terms.mdx": "Real terms page content.",
      "messages/profiles/minimal/en/critical.json": JSON.stringify({
        home: {
          title: "Real homepage",
          products: {
            title: "Replaceable",
            item1: { spec3: "Replace with real product data" },
          },
          quality: {
            standards: {
              exampleA: "Example Standard A",
            },
          },
        },
        navigation: {
          home: "Home",
          products: "Products",
          blog: "Blog",
        },
        footer: {
          sections: {
            navigation: {
              products: "Products",
              blog: "Blog",
            },
          },
        },
      }),
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir, {
      profileId: "b2b-lead",
      strictClientLaunch: true,
    });

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("reports optional home.products residue for catalog profile readiness", () => {
    const rootDir = createFixture({
      "messages/profiles/minimal/en/critical.json": JSON.stringify({
        home: {
          products: {
            title: "Replaceable",
          },
        },
      }),
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir, {
      profileId: "catalog",
      strictClientLaunch: true,
    });

    expect(result.status).toBe("failed");
    expectFinding(
      result.errors,
      "replaceable-content",
      "messages/profiles/minimal/en/critical.json",
    );
  });

  it("rejects unknown content readiness profile ids through the CLI", () => {
    const scriptPath = path.join(
      __dirname,
      "../../../scripts/starter-checks.js",
    );
    const rootDir = createFixture({});
    fixtureRoots.push(rootDir);
    const result = spawnSync(
      process.execPath,
      [scriptPath, "content-readiness", "--profile", "unknown-profile"],
      {
        cwd: rootDir,
        encoding: "utf8",
      },
    );

    expect(result.status).not.toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toContain(
      "Unknown content readiness profile: unknown-profile",
    );
  });
});

describe("content-readiness-check profile fixtures", () => {
  const fixtureRoots: string[] = [];

  afterEach(() => {
    for (const rootDir of fixtureRoots.splice(0)) {
      moveFixtureToTrash(rootDir);
    }
  });

  it("keeps profile fixture residue out of b2b-lead readiness and inside optional lanes", () => {
    const rootDir = createFixture({
      "content/pages/en/about.mdx": "Real about page content.",
      "profile-fixtures/catalog/product-catalog.ts":
        "export const catalog = { label: 'Primary Offer Example' };",
      "profile-fixtures/catalog/product-specs/north-america.ts":
        "export const specs = { standard: 'Example Standard A' };",
      "profile-fixtures/content-marketing/starter-blog.ts":
        "export const post = { title: 'Visit example.com' };",
      "profile-fixtures/showcase-full/content/pages/en/capabilities.mdx":
        "lorem ipsum",
      "public/profile-fixtures/catalog/products/sample-product.svg": "<svg />",
      "public/profile-fixtures/content-marketing/blog/example-domain-welcome-cover.jpg":
        "fake image",
    });
    fixtureRoots.push(rootDir);

    const b2bLeadResult = runContentReadinessCheck(rootDir, {
      profileId: "b2b-lead",
      strictClientLaunch: true,
    });
    expect(b2bLeadResult.status).toBe("passed");
    expect(b2bLeadResult.errors).toEqual([]);
    expect(b2bLeadResult.warnings).toEqual([]);

    const catalogResult = runContentReadinessCheck(rootDir, {
      profileId: "catalog",
      strictClientLaunch: true,
    });
    expect(catalogResult.status).toBe("failed");
    expectFinding(
      catalogResult.errors,
      "example-offer",
      "profile-fixtures/catalog/product-catalog.ts",
    );
    expectFinding(
      catalogResult.errors,
      "example-standard",
      "profile-fixtures/catalog/product-specs/north-america.ts",
    );
    expectFinding(
      catalogResult.errors,
      "sample-product",
      "public/profile-fixtures/catalog/products/sample-product.svg",
    );

    const contentMarketingResult = runContentReadinessCheck(rootDir, {
      profileId: "content-marketing",
      strictClientLaunch: true,
    });
    expect(contentMarketingResult.status).toBe("failed");
    expectFinding(
      contentMarketingResult.errors,
      "example-domain",
      "profile-fixtures/content-marketing/starter-blog.ts",
    );
    expectFinding(
      contentMarketingResult.errors,
      "example-domain",
      "public/profile-fixtures/content-marketing/blog/example-domain-welcome-cover.jpg",
    );

    const showcaseFullResult = runContentReadinessCheck(rootDir, {
      profileId: "showcase-full",
      strictClientLaunch: true,
    });
    expect(showcaseFullResult.status).toBe("failed");
    expectFinding(
      showcaseFullResult.errors,
      "lorem-ipsum",
      "profile-fixtures/showcase-full/content/pages/en/capabilities.mdx",
    );
  });
});
