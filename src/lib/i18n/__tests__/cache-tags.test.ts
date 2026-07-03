import { describe, expect, it } from "vitest";
import {
  I18N_CACHE_ENTITIES,
  I18N_CACHE_NAMESPACE,
  i18nTags,
} from "@/lib/i18n/cache-tags";

describe("i18n cache tags", () => {
  it("keeps i18n cache tag constants in the i18n domain", () => {
    expect(I18N_CACHE_NAMESPACE).toBe("i18n");
    expect(I18N_CACHE_ENTITIES).toEqual({
      CRITICAL: "critical",
      DEFERRED: "deferred",
      ALL: "all",
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
