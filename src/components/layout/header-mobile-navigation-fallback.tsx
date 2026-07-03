import type { ReactNode } from "react";
import {
  LANGUAGE_OPTION_LABELS,
  type SiteLanguage,
} from "@/config/language-display";
import { Link } from "@/i18n/routing";

interface MobileNavigationFallbackProps {
  children?: ReactNode;
  languageLabel: string;
  locale: SiteLanguage;
  onActivate: () => void;
  openMenuLabel: string;
}

function MobileLanguageFallback({
  languageLabel,
  locale,
}: {
  languageLabel: string;
  locale: SiteLanguage;
}) {
  const currentLanguageName = LANGUAGE_OPTION_LABELS[locale];

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

export function MobileNavigationFallback({
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
        className="relative inline-flex size-9 cursor-pointer list-none items-center justify-center rounded-md text-foreground transition-colors duration-150 hover:bg-accent [&::-webkit-details-marker]:hidden"
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
