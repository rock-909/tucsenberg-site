import {
  ANIMATION_DURATION_SLOW,
  COUNT_FIVE,
  COUNT_TWO,
  COUNT_TEN,
  COUNT_THREE,
  HTTP_OK,
  ONE,
  PERCENTAGE_FULL,
  PERCENTAGE_HALF,
  ZERO,
} from "@/constants";
import {
  CACHE_LIMITS,
  PERFORMANCE_THRESHOLDS,
} from "@/constants/i18n-constants";

// 性能监控
export class I18nPerformanceMonitor {
  private static metrics = {
    loadTime: [] as number[],
    cacheHits: ZERO,
    cacheMisses: ZERO,
    errors: ZERO,
  };

  static recordLoadTime(time: number): void {
    this.metrics.loadTime.push(time);
    // 保持最近记录数量限制
    if (this.metrics.loadTime.length > CACHE_LIMITS.MAX_CACHE_ENTRIES) {
      this.metrics.loadTime.shift();
    }
  }

  static recordCacheHit(): void {
    this.metrics.cacheHits += ONE;
  }

  static recordCacheMiss(): void {
    this.metrics.cacheMisses += ONE;
  }

  static recordError(): void {
    this.metrics.errors += ONE;
  }

  static getMetrics() {
    const loadTimes = this.metrics.loadTime;
    const avgLoadTime =
      loadTimes.length > ZERO
        ? loadTimes.reduce((a, b) => a + b, ZERO) / loadTimes.length
        : ZERO;

    const totalRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate =
      totalRequests > ZERO
        ? ((this.metrics.cacheHits / totalRequests) *
            PERFORMANCE_THRESHOLDS.MAX_RESPONSE_TIME) /
          COUNT_TEN
        : ZERO;

    return {
      averageLoadTime: avgLoadTime,
      cacheHitRate,
      totalErrors: this.metrics.errors,
      totalRequests,
    };
  }

  static reset(): void {
    this.metrics = {
      loadTime: [],
      cacheHits: ZERO,
      cacheMisses: ZERO,
      errors: ZERO,
    };
  }
}

// 性能基准目标
const PERFORMANCE_TARGETS = {
  TRANSLATION_LOAD_TIME: {
    excellent: PERCENTAGE_HALF, // < 50ms
    good: PERCENTAGE_FULL, // < 100ms
    acceptable: HTTP_OK, // < 200ms
    poor: ANIMATION_DURATION_SLOW, // > 500ms
  },

  CACHE_HIT_RATE: {
    excellent: PERFORMANCE_THRESHOLDS.EXCELLENT + COUNT_THREE, // > 98%
    good: PERFORMANCE_THRESHOLDS.EXCELLENT, // > 95%
    acceptable: PERFORMANCE_THRESHOLDS.GOOD + COUNT_TEN, // > 90%
    poor: PERFORMANCE_THRESHOLDS.GOOD, // < 80%
  },
};

// 性能评估函数
export function evaluatePerformance(
  metrics: ReturnType<typeof I18nPerformanceMonitor.getMetrics>,
) {
  const loadTimeScore = getPerformanceScore(
    metrics.averageLoadTime,
    PERFORMANCE_TARGETS.TRANSLATION_LOAD_TIME,
  );

  const cacheScore = getPerformanceScore(
    metrics.cacheHitRate,
    PERFORMANCE_TARGETS.CACHE_HIT_RATE,
    true,
  );

  // 计算错误率惩罚
  const errorRate =
    metrics.totalRequests > 0
      ? (metrics.totalErrors / metrics.totalRequests) * 100
      : 0;

  // 错误率惩罚：每1%错误率减少2分
  const errorPenalty = Math.min(errorRate * 2, 50); // 最大惩罚50分

  let overallScore = (loadTimeScore + cacheScore) / COUNT_TWO;
  overallScore = Math.max(0, overallScore - errorPenalty); // 应用错误率惩罚

  return {
    loadTimeScore,
    cacheScore,
    overallScore,
    grade: getGrade(overallScore),
  };
}

function getPerformanceScore(
  value: number,
  targets: unknown,
  higherIsBetter = false,
): number {
  // 类型守卫：确保targets是一个包含性能阈值的对象
  const safeTargets = targets as {
    excellent: number;
    good: number;
    acceptable: number;
  } | null;
  if (!safeTargets || typeof safeTargets !== "object") {
    return PERFORMANCE_THRESHOLDS.POOR;
  }

  if (higherIsBetter) {
    if (value >= safeTargets.excellent) return CACHE_LIMITS.MAX_CACHE_ENTRIES;
    if (value >= safeTargets.good) return PERFORMANCE_THRESHOLDS.GOOD;
    if (value >= safeTargets.acceptable) return PERFORMANCE_THRESHOLDS.FAIR;
    return PERFORMANCE_THRESHOLDS.POOR;
  }

  if (value <= safeTargets.excellent) return CACHE_LIMITS.MAX_CACHE_ENTRIES;
  if (value <= safeTargets.good) return PERFORMANCE_THRESHOLDS.GOOD;
  if (value <= safeTargets.acceptable) return PERFORMANCE_THRESHOLDS.FAIR;
  return PERFORMANCE_THRESHOLDS.POOR;
}

function getGrade(score: number): string {
  if (score >= PERFORMANCE_THRESHOLDS.EXCELLENT - COUNT_FIVE) return "A";
  if (score >= PERFORMANCE_THRESHOLDS.GOOD) return "B";
  if (score >= PERFORMANCE_THRESHOLDS.GOOD - COUNT_TEN) return "C";
  if (score >= PERFORMANCE_THRESHOLDS.FAIR) return "D";
  return "F";
}
