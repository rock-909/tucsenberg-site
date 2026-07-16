import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { collectMessageKeyUsageFindings } from "../../../scripts/quality/checks/message-key-usage.js";
import { UNUSED_MESSAGE_KEYS } from "../../../scripts/quality/message-key-usage-baseline.js";

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
  derivedKeyConsumers = [],
  objectKeyConsumers = [],
  unusedKeyAllowlist = [],
}: {
  catalogKeys: string[];
  content?: string;
  dynamicPrefixAllowlist?: Array<{ prefix: string; reason: string }>;
  derivedKeyConsumers?: Array<Record<string, unknown>>;
  objectKeyConsumers?: Array<{
    file: string;
    objectName: string;
    prefix: string;
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
    derivedKeyConsumers,
    objectKeyConsumers,
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
  it("baselines the known runtime default locale email residue exactly", () => {
    const key = ["emailTemplates", "runtimeDefaultLocale"].join(".");
    expect(UNUSED_MESSAGE_KEYS).toContain(key);
  });

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

  it("does not count a matching bare string as a message consumer", () => {
    expect(
      collect({
        catalogKeys: ["example.dead"],
        content: 'export const fixture = "example.dead";',
      }),
    ).toContainEqual({
      file: "messages",
      error:
        'message key has no detected consumer and is not baselined "example.dead"',
    });
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
        catalogKeys: ["example.items.one", "example.items.deadSibling"],
        content,
        dynamicPrefixAllowlist: [
          { prefix: "example.items.", reason: "fixture" },
        ],
        unusedKeyAllowlist: ["example.items.one"],
      }),
    ).toContainEqual({
      file: "messages",
      error:
        'message key has no detected consumer and is not baselined "example.items.deadSibling"',
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

  it("filters configured collection values with runtime entry rules", () => {
    expect(
      collect({
        catalogKeys: ["form.active", "form.disabled", "form.activePlaceholder"],
        content: [
          "const FIELDS = {",
          '  active: { enabled: true, type: "text", i18nKey: "active" },',
          '  disabled: { enabled: false, type: "tel", i18nKey: "disabled" },',
          "};",
          'const PLACEHOLDERS = { active: "activePlaceholder", disabled: "disabledPlaceholder" };',
        ].join("\n"),
        derivedKeyConsumers: [
          {
            kind: "collection-values",
            file: "src/example.ts",
            sourceName: "FIELDS",
            valueProperty: "i18nKey",
            entryFilters: [{ property: "enabled", equals: true }],
            prefix: "form.",
            suffixes: [""],
            reason: "fixture",
          },
          {
            kind: "collection-values",
            file: "src/example.ts",
            sourceName: "PLACEHOLDERS",
            entryKeySource: {
              sourceName: "FIELDS",
              filters: [{ property: "enabled", equals: true }],
            },
            prefix: "form.",
            suffixes: [""],
            reason: "fixture",
          },
        ],
        unusedKeyAllowlist: ["form.disabled"],
      }),
    ).toEqual([]);
  });

  it("derives the runtime string values of finite error domains", () => {
    expect(
      collect({
        catalogKeys: ["apiErrors.RENAMED_AT_RUNTIME"],
        content: 'const CODES = ["RENAMED_AT_RUNTIME"] as const;',
        derivedKeyConsumers: [
          {
            kind: "collection-values",
            file: "src/example.ts",
            sourceName: "CODES",
            prefix: "apiErrors.",
            suffixes: [""],
            reason: "fixture",
          },
        ],
      }),
    ).toEqual([]);

    expect(
      collect({
        catalogKeys: ["apiErrors.FAILED"],
        content: 'const CODES = ["RENAMED_AT_RUNTIME"] as const;',
        derivedKeyConsumers: [
          {
            kind: "collection-values",
            file: "src/example.ts",
            sourceName: "CODES",
            prefix: "apiErrors.",
            suffixes: [""],
            reason: "fixture",
          },
        ],
        unusedKeyAllowlist: ["apiErrors.FAILED"],
      }),
    ).toContainEqual({
      file: "message usage",
      error:
        'used message key is missing from the catalog "apiErrors.RENAMED_AT_RUNTIME"',
    });
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

  it("derives only exact collection keys and detects missing required leaves", () => {
    const consumer = {
      kind: "collection-values",
      file: "src/example.ts",
      sourceName: "ITEM_KEYS",
      prefix: "example.items.",
      suffixes: [".title"],
      reason: "fixture",
    };
    expect(
      collect({
        catalogKeys: ["example.items.one.title", "example.items.dead.title"],
        content: 'const ITEM_KEYS = ["one"] as const;',
        derivedKeyConsumers: [consumer],
        unusedKeyAllowlist: ["example.items.dead.title"],
      }),
    ).toEqual([]);

    expect(
      collect({
        catalogKeys: [],
        content: 'const ITEM_KEYS = ["one"] as const;',
        derivedKeyConsumers: [consumer],
      }),
    ).toContainEqual({
      file: "message usage",
      error:
        'used message key is missing from the catalog "example.items.one.title"',
    });
  });

  it("does not let a property-access root hide an unaccessed sibling", () => {
    expect(
      collect({
        catalogKeys: ["example.used", "example.deadSibling"],
        content:
          "const copy = messages.example; export const value = copy.used;",
        derivedKeyConsumers: [
          {
            kind: "property-accesses",
            file: "src/example.ts",
            rootName: "copy",
            prefix: "example.",
            reason: "fixture",
          },
        ],
        unusedKeyAllowlist: ["example.deadSibling"],
      }),
    ).toEqual([]);
  });

  it("rejects stale derived consumers when their declaration disappears", () => {
    expect(
      collect({
        catalogKeys: [],
        derivedKeyConsumers: [
          {
            kind: "collection-values",
            file: "src/example.ts",
            sourceName: "REMOVED_KEYS",
            prefix: "example.",
            suffixes: [""],
            reason: "fixture",
          },
        ],
      }),
    ).toContainEqual({
      file: "scripts/quality/message-key-usage-baseline.js",
      error:
        'derived message key consumer is stale "src/example.ts#collection-values"',
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
