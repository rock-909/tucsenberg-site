import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { collectMessageKeyUsageFindings } from "../../../scripts/quality/checks/message-key-usage.js";

const tempDirs: string[] = [];
const TEMP_TRASH_ROOT = path.join(
  os.tmpdir(),
  "tucsenberg-message-key-usage-test-trash",
);

function createSource(content: string): { rootDir: string; file: string } {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "message-key-usage-"));
  const file = "src/example.ts";
  const fullPath = path.join(rootDir, file);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixture path stays inside the test-owned temp directory
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixture path stays inside the test-owned temp directory
  fs.writeFileSync(fullPath, content);
  tempDirs.push(rootDir);
  return { rootDir, file };
}

function moveTempDirToTrash(dir: string): void {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- cleanup only inspects a test-owned temp directory
  if (!fs.existsSync(dir)) return;
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- cleanup moves fixtures to a recoverable temp trash directory
  fs.mkdirSync(TEMP_TRASH_ROOT, { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- cleanup moves fixtures to a recoverable temp trash directory
  fs.renameSync(
    dir,
    path.join(TEMP_TRASH_ROOT, `${path.basename(dir)}-${Date.now()}`),
  );
}

function collect({
  catalogKeys,
  content = "export {};",
  dynamicPrefixAllowlist = [],
  objectKeyConsumers = [],
  subtreeConsumers = [],
  unusedKeyAllowlist = [],
}: {
  catalogKeys: string[];
  content?: string;
  dynamicPrefixAllowlist?: Array<{ prefix: string; reason: string }>;
  objectKeyConsumers?: Array<{
    file: string;
    objectName: string;
    prefix: string;
    reason: string;
  }>;
  subtreeConsumers?: Array<{
    file: string;
    prefix: string;
    anchor: string;
    reason: string;
  }>;
  unusedKeyAllowlist?: string[];
}) {
  const { rootDir, file } = createSource(content);
  return collectMessageKeyUsageFindings({
    rootDir,
    catalogKeys: new Set(catalogKeys),
    sourceFiles: [file],
    dynamicPrefixAllowlist,
    objectKeyConsumers,
    subtreeConsumers,
    translatorBindingOverrides: [],
    translatorParameterOverrides: [],
    unusedKeyAllowlist,
  });
}

afterEach(() => {
  for (const tempDir of tempDirs.splice(0)) {
    moveTempDirToTrash(tempDir);
  }
});

describe("message key usage gate", () => {
  it("accepts a statically consumed catalog key", () => {
    expect(
      collect({
        catalogKeys: ["example.used"],
        content:
          'const t = useTranslations("example");\nexport const value = t("used");',
      }),
    ).toEqual([]);
  });

  it("rejects a used key that is missing from the catalog", () => {
    expect(
      collect({
        catalogKeys: ["other.missing"],
        content:
          'const t = useTranslations("example");\nexport const value = t("missing");',
      }),
    ).toContainEqual({
      file: "message usage",
      error: 'used message key is missing from the catalog "example.missing"',
    });
  });

  it("rejects an unused key unless its exact leaf is baselined", () => {
    expect(collect({ catalogKeys: ["example.dead"] })).toEqual([
      {
        file: "messages",
        error:
          'message key has no detected consumer and is not baselined "example.dead"',
      },
    ]);
    expect(
      collect({
        catalogKeys: ["example.dead"],
        unusedKeyAllowlist: ["example.dead"],
      }),
    ).toEqual([]);
  });

  it("rejects stale unused baselines after deletion or new consumption", () => {
    expect(
      collect({
        catalogKeys: [],
        unusedKeyAllowlist: ["example.deleted"],
      }),
    ).toContainEqual({
      file: "scripts/quality/message-key-usage-baseline.js",
      error:
        'unused message key baseline is stale because the key is absent "example.deleted"',
    });

    expect(
      collect({
        catalogKeys: ["example.used"],
        content:
          'const t = useTranslations("example");\nexport const value = t("used");',
        unusedKeyAllowlist: ["example.used"],
      }),
    ).toContainEqual({
      file: "scripts/quality/message-key-usage-baseline.js",
      error:
        'unused message key baseline is stale because the key is now consumed "example.used"',
    });
  });

  it("requires dynamic prefixes to be registered and rejects stale entries", () => {
    const content =
      'const t = useTranslations("example");\nexport const value = (key: string) => t(`items.${key}`);';
    expect(
      collect({ catalogKeys: ["example.items.one"], content }),
    ).toContainEqual({
      file: "scripts/quality/message-key-usage-baseline.js",
      error: 'dynamic message key prefix is not allowlisted "example.items."',
    });

    expect(
      collect({
        catalogKeys: ["example.other"],
        dynamicPrefixAllowlist: [
          { prefix: "example.items.", reason: "fixture" },
        ],
      }),
    ).toContainEqual({
      file: "scripts/quality/message-key-usage-baseline.js",
      error:
        'dynamic message key prefix matches no catalog key "example.items."',
    });

    expect(
      collect({
        catalogKeys: ["example.items.one"],
        dynamicPrefixAllowlist: [
          { prefix: "example.items.", reason: "fixture" },
        ],
      }),
    ).toContainEqual({
      file: "scripts/quality/message-key-usage-baseline.js",
      error:
        'dynamic message key prefix is stale because no consumer emits it "example.items."',
    });
  });

  it("derives exact keys from configured copy objects", () => {
    expect(
      collect({
        catalogKeys: ["example.title", "example.unused"],
        content:
          'const COPY = { title: "Title" } satisfies Record<string, string>;',
        objectKeyConsumers: [
          {
            file: "src/example.ts",
            objectName: "COPY",
            prefix: "example.",
            reason: "fixture",
          },
        ],
        unusedKeyAllowlist: ["example.unused"],
      }),
    ).toEqual([]);
  });

  it("rejects stale configured object consumers", () => {
    expect(
      collect({
        catalogKeys: [],
        objectKeyConsumers: [
          {
            file: "src/example.ts",
            objectName: "REMOVED_COPY",
            prefix: "example.",
            reason: "fixture",
          },
        ],
      }),
    ).toContainEqual({
      file: "scripts/quality/message-key-usage-baseline.js",
      error:
        'message object-key consumer is stale "src/example.ts#REMOVED_COPY"',
    });
  });

  it("accepts anchored subtree consumers and rejects stale anchors", () => {
    const consumer = {
      file: "src/example.ts",
      prefix: "example.items.",
      anchor: "consumeItems(messages)",
      reason: "fixture",
    };
    expect(
      collect({
        catalogKeys: ["example.items.one"],
        content: "export const value = consumeItems(messages);",
        subtreeConsumers: [consumer],
      }),
    ).toEqual([]);
    expect(
      collect({
        catalogKeys: ["example.items.one"],
        subtreeConsumers: [consumer],
      }),
    ).toContainEqual({
      file: "scripts/quality/message-key-usage-baseline.js",
      error:
        'message subtree consumer is stale "src/example.ts#example.items."',
    });
  });

  it("follows one-argument translator forwarding helpers", () => {
    expect(
      collect({
        catalogKeys: ["example.used"],
        content: [
          'const t = useTranslations("example");',
          "const translate = (key: string) => t(key as never);",
          'export const value = translate("used");',
        ].join("\n"),
      }),
    ).toEqual([]);
  });

  it("detects translators destructured from Promise.all", () => {
    expect(
      collect({
        catalogKeys: ["example.used"],
        content: [
          "const [t, data] = await Promise.all([",
          '  getTranslations({ namespace: "example" }),',
          "  loadData(),",
          "]);",
          'export const value = t("used");',
        ].join("\n"),
      }),
    ).toEqual([]);
  });

  it("does not confuse a shadowing callback parameter with an outer translator", () => {
    expect(
      collect({
        catalogKeys: ["metadata.title"],
        content: [
          'const t = useTranslations("metadata");',
          "function Aside({ t }: { t: (key: string) => string }) {",
          '  return t("heading");',
          "}",
          'export const title = t("title");',
        ].join("\n"),
      }),
    ).toEqual([]);
  });
});
