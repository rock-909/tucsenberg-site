import { describe, expect, it } from "vitest";
import {
  CACHE_DOMAINS,
  CACHE_ENTITIES,
  i18nTags,
} from "@/lib/cache/cache-tags";

describe("cache tags", () => {
  it("keeps only the i18n cache tag domain in production cache tag utilities", () => {
    expect(CACHE_DOMAINS).toEqual({ I18N: "i18n" });
    expect(CACHE_ENTITIES).toEqual({
      I18N: {
        CRITICAL: "critical",
        DEFERRED: "deferred",
        ALL: "all",
      },
    });
  });

  it("builds stable i18n cache tags", () => {
    expect(i18nTags.critical("en")).toBe("i18n:critical:en");
    expect(i18nTags.deferred("zh")).toBe("i18n:deferred:zh");
    expect(i18nTags.all()).toBe("i18n:all");
    expect(i18nTags.forLocale("en")).toEqual([
      "i18n:critical:en",
      "i18n:deferred:en",
      "i18n:all",
    ]);
  });

  it("builds locale tag groups when forLocale is called without object context", () => {
    const { forLocale } = i18nTags;

    expect(forLocale("en")).toEqual([
      "i18n:critical:en",
      "i18n:deferred:en",
      "i18n:all",
    ]);
  });
});
