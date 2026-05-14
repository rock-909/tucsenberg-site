"use client";

import { useEffect } from "react";
import { coerceLocale } from "@/i18n/locale-utils";
import type { Locale } from "@/i18n/routing-config";
import { isPublicRuntimeDevelopment } from "@/lib/env";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Static translations for global error page.
 * Global error boundary runs outside [locale] route, so we use static translations
 * with browser language detection as fallback.
 */
const translations = {
  en: {
    title: "Something went wrong!",
    description:
      "We apologize for the inconvenience. An unexpected error has occurred.",
    tryAgain: "Try again",
    goHome: "Go to homepage",
    devDetails: "Error Details (Development Only)",
  },
  es: {
    title: "Algo salió mal.",
    description:
      "Disculpa las molestias. Se produjo un error inesperado.",
    tryAgain: "Intentar de nuevo",
    goHome: "Ir al inicio",
    devDetails: "Detalles del error (solo desarrollo)",
  },
  zh: {
    title: "出错了！",
    description: "非常抱歉给您带来不便。发生了意外错误。",
    tryAgain: "重试",
    goHome: "返回首页",
    devDetails: "错误详情（仅开发环境）",
  },
} as const;

function getLocaleFromBrowser(): Locale {
  if (typeof window === "undefined") return coerceLocale(undefined);

  const browserLang = navigator.language?.toLowerCase() || "";
  const browserLocale = browserLang.startsWith("zh")
    ? "zh"
    : browserLang.startsWith("es")
      ? "es"
      : "en";

  return coerceLocale(browserLocale);
}

function isDevelopmentRuntime(): boolean {
  return isPublicRuntimeDevelopment();
}

async function reportGlobalError(error: Error): Promise<void> {
  const { logger } = await import("@/lib/logger");
  logger.error("Global error caught", error);
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const locale = getLocaleFromBrowser();
  const t = translations[locale];

  useEffect(() => {
    reportGlobalError(error).catch(() => undefined);
  }, [error]);

  return (
    <html lang={locale}>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
          <div className="mx-auto max-w-md text-center">
            <h1 className="mb-4 text-2xl font-bold text-foreground">
              {t.title}
            </h1>
            <p className="mb-6 text-muted-foreground">{t.description}</p>
            {isDevelopmentRuntime() && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm font-medium">
                  {t.devDetails}
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
                  {error.message}
                  {error.stack && (
                    <>
                      {"\n\n"}
                      {error.stack}
                    </>
                  )}
                </pre>
              </details>
            )}
            <div className="space-y-4">
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-[38px] w-full shrink-0 items-center justify-center rounded-[6px] bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[var(--primary-dark)]"
                data-testid="try-again-button"
              >
                {t.tryAgain}
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = `/${locale}`;
                }}
                className="inline-flex h-[38px] w-full shrink-0 items-center justify-center rounded-[6px] border-2 border-primary bg-transparent px-5 py-2.5 text-sm font-semibold text-primary transition-colors duration-150 hover:bg-primary/10"
                data-testid="go-home-button"
              >
                {t.goHome}
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
