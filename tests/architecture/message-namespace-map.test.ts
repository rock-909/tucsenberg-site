import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { STARTER_PROFILES } from "@/config/starter-profiles";
import type { MessagePackId } from "@/lib/i18n/message-pack-config";
import profileMessagePacks from "@messages/message-packs.json";

const MESSAGE_MAP_DOC = "docs/ref/messages.md";
const RETIRED_REACT_SCAN_DEMO_NAMESPACE = ["React", "ScanDemo"].join("");

const SHOWCASE_FULL_EN_PACKS = (
  profileMessagePacks["showcase-full"] as readonly MessagePackId[]
).map((packId) =>
  packId === "base" ? "messages/base/en" : `messages/profiles/${packId}/en`,
);

function expectProfileNamespaces(
  profileId: keyof typeof STARTER_PROFILES,
  expectedNamespaces: readonly string[],
): void {
  const namespaces = new Set(STARTER_PROFILES[profileId].messageNamespaces);

  for (const namespace of expectedNamespaces) {
    expect(
      namespaces.has(namespace),
      `${profileId} should own ${namespace}`,
    ).toBe(true);
  }
}

function expectProfileNotToOwnNamespaces(
  profileId: keyof typeof STARTER_PROFILES,
  unexpectedNamespaces: readonly string[],
): void {
  const namespaces = new Set(STARTER_PROFILES[profileId].messageNamespaces);

  for (const namespace of unexpectedNamespaces) {
    expect(
      namespaces.has(namespace),
      `${profileId} should not own ${namespace}`,
    ).toBe(false);
  }
}

function mergeTopLevelNamespaces(
  packPaths: readonly string[],
  type: "critical" | "deferred",
): Record<string, unknown> {
  return packPaths.reduce<Record<string, unknown>>((merged, packPath) => {
    const packMessages = JSON.parse(
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- test composes fixed showcase-full pack paths
      readFileSync(`${packPath}/${type}.json`, "utf8"),
    ) as Record<string, unknown>;

    return { ...merged, ...packMessages };
  }, {});
}

describe("message namespace map", () => {
  it("documents every current top-level message namespace", () => {
    const doc = readFileSync(MESSAGE_MAP_DOC, "utf8");
    const criticalMessages = mergeTopLevelNamespaces(
      SHOWCASE_FULL_EN_PACKS,
      "critical",
    );
    const deferredMessages = mergeTopLevelNamespaces(
      SHOWCASE_FULL_EN_PACKS,
      "deferred",
    );
    const criticalNamespaces = Object.keys(criticalMessages);
    const deferredNamespaces = Object.keys(deferredMessages);

    for (const expected of [
      "messages/base",
      "messages/profiles/b2b-lead",
      "messages/profiles/catalog",
      "messages/profiles/content-marketing",
      "messages/profiles/company-site",
      "messages/profiles/showcase-full",
      "Physical message packs are the authoring truth",
    ]) {
      expect(doc).toContain(expected);
    }

    for (const namespace of [...criticalNamespaces, ...deferredNamespaces]) {
      expect(doc).toContain(`\`${namespace}\``);
    }
  });

  it("keeps adopter-facing categories and proof command visible", () => {
    const doc = readFileSync(MESSAGE_MAP_DOC, "utf8");
    const replacementIndex = readFileSync("docs/ref/surfaces.md", "utf8");

    expect(doc).toContain("must replace");
    expect(doc).toContain("must review");
    expect(doc).toContain("do not edit first");
    expect(doc).toContain("node scripts/starter-checks.js translations");
    expect(doc).toContain("pnpm content:check");
    expect(replacementIndex).toContain("messages/base/**");
    expect(replacementIndex).toContain("messages/profiles/**");
  });

  it("records profile ownership for demo-heavy message namespaces", () => {
    const doc = readFileSync(MESSAGE_MAP_DOC, "utf8");

    for (const expected of [
      "Default company-site owns only the light products overview",
      "Namespace exceptions live in `src/config/starter-profiles.ts`",
      "Readiness pointer exclusions live in `scripts/quality/checks/content-readiness.js`",
      "`catalog` | default company-site reviews overview only; market/spec/detail is optional catalog",
      "`blog` / `article` | default company-site reviews starter articles and labels",
      "`customProject` | showcase-full or explicit custom-project only",
      "`themeDemo` | examples-only",
      "Default `company-site` uses",
    ]) {
      expect(doc).toContain(expected);
    }

    expect(doc).not.toContain(RETIRED_REACT_SCAN_DEMO_NAMESPACE);
  });

  it("keeps documented profile namespace ownership aligned with starter profiles", () => {
    const doc = readFileSync(MESSAGE_MAP_DOC, "utf8");

    expectProfileNamespaces("company-site", [
      "catalog",
      "blog",
      "article",
      "resources",
    ]);
    expectProfileNotToOwnNamespaces("company-site", [
      "customProject",
      "themeDemo",
    ]);
    expect(doc).toContain(
      "`catalog` | default company-site reviews overview only; market/spec/detail is optional catalog",
    );
    expect(doc).toContain(
      "`blog` / `article` | default company-site reviews starter articles and labels",
    );
    expect(doc).toContain(
      "`resources` | default company-site must replace resource cards/CTA",
    );

    expectProfileNamespaces("catalog", ["catalog", "products"]);
    expectProfileNotToOwnNamespaces("catalog", [
      "blog",
      "article",
      "resources",
      "customProject",
      "themeDemo",
    ]);

    expectProfileNamespaces("content-marketing", ["blog", "article"]);
    expectProfileNotToOwnNamespaces("content-marketing", [
      "catalog",
      "products",
      "resources",
      "customProject",
      "themeDemo",
    ]);

    expectProfileNamespaces("showcase-full", ["customProject"]);
    expect(doc).toContain(
      "`customProject` | showcase-full or explicit custom-project only",
    );

    for (const profile of Object.values(STARTER_PROFILES)) {
      expect(profile.messageNamespaces).not.toContain("themeDemo");
    }
    expect(doc).toContain("`themeDemo` | examples-only");
  });

  it("does not keep the retired React Scan demo namespace in active starter contracts", () => {
    const activeContractFiles = [
      "src/config/starter-profiles.ts",
      "messages/message-packs.json",
      "docs/ref/messages.md",
    ];

    for (const file of activeContractFiles) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads a fixed active contract allowlist
      const content = readFileSync(file, "utf8");
      expect(content, file).not.toContain(RETIRED_REACT_SCAN_DEMO_NAMESPACE);
    }
  });

  it("qualifies demo-heavy namespaces by profile ownership in detail tables", () => {
    const doc = readFileSync(MESSAGE_MAP_DOC, "utf8");

    expect(doc).toContain("message packs are the authoring truth");
    expect(doc).not.toMatch(/\| `catalog` \| `must-replace`/);
    expect(doc).not.toMatch(/\| `products` \| `must-replace`/);
    expect(doc).not.toMatch(/\| `customProject` \| `must-replace`/);
    expect(doc).toContain("optional catalog");
    expect(doc).toContain("showcase-full");
  });
});
