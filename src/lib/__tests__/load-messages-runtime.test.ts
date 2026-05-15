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
  return {
    env: {},
    isRuntimeCi: () => ci,
    isRuntimeDevelopment: () => development,
    isRuntimePlaywright: () => playwright,
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
  article: {
    defaultAuthor: string;
  };
}

interface FactualCompleteMessages
  extends FactualCriticalMessages, FactualDeferredMessages {}

const factualPlaceholderPattern =
  /\{(?:siteName|companyName|currentYear|copyright)\}/u;

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
  expectStringPath(value, ["article", "defaultAuthor"]);
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
    expect(unstableCache.mock.calls[0]?.[2]).toMatchObject({
      tags: ["i18n:critical:en", "i18n:all"],
    });
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
    expect(unstableCache.mock.calls[0]?.[2]).toMatchObject({
      tags: ["i18n:deferred:zh", "i18n:all"],
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
    const expectedZhCopyright = `(c) ${currentYear} ${SINGLE_SITE_FACTS.company.name}。保留所有权利。`;

    const [enMessages, esMessages, zhMessages] = await Promise.all([
      loadCriticalMessages("en"),
      loadCriticalMessages("es"),
      loadCriticalMessages("zh"),
    ]);
    assertFactualCriticalMessages(enMessages);
    assertFactualCriticalMessages(esMessages);
    assertFactualCriticalMessages(zhMessages);

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

    expect(esMessages.navigation.siteName).toBe(
      `[ES-TODO] ${SINGLE_SITE_CONFIG.name}`,
    );
    expect(esMessages.footer.copyright).toBe(
      `[ES-TODO] ${expectedEnCopyright}`,
    );
    expect(esMessages.footer.copyright).not.toContain(
      "Todos los derechos reservados",
    );
    expect(esMessages["structured-data"].organization.name).toBe(
      `[ES-TODO] ${SINGLE_SITE_FACTS.company.name}`,
    );
    expect(esMessages["structured-data"].website.name).toBe(
      `[ES-TODO] ${SINGLE_SITE_CONFIG.name}`,
    );
    expect(esMessages["structured-data"].article.defaultAuthor).toBe(
      `[ES-TODO] ${SINGLE_SITE_FACTS.company.name}`,
    );

    expect(zhMessages.navigation.siteName).toBe(SINGLE_SITE_CONFIG.name);
    expect(zhMessages.footer.copyright).toBe(expectedZhCopyright);
    expect(JSON.stringify(enMessages)).not.toMatch(factualPlaceholderPattern);
    expect(JSON.stringify(esMessages)).not.toMatch(factualPlaceholderPattern);
    expect(JSON.stringify(zhMessages)).not.toMatch(factualPlaceholderPattern);
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
    expect(messages.article.defaultAuthor).toBe(SINGLE_SITE_FACTS.company.name);
    expect(JSON.stringify(messages)).not.toMatch(factualPlaceholderPattern);
  });

  it("keeps factual brand values as placeholders in source JSON", () => {
    const enCritical = readMessageJson(
      "messages/en/critical.json",
    ) as FactualCriticalMessages;
    const zhCritical = readMessageJson(
      "messages/zh/critical.json",
    ) as FactualCriticalMessages;
    const enDeferred = readMessageJson(
      "messages/en/deferred.json",
    ) as FactualDeferredMessages;
    const zhDeferred = readMessageJson(
      "messages/zh/deferred.json",
    ) as FactualDeferredMessages;

    expect(enCritical.navigation.siteName).toBe("{siteName}");
    expect(zhCritical.navigation.siteName).toBe("{siteName}");
    expect(enCritical.footer.copyright).toBe("{copyright}");
    expect(zhCritical.footer.copyright).toBe("{copyright}");

    expect(enCritical["structured-data"].organization.name).toBe(
      "{companyName}",
    );
    expect(zhCritical["structured-data"].organization.name).toBe(
      "{companyName}",
    );
    expect(enCritical["structured-data"].website.name).toBe("{siteName}");
    expect(zhCritical["structured-data"].website.name).toBe("{siteName}");
    expect(enCritical["structured-data"].article.defaultAuthor).toBe(
      "{companyName}",
    );
    expect(zhCritical["structured-data"].article.defaultAuthor).toBe(
      "{companyName}",
    );

    expect(enDeferred.organization.name).toBe("{companyName}");
    expect(zhDeferred.organization.name).toBe("{companyName}");
    expect(enDeferred.website.name).toBe("{siteName}");
    expect(zhDeferred.website.name).toBe("{siteName}");
    expect(enDeferred.article.defaultAuthor).toBe("{companyName}");
    expect(zhDeferred.article.defaultAuthor).toBe("{companyName}");
  });
});
