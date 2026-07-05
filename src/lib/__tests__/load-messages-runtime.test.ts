import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

interface CacheOptions {
  revalidate?: number | false;
  tags?: string[];
}

type UnstableCacheMock = (
  loader: () => Promise<unknown>,
  keyParts?: string[],
  options?: CacheOptions,
) => () => Promise<unknown>;

function createUnstableCacheMock() {
  return vi.fn<UnstableCacheMock>((loader) => loader);
}

function createRuntimeEnvMock({
  ci = false,
  development = false,
  playwright = false,
  productionBuild = false,
  cloudflare = false,
}: {
  ci?: boolean;
  development?: boolean;
  playwright?: boolean;
  productionBuild?: boolean;
  cloudflare?: boolean;
}) {
  const env = {};

  return {
    env,
    runtimeEnv: env,
    isRuntimeCi: () => ci,
    isRuntimeDevelopment: () => development,
    isRuntimePlaywright: () => playwright,
    isRuntimeProduction: () => false,
    isRuntimeProductionBuildPhase: () => productionBuild,
    isRuntimeCloudflare: () => cloudflare,
  };
}

interface FactualCriticalMessages {
  navigation: {
    siteName: string;
  };
  footer: {
    copyright: string;
  };
  "structured-data": {
    organization: {
      name: string;
    };
    website: {
      name: string;
    };
    article: {
      defaultAuthor: string;
    };
  };
}

interface FactualDeferredMessages {
  organization: {
    name: string;
  };
  website: {
    name: string;
  };
}

interface FactualCompleteMessages
  extends FactualCriticalMessages, FactualDeferredMessages {}

const factualPlaceholderPattern =
  /\{(?:siteName|companyName|currentYear|copyright)\}/u;
const heroPreviewKeys = [
  "productSystem",
  "applicationFit",
  "deliveryProof",
  "inquiryPath",
] as const;
const obsoleteHeroPreviewKeys = [
  "items",
  "pages",
  "components",
  "storybook",
  "workflow",
] as const;
const homeB2BSectionPaths = [
  ["home", "problems", "title"],
  ["home", "problems", "description"],
  ["home", "problems", "items", "structure", "title"],
  ["home", "problems", "items", "content", "title"],
  ["home", "problems", "items", "deployment", "title"],
  ["home", "problems", "items", "inquiry", "title"],
  ["home", "problems", "items", "multilingual", "title"],
  ["home", "answer", "title"],
  ["home", "answer", "description"],
  ["home", "answer", "items", "pageStructure", "title"],
  ["home", "answer", "items", "replacementSurface", "title"],
  ["home", "answer", "items", "inquiryPath", "title"],
  ["home", "answer", "items", "cloudflareFoundation", "title"],
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function getPathValue(value: unknown, path: readonly string[]): unknown {
  let current: unknown = value;

  for (const segment of path) {
    if (!isRecord(current)) {
      return undefined;
    }

    current = current[segment];
  }

  return current;
}

function expectStringPath(value: unknown, path: readonly string[]): void {
  expect(getPathValue(value, path), path.join(".")).toEqual(expect.any(String));
}

function expectRecordPath(
  value: unknown,
  path: readonly string[],
): Record<string, unknown> {
  const record = getPathValue(value, path);

  expect(isRecord(record), path.join(".")).toBe(true);
  if (!isRecord(record)) {
    throw new Error(`${path.join(".")} should be an object`);
  }

  return record;
}

function expectNonEmptyStringPath(
  value: unknown,
  path: readonly string[],
): void {
  const pathValue = getPathValue(value, path);

  expect(pathValue, path.join(".")).toEqual(expect.any(String));
  if (typeof pathValue !== "string") return;
  expect(pathValue.trim().length, path.join(".")).toBeGreaterThan(0);
}

function assertFactualCriticalMessages(
  value: unknown,
): asserts value is FactualCriticalMessages {
  expectStringPath(value, ["navigation", "siteName"]);
  expectStringPath(value, ["footer", "copyright"]);
  expectStringPath(value, ["structured-data", "organization", "name"]);
  expectStringPath(value, ["structured-data", "website", "name"]);
  expectStringPath(value, ["structured-data", "article", "defaultAuthor"]);
}

function assertFactualCompleteMessages(
  value: unknown,
): asserts value is FactualCompleteMessages {
  assertFactualCriticalMessages(value);
  expectStringPath(value, ["organization", "name"]);
  expectStringPath(value, ["website", "name"]);
}

function readMessageJson(relativePath: string): unknown {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads fixed repo message fixtures from explicit call sites
  return JSON.parse(readFileSync(join(process.cwd(), relativePath), "utf8"));
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.doUnmock("@/lib/env");
  vi.doUnmock("next/cache");
});

describe("load-messages runtime gating", () => {
  it("bypasses cache in CI mode", async () => {
    const unstableCache = createUnstableCacheMock();

    vi.doMock("next/cache", () => ({
      unstable_cache: unstableCache,
    }));
    vi.doMock("@/lib/env", () => createRuntimeEnvMock({ ci: true }));

    const { loadCriticalMessages } = await import("@/lib/i18n/load-messages");

    await loadCriticalMessages("en");

    expect(unstableCache).not.toHaveBeenCalled();
  });

  it("bypasses cache during production build phase", async () => {
    const unstableCache = createUnstableCacheMock();

    vi.doMock("next/cache", () => ({
      unstable_cache: unstableCache,
    }));
    vi.doMock("@/lib/env", () => ({
      ...createRuntimeEnvMock({ productionBuild: true }),
    }));

    const { loadDeferredMessages } = await import("@/lib/i18n/load-messages");

    await loadDeferredMessages("zh");

    expect(unstableCache).not.toHaveBeenCalled();
  });

  it("uses cache outside CI and production build", async () => {
    const unstableCache = createUnstableCacheMock();

    vi.doMock("next/cache", () => ({
      unstable_cache: unstableCache,
    }));
    vi.doMock("@/lib/env", () => ({
      ...createRuntimeEnvMock({ development: true }),
    }));

    const { loadCriticalMessages } = await import("@/lib/i18n/load-messages");

    await loadCriticalMessages("en");

    expect(unstableCache).toHaveBeenCalledTimes(1);
    expect(unstableCache.mock.calls[0]?.[1]).toEqual([
      "i18n-critical",
      "en",
      "catalog",
    ]);
    expect(unstableCache.mock.calls[0]?.[2]).toMatchObject({
      tags: ["i18n:critical:en", "i18n:all"],
    });
  });

  it("loads complete source messages without unstable_cache outside CI and Cloudflare", async () => {
    const unstableCache = createUnstableCacheMock();

    vi.doMock("next/cache", () => ({
      unstable_cache: unstableCache,
    }));
    vi.doMock("@/lib/env", () => ({
      ...createRuntimeEnvMock({ development: true }),
    }));

    const { loadCompleteMessagesFromSource } =
      await import("@/lib/i18n/load-messages");

    await loadCompleteMessagesFromSource("en");

    expect(unstableCache).not.toHaveBeenCalled();
  });

  it("passes deferred locale cache tags to unstable_cache", async () => {
    const unstableCache = createUnstableCacheMock();

    vi.doMock("next/cache", () => ({
      unstable_cache: unstableCache,
    }));
    vi.doMock("@/lib/env", () => ({
      ...createRuntimeEnvMock({ development: true }),
    }));

    const { loadDeferredMessages } = await import("@/lib/i18n/load-messages");

    await loadDeferredMessages("zh");

    expect(unstableCache).toHaveBeenCalledTimes(1);
    expect(unstableCache.mock.calls[0]?.[1]).toEqual([
      "i18n-deferred",
      "en",
      "catalog",
    ]);
    expect(unstableCache.mock.calls[0]?.[2]).toMatchObject({
      tags: ["i18n:deferred:en", "i18n:all"],
    });
  });

  it("bypasses unstable_cache on Cloudflare runtime", async () => {
    const unstableCache = createUnstableCacheMock();

    vi.doMock("next/cache", () => ({
      unstable_cache: unstableCache,
    }));
    vi.doMock("@/lib/env", () => ({
      ...createRuntimeEnvMock({ development: true, cloudflare: true }),
    }));

    const { loadCriticalMessages } = await import("@/lib/i18n/load-messages");

    await loadCriticalMessages("en");

    expect(unstableCache).not.toHaveBeenCalled();
  });

  it("returns concrete factual brand values from critical message loading", async () => {
    vi.doMock("next/cache", () => ({
      unstable_cache: createUnstableCacheMock(),
    }));
    vi.doMock("@/lib/env", () => createRuntimeEnvMock({ ci: true }));

    const [
      { loadCriticalMessages },
      { SINGLE_SITE_CONFIG, SINGLE_SITE_FACTS },
    ] = await Promise.all([
      import("@/lib/i18n/load-messages"),
      import("@/config/single-site"),
    ]);
    const currentYear = String(
      SINGLE_SITE_FACTS.company.established +
        SINGLE_SITE_FACTS.company.yearsInBusiness,
    );
    const expectedEnCopyright = `(c) ${currentYear} ${SINGLE_SITE_FACTS.company.name}. All rights reserved.`;
    const enMessages = await loadCriticalMessages("en");
    assertFactualCriticalMessages(enMessages);

    expect(enMessages.navigation.siteName).toBe(SINGLE_SITE_CONFIG.name);
    expect(enMessages.footer.copyright).toBe(expectedEnCopyright);
    expect(enMessages["structured-data"].organization.name).toBe(
      SINGLE_SITE_FACTS.company.name,
    );
    expect(enMessages["structured-data"].website.name).toBe(
      SINGLE_SITE_CONFIG.name,
    );
    expect(enMessages["structured-data"].article.defaultAuthor).toBe(
      SINGLE_SITE_FACTS.company.name,
    );

    expect(JSON.stringify(enMessages)).not.toMatch(factualPlaceholderPattern);
  });

  it("keeps homepage B2B proof copy in complete runtime messages", async () => {
    vi.doMock("next/cache", () => ({
      unstable_cache: createUnstableCacheMock(),
    }));
    vi.doMock("@/lib/env", () => createRuntimeEnvMock({ ci: true }));

    const { loadCompleteMessages } = await import("@/lib/i18n/load-messages");

    const enMessages = await loadCompleteMessages("en");

    expect(getPathValue(enMessages, ["home", "hero", "proofAriaLabel"])).toBe(
      "Tucsenberg quote, warranty and factory-pool facts",
    );

    const enPreview = expectRecordPath(enMessages, ["home", "hero", "preview"]);

    for (const previewKey of heroPreviewKeys) {
      expectNonEmptyStringPath(enMessages, [
        "home",
        "hero",
        "preview",
        previewKey,
      ]);
    }

    for (const obsoleteKey of obsoleteHeroPreviewKeys) {
      expect(obsoleteKey in enPreview).toBe(false);
    }

    for (const path of homeB2BSectionPaths) {
      expectNonEmptyStringPath(enMessages, path);
    }
  });

  it("returns concrete structured-data names from complete source loading", async () => {
    vi.doMock("next/cache", () => ({
      unstable_cache: createUnstableCacheMock(),
    }));
    vi.doMock("@/lib/env", () => createRuntimeEnvMock({ ci: true }));

    const [
      { loadCompleteMessagesFromSource },
      { SINGLE_SITE_CONFIG, SINGLE_SITE_FACTS },
    ] = await Promise.all([
      import("@/lib/i18n/load-messages"),
      import("@/config/single-site"),
    ]);

    const [messages] = await Promise.all([
      loadCompleteMessagesFromSource("en"),
    ]);
    assertFactualCompleteMessages(messages);

    expect(messages["structured-data"].organization.name).toBe(
      SINGLE_SITE_FACTS.company.name,
    );
    expect(messages["structured-data"].website.name).toBe(
      SINGLE_SITE_CONFIG.name,
    );
    expect(messages["structured-data"].article.defaultAuthor).toBe(
      SINGLE_SITE_FACTS.company.name,
    );
    expect(messages.organization.name).toBe(SINGLE_SITE_FACTS.company.name);
    expect(messages.website.name).toBe(SINGLE_SITE_CONFIG.name);
    expect(JSON.stringify(messages)).not.toMatch(factualPlaceholderPattern);
  });

  it("keeps factual brand values as placeholders in source JSON", () => {
    const enCritical = readMessageJson(
      "messages/en/critical.json",
    ) as FactualCriticalMessages;
    const enDeferred = readMessageJson(
      "messages/en/deferred.json",
    ) as FactualDeferredMessages;

    expect(enCritical.navigation.siteName).toBe("{siteName}");
    expect(enCritical.footer.copyright).toBe("{copyright}");

    expect(enCritical["structured-data"].organization.name).toBe(
      "{companyName}",
    );
    expect(enCritical["structured-data"].website.name).toBe("{siteName}");
    expect(enCritical["structured-data"].article.defaultAuthor).toBe(
      "{companyName}",
    );

    expect(enDeferred.organization.name).toBe("{companyName}");
    expect(enDeferred.website.name).toBe("{siteName}");
  });
});
