import { beforeEach, describe, expect, it } from "vitest";
import {
  evaluatePerformance,
  I18nPerformanceMonitor,
} from "@/lib/i18n/performance";

describe("i18n-performance", () => {
  beforeEach(() => {
    I18nPerformanceMonitor.reset();
  });

  it("records load times and request counters", () => {
    I18nPerformanceMonitor.recordLoadTime(40);
    I18nPerformanceMonitor.recordLoadTime(60);
    I18nPerformanceMonitor.recordCacheHit();
    I18nPerformanceMonitor.recordCacheMiss();

    expect(I18nPerformanceMonitor.getMetrics()).toEqual({
      averageLoadTime: 50,
      cacheHitRate: 50,
      totalErrors: 0,
      totalRequests: 2,
    });
  });

  it("tracks errors separately from request counters", () => {
    I18nPerformanceMonitor.recordError();
    I18nPerformanceMonitor.recordError();

    expect(I18nPerformanceMonitor.getMetrics()).toEqual({
      averageLoadTime: 0,
      cacheHitRate: 0,
      totalErrors: 2,
      totalRequests: 0,
    });
  });

  it("reset clears accumulated metrics", () => {
    I18nPerformanceMonitor.recordLoadTime(80);
    I18nPerformanceMonitor.recordCacheHit();
    I18nPerformanceMonitor.recordError();

    I18nPerformanceMonitor.reset();

    expect(I18nPerformanceMonitor.getMetrics()).toEqual({
      averageLoadTime: 0,
      cacheHitRate: 0,
      totalErrors: 0,
      totalRequests: 0,
    });
  });

  it("evaluates healthy metrics with a high grade", () => {
    const evaluation = evaluatePerformance({
      averageLoadTime: 40,
      cacheHitRate: 98,
      totalErrors: 0,
      totalRequests: 10,
    });

    expect(evaluation.grade).toBe("A");
    expect(evaluation.overallScore).toBeGreaterThanOrEqual(95);
  });

  it("penalizes poor metrics and high error rates", () => {
    const evaluation = evaluatePerformance({
      averageLoadTime: 600,
      cacheHitRate: 50,
      totalErrors: 5,
      totalRequests: 10,
    });

    expect(evaluation.grade).toBe("F");
    expect(evaluation.overallScore).toBeLessThan(60);
  });
});
