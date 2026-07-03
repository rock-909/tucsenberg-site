"use client";

import { lazy, Suspense, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  LANGUAGE_OPTION_LABELS,
  LANGUAGE_TRIGGER_LABELS,
  type SiteLanguage,
} from "@/config/language-display";
import { MobileNavigationFallback } from "@/components/layout/header-mobile-navigation-fallback";
import { HEADER_UTILITY_CONTROL_CLASS } from "@/components/layout/header-utility-control";
import { cn } from "@/lib/utils";

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

interface MobileNavigationIslandProps {
  children?: ReactNode;
  openMenuLabel?: string;
  closeMenuLabel?: string;
  languageLabel?: string;
  locale?: SiteLanguage;
}

interface LanguageToggleIslandProps {
  locale: SiteLanguage;
}

interface LanguageToggleTriggerProps {
  locale: SiteLanguage;
  isPending?: boolean;
  onClick?: () => void;
}

function LanguageToggleTrigger({
  locale,
  isPending = false,
  onClick,
}: LanguageToggleTriggerProps) {
  const currentLanguageName = LANGUAGE_OPTION_LABELS[locale];
  const currentTriggerLabel = LANGUAGE_TRIGGER_LABELS[locale];

  return (
    <button
      type="button"
      className={cn("notranslate", HEADER_UTILITY_CONTROL_CLASS)}
      aria-label={currentLanguageName}
      aria-busy={isPending}
      aria-haspopup="menu"
      aria-expanded={isPending}
      data-testid="language-toggle-button"
      data-locale={locale}
      translate="no"
      onClick={onClick}
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
        className="whitespace-nowrap text-xs font-medium text-muted-foreground"
        data-testid="language-current-label"
        translate="no"
      >
        {currentTriggerLabel}
      </span>
      <svg
        aria-hidden="true"
        className={cn(
          "size-3.5 text-muted-foreground transition-transform duration-150 ease-in-out",
          isPending && "rotate-180",
        )}
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
  const pathname = usePathname();
  const [activationPathname, setActivationPathname] = useState<string | null>(
    null,
  );
  const isActivated = activationPathname !== null;
  const isActivationCurrent = activationPathname === pathname;
  const fallback = (
    <LanguageToggleTrigger
      locale={locale}
      isPending={isActivated && isActivationCurrent}
      onClick={() => setActivationPathname(pathname)}
    />
  );

  return (
    <div className="inline-flex min-w-[6.25rem] shrink-0 justify-end">
      {isActivated ? (
        <Suspense fallback={fallback}>
          <HeaderLanguageMenu
            initialOpen={isActivationCurrent}
            locale={locale}
          />
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
}
