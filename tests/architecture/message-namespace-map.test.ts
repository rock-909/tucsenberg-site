import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { STARTER_PROFILES } from "@/config/starter-profiles";
import type { MessagePackId } from "@/lib/i18n/message-pack-config";
import profileMessagePacks from "@messages/message-packs.json";

const MESSAGE_MAP_DOC = "docs/项目基础/消息文案.md";
const ACTIVE_PROFILE_ID = "catalog";
const RETIRED_REACT_SCAN_DEMO_NAMESPACE = ["React", "ScanDemo"].join("");

const ACTIVE_EN_PACKS = (
  profileMessagePacks[ACTIVE_PROFILE_ID] as readonly MessagePackId[]
).map((packId) =>
  packId === "base" ? "messages/base/en" : `messages/profiles/${packId}/en`,
);

function mergeTopLevelNamespaces(
  packPaths: readonly string[],
  type: "critical" | "deferred",
): Record<string, unknown> {
  return packPaths.reduce<Record<string, unknown>>((merged, packPath) => {
    const packMessages = JSON.parse(
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- test composes fixed active catalog pack paths
      readFileSync(`${packPath}/${type}.json`, "utf8"),
    ) as Record<string, unknown>;

    return { ...merged, ...packMessages };
  }, {});
}

describe("message namespace map", () => {
  it("documents every current active top-level message namespace", () => {
    const doc = readFileSync(MESSAGE_MAP_DOC, "utf8");
    const criticalMessages = mergeTopLevelNamespaces(
      ACTIVE_EN_PACKS,
      "critical",
    );
    const deferredMessages = mergeTopLevelNamespaces(
      ACTIVE_EN_PACKS,
      "deferred",
    );
    const criticalNamespaces = Object.keys(criticalMessages);
    const deferredNamespaces = Object.keys(deferredMessages);

    for (const expected of [
      "messages/base",
      "messages/profiles/minimal",
      "messages/profiles/b2b-lead",
      "messages/profiles/catalog",
      "Physical message packs are the authoring truth",
      "Active Tucsenberg catalog uses",
    ]) {
      expect(doc).toContain(expected);
    }

    for (const namespace of [...criticalNamespaces, ...deferredNamespaces]) {
      expect(doc).toContain(`\`${namespace}\``);
    }
  });

  it("keeps adopter-facing categories and proof command visible", () => {
    const doc = readFileSync(MESSAGE_MAP_DOC, "utf8");
    const replacementIndex = readFileSync("docs/项目基础/替换边界.md", "utf8");

    expect(doc).toContain("must replace");
    expect(doc).toContain("must review");
    expect(doc).toContain("do not edit first");
    expect(doc).toContain("node scripts/starter-checks.js translations");
    expect(doc).toContain("pnpm content:check");
    expect(replacementIndex).toContain("messages/base/**");
    expect(replacementIndex).toContain("messages/profiles/**");
  });

  it("records active catalog ownership and retired optional message surfaces", () => {
    const doc = readFileSync(MESSAGE_MAP_DOC, "utf8");
    const catalogNamespaces = new Set(
      STARTER_PROFILES[ACTIVE_PROFILE_ID].messageNamespaces,
    );

    for (const expected of ["catalog", "products", "home", "contact"]) {
      expect(
        catalogNamespaces.has(expected),
        `catalog should own ${expected}`,
      ).toBe(true);
    }

    for (const unexpected of [
      "blog",
      "article",
      "resources",
      "customProject",
    ]) {
      expect(
        catalogNamespaces.has(unexpected),
        `catalog should not own ${unexpected}`,
      ).toBe(false);
    }

    expect(doc).toContain(
      "`catalog` | active product-line, market/spec/detail, and product hub copy",
    );
    expect(doc).toContain(
      "`blog` / `article` | not active in the Tucsenberg catalog materialization",
    );
    expect(doc).toContain(
      "`resources` | not active; buyer guidance moved to guide pages",
    );
    expect(doc).toContain(
      "`customProject` | not active; source-starter showcase-full surface only",
    );
  });

  it("does not keep retired demo namespaces in active starter contracts", () => {
    const activeContractFiles = [
      "src/config/starter-profiles.ts",
      "messages/message-packs.json",
      "docs/项目基础/消息文案.md",
    ];

    for (const file of activeContractFiles) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads a fixed active contract allowlist
      const content = readFileSync(file, "utf8");
      expect(content, file).not.toContain(RETIRED_REACT_SCAN_DEMO_NAMESPACE);
    }
  });

  it("keeps optional source-starter profiles out of the active pack graph", () => {
    const activeProfileIds = Object.keys(profileMessagePacks);

    expect(activeProfileIds).toEqual(["minimal", "b2b-lead", "catalog"]);
    expect(profileMessagePacks[ACTIVE_PROFILE_ID]).toEqual([
      "base",
      "b2b-lead",
      "catalog",
    ]);
    expect(profileMessagePacks).not.toHaveProperty("company-site");
    expect(profileMessagePacks).not.toHaveProperty("showcase-full");
    expect(profileMessagePacks).not.toHaveProperty("content-marketing");
  });
});
