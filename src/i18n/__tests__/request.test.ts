import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  LOCALES_CONFIG,
  type ConfiguredLocale,
} from "@/config/paths/locales-config";

const EN_LOCALE = "en" satisfies ConfiguredLocale;

interface RequestConfigResult {
  locale: ConfiguredLocale;
  timeZone: string;
  formats: {
    number: {
      currency: {
        currency: string;
      };
    };
  };
  strictMessageTypeSafety: boolean;
  messages: unknown;
  metadata: {
    loadTime?: number;
    error?: boolean;
    recovery?: "uncached-retry";
    cacheUsed?: boolean;
    timestamp?: string;
    smartDetection?: boolean;
  };
}

const { mockGetRequestConfig, mockI18nPerformanceMonitor } = vi.hoisted(() => ({
  mockGetRequestConfig: vi.fn(),
  mockI18nPerformanceMonitor: {
    recordLoadTime: vi.fn(),
    recordError: vi.fn(),
  },
}));

vi.mock("next-intl/server", () => ({
  getRequestConfig: mockGetRequestConfig,
}));

vi.mock("@/lib/i18n/performance", () => ({
  I18nPerformanceMonitor: mockI18nPerformanceMonitor,
}));

describe("i18n Request Configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  async function runConfig(
    requestLocale: string | null,
  ): Promise<RequestConfigResult> {
    let captured:
      | ((args: { requestLocale: Promise<string | null> }) => Promise<unknown>)
      | undefined;

    mockGetRequestConfig.mockImplementation((fn) => {
      captured = fn;
      return fn;
    });

    await import("../request");

    if (!captured) {
      throw new Error("getRequestConfig callback was not captured");
    }

    return (await captured({
      requestLocale: Promise.resolve(requestLocale),
    })) as RequestConfigResult;
  }

  it("registers a getRequestConfig callback", async () => {
    await import("../request");
    expect(mockGetRequestConfig).toHaveBeenCalledWith(expect.any(Function));
  });

  it("returns english request config", async () => {
    const result = await runConfig(EN_LOCALE);

    expect(result.locale).toBe(EN_LOCALE);
    expect(result.timeZone).toBe("UTC");
    expect(result.formats.number.currency.currency).toBe("USD");
    expect(result.strictMessageTypeSafety).toBe(true);
    expect(result.messages).toBeDefined();
    expect(result.metadata.error).toBeUndefined();
  });

  it("falls back to default locale when requestLocale is invalid", async () => {
    const result = await runConfig("invalid");

    expect(result.locale).toBe(LOCALES_CONFIG.defaultLocale);
  });

  it("falls back to default locale when requestLocale is null", async () => {
    const result = await runConfig(null);

    expect(result.locale).toBe(LOCALES_CONFIG.defaultLocale);
  });

  it("records request load time", async () => {
    const performanceNowSpy = vi
      .spyOn(globalThis.performance, "now")
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(150);

    await runConfig(LOCALES_CONFIG.defaultLocale);

    expect(mockI18nPerformanceMonitor.recordLoadTime).toHaveBeenCalledWith(50);

    performanceNowSpy.mockRestore();
  });

  it("returns metadata with loadTime only on success", async () => {
    const performanceNowSpy = vi
      .spyOn(globalThis.performance, "now")
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(200);

    const result = await runConfig(LOCALES_CONFIG.defaultLocale);

    expect(result.metadata.loadTime).toBe(100);
    expect(result.metadata).not.toHaveProperty("cacheUsed");
    expect(result.metadata).not.toHaveProperty("timestamp");
    expect(result.metadata).not.toHaveProperty("smartDetection");

    performanceNowSpy.mockRestore();
  });

  it("marks cached-load recovery as an uncached source retry", async () => {
    vi.doMock("@/lib/i18n/load-messages", () => ({
      loadCompleteMessages: vi.fn().mockRejectedValue(new Error("load failed")),
      loadCompleteMessagesFromSource: vi.fn().mockResolvedValue({
        common: { loading: "Loading..." },
      }),
    }));

    const result = await runConfig(LOCALES_CONFIG.defaultLocale);

    expect(mockI18nPerformanceMonitor.recordError).toHaveBeenCalled();
    expect(result.locale).toBe(LOCALES_CONFIG.defaultLocale);
    expect(result.metadata.error).toBe(true);
    expect(result.metadata.recovery).toBe("uncached-retry");
    expect(result.metadata).not.toHaveProperty("cacheUsed");
  });

  it("does not hide failure when the uncached source retry also fails", async () => {
    vi.doMock("@/lib/i18n/load-messages", () => ({
      loadCompleteMessages: vi.fn().mockRejectedValue(new Error("load failed")),
      loadCompleteMessagesFromSource: vi
        .fn()
        .mockRejectedValue(new Error("source failed")),
    }));

    await expect(runConfig(LOCALES_CONFIG.defaultLocale)).rejects.toThrow(
      "source failed",
    );
    expect(mockI18nPerformanceMonitor.recordError).toHaveBeenCalled();
  });
});
