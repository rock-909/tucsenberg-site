/**
 * 类型安全的国际化类型定义
 * 提供完整的翻译键类型检查和自动补全支持
 */

import type { Locale } from "@/i18n/routing-config";

export type { Locale };

// 基础翻译消息结构
export interface Messages {
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
    edit: string;
    delete: string;
    search: string;
    filter: string;
    sort: string;
    next: string;
    previous: string;
    close: string;
    open: string;
    retry: string;
    back: string;
    refresh: string;
  };
  navigation: {
    home: string;
    about: string;
    contact: string;
    services: string;
    products: string;
    blog: string;
    login: string;
    logout: string;
    profile: string;
    settings: string;
  };
  theme: {
    toggle: string;
    light: string;
    dark: string;
    system: string;
  };
  language: {
    toggle: string;
    english: string;
    chinese: string;
    switching: string;
    switchSuccess: string;
    switchError: string;
    fallbackWarning: string;
  };
  home: {
    title: string;
    subtitle: string;
    description: string;
    getStarted: string;
    learnMore: string;
    features: {
      title: string;
      performance: {
        title: string;
        description: string;
      };
      scalable: {
        title: string;
        description: string;
      };
      secure: {
        title: string;
        description: string;
      };
    };
  };
  themeDemo: {
    title: string;
    description: string;
    chineseTest: string;
    englishTest: string;
    chineseDescription: string;
    englishDescription: string;
    chineseInput: string;
    englishInput: string;
    chinesePlaceholder: string;
    englishPlaceholder: string;
    primaryButton: string;
    secondaryButton: string;
    outlineButton: string;
  };
  instructions: {
    getStarted: string;
    saveChanges: string;
  };
  actions: {
    deployNow: string;
    readDocs: string;
  };
  footer: {
    learn: string;
    examples: string;
    goToNextjs: string;
  };
  formatting: {
    date: {
      today: string;
      yesterday: string;
      tomorrow: string;
      lastUpdated: string;
      publishedOn: string;
    };
    number: {
      currency: string;
      percentage: string;
      fileSize: string;
    };
    plurals: {
      items: {
        zero: string;
        one: string;
        other: string;
      };
      users: {
        zero: string;
        one: string;
        other: string;
      };
      notifications: {
        zero: string;
        one: string;
        other: string;
      };
    };
  };
  errors: {
    notFound: string;
    serverError: string;
    networkError: string;
    validationError: string;
    unauthorized: string;
    forbidden: string;
    timeout: string;
    generic: string;
    translationMissing: string;
    loadingFailed: string;
  };
  accessibility: {
    skipToContent: string;
    openMenu: string;
    closeMenu: string;
    loading: string;
    error: string;
    languageSelector: string;
    themeSelector: string;
    securityVerificationUnavailable: string;
    turnstileDevBypass: string;
    turnstileTestMode: string;
    turnstileLoadFailed: string;
  };
}

// 翻译键路径类型
export type TranslationKey = keyof Messages | `${keyof Messages}.${string}`;

// 翻译参数类型
export interface TranslationParams {
  [key: string]: string | number | boolean | Date;
}

/**
 * @public Formatting options for downstream i18n helpers.
 */
export interface FormatOptions {
  dateTime?: Intl.DateTimeFormatOptions;
  number?: Intl.NumberFormatOptions;
  list?: Intl.ListFormatOptions;
}

/**
 * @public Translation context contract for downstream i18n helpers.
 */
export interface TranslationContext {
  locale: Locale;
  fallbackLocale: Locale;
  namespace?: string;
  interpolation?: boolean;
  escapeValue?: boolean;
}

// 翻译错误类型
export interface TranslationError {
  code: "MISSING_KEY" | "INVALID_PARAMS" | "FORMAT_ERROR" | "NETWORK_ERROR";
  message: string;
  key?: string;
  locale?: Locale;
  params?: TranslationParams;
}

/**
 * @public Translation state contract for downstream i18n helpers.
 */
export interface TranslationState {
  isLoading: boolean;
  error: TranslationError | null;
  locale: Locale;
  fallbackLocale: Locale;
  messages: Partial<Messages>;
  coverage: number;
}

/**
 * @public I18n configuration contract for downstream integrations.
 */
export interface I18nConfig {
  defaultLocale: Locale;
  locales: Locale[];
  fallbackLocale: Locale;
  interpolation: {
    escapeValue: boolean;
    prefix: string;
    suffix: string;
  };
  detection: {
    order: ("localStorage" | "cookie" | "header" | "path")[];
    caches: ("localStorage" | "cookie")[];
    cookieOptions: {
      maxAge: number;
      sameSite: "strict" | "lax" | "none";
      secure: boolean;
    };
  };
  backend: {
    loadPath: string;
    allowMultiLoading: boolean;
    crossDomain: boolean;
  };
  cache: {
    enabled: boolean;
    prefix: string;
    expirationTime: number;
  };
}

/**
 * @public Translation hook return contract for downstream UI helpers.
 */
export interface UseTranslationReturn {
  t: (_key: TranslationKey, _params?: TranslationParams) => string;
  locale: Locale;
  isLoading: boolean;
  error: TranslationError | null;
  changeLanguage: (_locale: Locale) => Promise<void>;
  ready: boolean;
}

/**
 * @public Formatter hook return contract for downstream UI helpers.
 */
export interface UseFormatterReturn {
  formatDate: (
    _date: Date | string | number,
    _options?: Intl.DateTimeFormatOptions,
  ) => string;
  formatNumber: (_value: number, _options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (_value: number, _currency?: string) => string;
  formatPercentage: (_value: number) => string;
  formatList: (_items: string[], _options?: Intl.ListFormatOptions) => string;
  formatRelativeTime: (
    _value: number,
    _unit: Intl.RelativeTimeFormatUnit,
  ) => string;
}

// 路由国际化类型
export interface LocalizedPathnames {
  [_key: string]: string | { [_locale in Locale]: string };
}

// 域名配置类型
export interface DomainConfig {
  domain: string;
  defaultLocale: Locale;
  locales?: Locale[];
}

/**
 * @public Routing middleware configuration contract.
 */
export interface MiddlewareConfig {
  locales: Locale[];
  defaultLocale: Locale;
  localePrefix: "always" | "as-needed" | "never";
  domains?: DomainConfig[];
  pathnames?: LocalizedPathnames;
  alternateLinks?: boolean;
  localeDetection?: boolean;
}

/**
 * @public I18n metrics contract for downstream observability.
 */
export interface I18nMetrics {
  loadTime: number;
  cacheHitRate: number;
  errorRate: number;
  translationCoverage: number;
  localeUsage: Record<Locale, number>;
}

/**
 * @public Translation quality contract for downstream reporting.
 */
export interface TranslationQuality {
  completeness: number;
  consistency: number;
  accuracy: number;
  freshness: number;
  score: number;
}
export {};
