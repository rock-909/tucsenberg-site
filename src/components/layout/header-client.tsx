"use client";

import { lazy, Suspense, useState, type ReactNode } from "react";
import { Link } from "@/i18n/routing";

const MobileNavigationInteractive = lazy(() =>
  import("@/components/layout/mobile-navigation-interactive").then((mod) => ({
    default: mod.MobileNavigationInteractive,
  })),
);

const HeaderLanguageMenu = lazy(() =>
  import("@/components/layout/header-language-menu").then((mod) => ({
    default: mod.HeaderLanguageMenu,
  })),
);

const LANGUAGE_LABELS = {
  en: "English",
  zh: "简体中文",
} as const;

interface MobileNavigationIslandProps {
  children?: ReactNode;
  openMenuLabel?: string;
  closeMenuLabel?: string;
  languageLabel?: string;
  locale?: "en" | "zh";
}

interface LanguageToggleIslandProps {
  locale: "en" | "zh";
}

interface MobileNavigationFallbackProps {
  children?: ReactNode;
  languageLabel: string;
  locale: "en" | "zh";
  onActivate: () => void;
  openMenuLabel: string;
}

function MobileLanguageFallback({
  languageLabel,
  locale,
}: {
  languageLabel: string;
  locale: "en" | "zh";
}) {
  const currentLanguageName = LANGUAGE_LABELS[locale];

  return (
    <details className="mt-3 border-t border-border pt-3">
      <summary
        className="flex cursor-pointer list-none items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground [&::-webkit-details-marker]:hidden"
        data-testid="mobile-language-fallback"
      >
        <span translate="no">{languageLabel}</span>
        <span translate="no">{currentLanguageName}</span>
      </summary>
      <div className="mt-1 space-y-1">
        <Link
          href="/"
          className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          hrefLang="en"
          locale="en"
          prefetch={false}
        >
          <span translate="no">English</span>
        </Link>
        <Link
          href="/"
          className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          hrefLang="zh"
          locale="zh"
          prefetch={false}
        >
          <span translate="no">简体中文</span>
        </Link>
      </div>
    </details>
  );
}

function MobileNavigationFallback({
  children,
  languageLabel,
  locale,
  onActivate,
  openMenuLabel,
}: MobileNavigationFallbackProps) {
  return (
    <details
      className="relative"
      data-testid="header-mobile-navigation-fallback"
    >
      <summary
        className="relative inline-flex size-9 cursor-pointer list-none items-center justify-center rounded-[6px] text-foreground transition-colors duration-150 hover:bg-accent [&::-webkit-details-marker]:hidden"
        aria-label={openMenuLabel}
        aria-controls="mobile-navigation"
        aria-haspopup="dialog"
        data-testid="header-mobile-menu-button"
        onClick={onActivate}
      >
        <svg
          aria-hidden="true"
          className="size-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M4 7h16M4 12h16M4 17h16"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
        <span
          className="sr-only"
          data-testid="header-mobile-menu-label"
          translate="no"
        >
          {openMenuLabel}
        </span>
      </summary>
      {children ? (
        <div
          id="mobile-navigation"
          className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-lg"
          data-testid="header-mobile-navigation-fallback-panel"
        >
          {children}
          <MobileLanguageFallback
            languageLabel={languageLabel}
            locale={locale}
          />
        </div>
      ) : null}
    </details>
  );
}

export function MobileNavigationIsland({
  children,
  openMenuLabel = "Open navigation menu",
  closeMenuLabel = "Close navigation menu",
  languageLabel = "Language",
  locale = "en",
}: MobileNavigationIslandProps) {
  const [isActivated, setIsActivated] = useState(false);
  const fallback = (
    <MobileNavigationFallback
      languageLabel={languageLabel}
      locale={locale}
      openMenuLabel={openMenuLabel}
      onActivate={() => setIsActivated(true)}
    >
      {children}
    </MobileNavigationFallback>
  );

  if (isActivated) {
    return (
      <Suspense fallback={fallback}>
        <MobileNavigationInteractive
          initialOpen
          openMenuLabel={openMenuLabel}
          closeMenuLabel={closeMenuLabel}
          languageLabel={languageLabel}
        />
      </Suspense>
    );
  }

  return fallback;
}

export function LanguageToggleIsland({ locale }: LanguageToggleIslandProps) {
  const [isActivated, setIsActivated] = useState(false);
  const currentLanguageName = LANGUAGE_LABELS[locale];

  if (isActivated) {
    // Pass current locale down to avoid next-intl dependency in this island.
    return (
      <Suspense fallback={null}>
        <HeaderLanguageMenu initialOpen locale={locale} />
      </Suspense>
    );
  }

  return (
    <button
      type="button"
      className="notranslate inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
      aria-label={currentLanguageName}
      aria-haspopup="menu"
      aria-expanded="false"
      data-testid="language-toggle-button"
      data-locale={locale}
      translate="no"
      onClick={() => setIsActivated(true)}
    >
      <svg
        aria-hidden="true"
        className="size-3.5 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M12 21a9 9 0 1 0 0-18m0 18a9 9 0 1 1 0-18m0 18c2.5-2.5 3.75-5.5 3.75-9S14.5 5.5 12 3m0 18c-2.5-2.5-3.75-5.5-3.75-9S9.5 5.5 12 3M3.6 9h16.8M3.6 15h16.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
      <span
        className="text-xs font-medium text-muted-foreground"
        data-testid="language-current-label"
        translate="no"
      >
        {currentLanguageName}
      </span>
      <svg
        aria-hidden="true"
        className="size-3.5 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M19 9l-7 7-7-7"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </button>
  );
}
