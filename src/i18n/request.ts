import { getRequestConfig } from "next-intl/server";
import { loadCompleteMessages } from "@/lib/i18n/load-messages";
import {
  getLocaleCurrency,
  getLocaleTimeZone,
} from "@/config/paths/locales-config";
import { coerceLocale } from "@/i18n/locale-utils";
import type { Locale } from "@/i18n/routing-config";

// 辅助函数：获取格式配置
function getFormats(locale: Locale) {
  return {
    dateTime: {
      short: {
        day: "numeric" as const,
        month: "short" as const,
        year: "numeric" as const,
      },
      long: {
        day: "numeric" as const,
        month: "long" as const,
        year: "numeric" as const,
        weekday: "long" as const,
      },
    },
    number: {
      precise: {
        maximumFractionDigits: 5,
      },
      currency: {
        style: "currency" as const,
        currency: getLocaleCurrency(locale),
      },
      percentage: {
        style: "percent" as const,
        minimumFractionDigits: 1,
      },
    },
    list: {
      enumeration: {
        style: "long" as const,
        type: "conjunction" as const,
      },
    },
  };
}

// 辅助函数：创建成功响应
interface SuccessResponseArgs {
  locale: Locale;
  messages: Record<string, unknown>;
  loadTime: number;
}

function createSuccessResponse({
  locale,
  messages,
  loadTime,
}: SuccessResponseArgs) {
  return {
    locale,
    messages,
    timeZone: getLocaleTimeZone(locale),
    formats: getFormats(locale),
    strictMessageTypeSafety: true,
    metadata: {
      loadTime,
    },
  };
}

// 辅助函数：创建同 locale 重试响应
async function createSameLocaleRetryResponse(
  locale: Locale,
  startTime: number,
) {
  return {
    locale,
    messages: await loadCompleteMessages(locale),
    timeZone: getLocaleTimeZone(locale),
    formats: getFormats(locale),
    strictMessageTypeSafety: true,
    metadata: {
      loadTime: performance.now() - startTime,
      error: true,
      recovery: "same-locale-retry" as const,
    },
  };
}

export default getRequestConfig(async ({ requestLocale }) => {
  const startTime = performance.now();
  const locale = coerceLocale(await requestLocale);

  try {
    const messages = await loadCompleteMessages(locale);
    const loadTime = performance.now() - startTime;

    return createSuccessResponse({
      locale,
      messages,
      loadTime,
    });
  } catch {
    return createSameLocaleRetryResponse(locale, startTime);
  }
});
