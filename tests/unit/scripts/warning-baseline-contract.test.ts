import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "../../..");

function readRepoFile(relativePath: string) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads fixed repo fixture files by relative path
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

describe("generated warning baseline contract", () => {
  it("keeps React Doctor wired as an error gate plus manual JSON report", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts["react:doctor"]).toBe(
      "react-doctor . --offline --fail-on error",
    );
    expect(packageJson.scripts["react:doctor:report"]).toBe(
      "react-doctor . --offline --json --fail-on none",
    );
    expect(packageJson.scripts).not.toHaveProperty("react:doctor:classify");
    expect(packageJson.scripts).not.toHaveProperty("react:doctor:governance");
    expect(packageJson.scripts).not.toHaveProperty(
      "react:doctor:raw-governance",
    );
  });

  it("tracks generated warning baselines without treating them as source defects", () => {
    const cloudflareBaseline = readRepoFile(
      "docs/quality/cloudflare-warning-baseline.md",
    );
    const storybookBaseline = readRepoFile(
      "docs/quality/storybook-warning-baseline.md",
    );
    const qualityProof = readRepoFile("docs/website/quality-proof.md");

    expect(cloudflareBaseline).toContain("duplicate-case");
    expect(cloudflareBaseline).toContain("direct-eval");
    expect(cloudflareBaseline).toContain("equals-negative-zero");
    expect(storybookBaseline).toContain('"use client" was ignored');
    expect(storybookBaseline).toContain("iframe chunk");
    expect(qualityProof).toContain("warning baseline");
    expect(readRepoFile("docs/quality/react-doctor-baseline.md")).toContain(
      "docs/quality/react-doctor-policy.md",
    );
    expect(readRepoFile("docs/quality/react-doctor-baseline.md")).toContain(
      "docs/quality/react-doctor-exceptions.md",
    );
    expect(readRepoFile("docs/quality/react-doctor-baseline.md")).toContain(
      "warningCount: 0",
    );
    expect(readRepoFile("docs/quality/react-doctor-baseline.md")).toContain(
      "score: 100 / 100",
    );
    expect(readRepoFile("docs/quality/react-doctor-policy.md")).toContain(
      "The calibrated gate target is `0 error`",
    );
    expect(readRepoFile("docs/quality/react-doctor-baseline.md")).toContain(
      "knip/types: 0",
    );
    expect(readRepoFile("docs/quality/react-doctor-baseline.md")).toContain(
      "knip/exports: 0",
    );
    expect(readRepoFile("docs/quality/react-doctor-baseline.md")).toContain(
      "knip/files: 0",
    );
    expect(readRepoFile("docs/quality/react-doctor-baseline.md")).toContain(
      "knip/duplicates: 0",
    );
    expect(readRepoFile("docs/quality/react-doctor-baseline.md")).toContain(
      ".claude/skills/**",
    );
    expect(readRepoFile("docs/quality/react-doctor-baseline.md")).toContain(
      ".codex/skills/**",
    );
    expect(readRepoFile("docs/quality/react-doctor-policy.md")).toContain(
      "scoped to Knip-backed",
    );
    expect(readRepoFile("docs/quality/react-doctor-policy.md")).toContain(
      "public-surface `knip/exports` and `knip/types` overrides",
    );
    const retiredZeroWarningClaim = [
      "native scan is",
      "0",
      "warning /",
      "0",
      "error",
    ].join(" ");
    expect(readRepoFile("docs/quality/react-doctor-policy.md")).not.toContain(
      retiredZeroWarningClaim,
    );
    expect(qualityProof).toContain("React Doctor");
    expect(qualityProof).toContain("error blocks CI");
    expect(qualityProof).toContain("warning is backlog");
    expect(qualityProof).toContain("not a separate CI governance layer");
  });

  it("keeps AI skill bundles out of React Doctor's Knip dead-code queue only", () => {
    const config = JSON.parse(readRepoFile("react-doctor.config.json")) as {
      ignore?: {
        files?: string[];
        overrides?: Array<{ files?: string[]; rules?: string[] }>;
      };
    };

    expect(config.ignore?.files ?? []).toEqual([]);

    const skillBundleOverride = config.ignore?.overrides?.find((override) =>
      override.files?.includes(".claude/skills/**"),
    );

    expect(skillBundleOverride?.files).toEqual([
      ".claude/skills/**",
      ".codex/skills/**",
    ]);
    expect(skillBundleOverride?.rules).toEqual([
      "knip/duplicates",
      "knip/exports",
      "knip/files",
      "knip/types",
    ]);
  });

  it("keeps external config and test alias files out of the file-level dead-code queue", () => {
    const config = JSON.parse(readRepoFile("react-doctor.config.json")) as {
      ignore?: {
        overrides?: Array<{ files?: string[]; rules?: string[] }>;
      };
    };

    const externalEntryOverride = config.ignore?.overrides?.find((override) =>
      override.files?.includes("lighthouserc.js"),
    );

    expect(externalEntryOverride?.files).toEqual([
      "lighthouserc.js",
      "open-next.config.ts",
      ".devtools/react-grab-dev.mjs",
      "src/test/css-stub.ts",
      "src/test/mdx-stub.ts",
    ]);
    expect(externalEntryOverride?.rules).toEqual(["knip/files"]);
  });

  it("keeps the product-name lead limit as a semantic duplicate, not a collapsed alias", () => {
    const config = JSON.parse(readRepoFile("react-doctor.config.json")) as {
      ignore?: {
        overrides?: Array<{ files?: string[]; rules?: string[] }>;
      };
    };
    const validationLimits = readRepoFile("src/constants/validation-limits.ts");
    const timeConstants = readRepoFile("src/constants/time.ts");

    const validationDuplicateOverride = config.ignore?.overrides?.find(
      (override) =>
        override.files?.includes("src/constants/validation-limits.ts"),
    );

    expect(validationDuplicateOverride?.rules).toEqual(["knip/duplicates"]);
    expect(validationLimits).toContain(
      "export const MAX_LEAD_PRODUCT_NAME_LENGTH = MAX_LEAD_COMPANY_LENGTH",
    );
    expect(timeConstants).toContain("const SIX_HUNDRED_MS = 600");
    expect(timeConstants).not.toContain("export const SIX_HUNDRED_MS");
  });

  it("keeps public authoring surfaces out of the unused export/type queue after review", () => {
    const config = JSON.parse(readRepoFile("react-doctor.config.json")) as {
      ignore?: {
        overrides?: Array<{ files?: string[]; rules?: string[] }>;
      };
    };

    const publicExportOverride = config.ignore?.overrides?.find((override) =>
      override.files?.includes("src/config/single-site.ts"),
    );
    const publicTypeOverride = config.ignore?.overrides?.find((override) =>
      override.files?.includes("src/config/site-types.ts"),
    );

    expect(publicExportOverride?.rules).toEqual(["knip/exports"]);
    expect(publicExportOverride?.files).toEqual([
      "src/config/single-site.ts",
      "src/config/paths.ts",
      "src/i18n/routing.ts",
      "src/lib/env.ts",
      "src/components/ui/button.tsx",
      "src/components/ui/badge.tsx",
      "src/lib/contact/submit-canonical-contact.ts",
      "src/lib/structured-data.ts",
      "src/lib/cookie-consent/index.ts",
    ]);
    expect(publicTypeOverride?.rules).toEqual(["knip/types"]);
    expect(publicTypeOverride?.files).toEqual([
      "src/config/single-site.ts",
      "src/config/paths.ts",
      "src/config/site-types.ts",
      "src/lib/contact/submit-canonical-contact.ts",
      "src/lib/cookie-consent/types.ts",
      "src/lib/cookie-consent/index.ts",
      "src/test/test-types.ts",
      "src/types/content.types.ts",
      "src/types/i18n.ts",
    ]);
  });
});
