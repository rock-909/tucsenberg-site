"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ANIMATION_DURATION_VERY_SLOW } from "@/constants/core";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LANGUAGE_OPTION_LABELS,
  LANGUAGE_TRIGGER_LABELS,
  type SiteLanguage,
} from "@/config/language-display";
import { LOCALES_CONFIG } from "@/config/paths/locales-config";
import { HEADER_UTILITY_CONTROL_CLASS } from "@/components/layout/header-utility-control";
import { cn } from "@/lib/utils";

type HeaderLanguageLocale = SiteLanguage;
type TimeoutHandle = ReturnType<typeof setTimeout>;

interface HeaderLanguageMenuProps {
  locale: HeaderLanguageLocale;
  initialOpen?: boolean;
}

interface LanguageTransitionState {
  switchingTo: HeaderLanguageLocale | null;
  handleLanguageClick: (targetLocale: HeaderLanguageLocale) => void;
}

interface LanguageMenuOpenState {
  isOpen: boolean;
  routePathname: string;
}

const CHEVRON_ICON_CLASS_NAME =
  "h-3.5 w-3.5 text-muted-foreground transition-transform duration-150 ease-in-out";
const LANGUAGE_OPTIONS: Array<{
  locale: HeaderLanguageLocale;
  label: string;
}> = LOCALES_CONFIG.locales.map((locale) => ({
  locale,
  label: LANGUAGE_OPTION_LABELS[locale],
}));
const KNOWN_LANGUAGE_PREFIXES = Object.keys(LANGUAGE_OPTION_LABELS);

const TRIGGER_CLASS_NAME = HEADER_UTILITY_CONTROL_CLASS;
const MENU_CLASS_NAME =
  "notranslate z-50 min-w-[180px] px-0 py-2.5 " +
  "rounded-xl border border-border bg-popover text-popover-foreground shadow-lg";
const LANGUAGE_LINK_CLASS_NAME =
  "flex w-full cursor-pointer items-center justify-between rounded-md px-3.5 py-2 " +
  "font-medium text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-foreground/10 " +
  "transition-colors duration-150 ease-in-out";
const LANGUAGE_ITEM_CLASS_NAME =
  "block cursor-default rounded-md p-0 outline-none focus:bg-muted focus:text-foreground";

function GlobeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5 text-muted-foreground"
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
  );
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={
        isOpen
          ? `${CHEVRON_ICON_CLASS_NAME} rotate-180`
          : CHEVRON_ICON_CLASS_NAME
      }
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
  );
}

function LoaderIcon() {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
      data-testid="loader-icon"
    />
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 text-foreground"
      data-testid="check-icon"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        d="M5 13l4 4L19 7"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function normalizeHeaderPathname(pathname: string) {
  const normalized = pathname === "" ? "/" : pathname;
  const withLeadingSlash = normalized.startsWith("/")
    ? normalized
    : `/${normalized}`;

  for (const locale of KNOWN_LANGUAGE_PREFIXES) {
    const localePrefix = `/${locale}`;

    if (withLeadingSlash === localePrefix) {
      return "/";
    }

    if (withLeadingSlash.startsWith(`${localePrefix}/`)) {
      return withLeadingSlash.slice(localePrefix.length);
    }
  }

  return withLeadingSlash;
}

function getLanguageHref(pathname: string, locale: HeaderLanguageLocale) {
  const normalizedPathname = normalizeHeaderPathname(pathname);
  if (LOCALES_CONFIG.localePrefix === "never") {
    return normalizedPathname;
  }

  return normalizedPathname === "/"
    ? `/${locale}`
    : `/${locale}${normalizedPathname}`;
}

function getCurrentBrowserPathname() {
  if (typeof window === "undefined") {
    return "/";
  }

  return window.location.pathname || "/";
}

function useLanguageTransition(): LanguageTransitionState {
  const [switchingTo, setSwitchingTo] = useState<HeaderLanguageLocale | null>(
    null,
  );
  const transitionTimeoutRef = useRef<TimeoutHandle | null>(null);

  const clearTransitionTimeout = useCallback(() => {
    if (transitionTimeoutRef.current === null) return;
    clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = null;
  }, []);

  const handleLanguageClick = useCallback(
    (targetLocale: HeaderLanguageLocale) => {
      clearTransitionTimeout();
      setSwitchingTo(targetLocale);
      transitionTimeoutRef.current = setTimeout(() => {
        setSwitchingTo(null);
        transitionTimeoutRef.current = null;
      }, ANIMATION_DURATION_VERY_SLOW);
    },
    [clearTransitionTimeout],
  );

  useEffect(() => clearTransitionTimeout, [clearTransitionTimeout]);

  return { switchingTo, handleLanguageClick };
}

export function HeaderLanguageMenu({
  locale,
  initialOpen = false,
}: HeaderLanguageMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const routePathname = usePathname();
  const [pathname, setPathname] = useState(getCurrentBrowserPathname);
  const [openState, setOpenState] = useState<LanguageMenuOpenState>(() => ({
    isOpen: initialOpen,
    routePathname,
  }));
  const isOpen = openState.routePathname === routePathname && openState.isOpen;
  const handleOpenChange = useCallback(
    (nextIsOpen: boolean) => {
      if (nextIsOpen) {
        setPathname(getCurrentBrowserPathname());
      }
      setOpenState({ isOpen: nextIsOpen, routePathname });
    },
    [routePathname],
  );
  const { switchingTo, handleLanguageClick } = useLanguageTransition();
  const currentLanguageName = LANGUAGE_OPTION_LABELS[locale];
  const currentTriggerLabel = LANGUAGE_TRIGGER_LABELS[locale];
  const languageHrefs = useMemo(
    () =>
      new Map(
        LANGUAGE_OPTIONS.map((option) => [
          option.locale,
          getLanguageHref(pathname, option.locale),
        ]),
      ),
    [pathname],
  );

  return (
    <DropdownMenu modal={false} open={isOpen} onOpenChange={handleOpenChange}>
      <div
        ref={rootRef}
        data-testid="language-switcher"
        className="notranslate relative inline-block"
        translate="no"
      >
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            data-testid="language-toggle-button"
            aria-label={currentLanguageName}
            className={TRIGGER_CLASS_NAME}
          >
            <GlobeIcon />
            <span
              className="whitespace-nowrap text-xs font-medium text-muted-foreground"
              data-testid="language-current-label"
              translate="no"
            >
              {currentTriggerLabel}
            </span>
            <ChevronIcon isOpen={isOpen} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          data-testid="language-dropdown-content"
          data-state={isOpen ? "open" : "closed"}
          translate="no"
          className={MENU_CLASS_NAME}
        >
          {LANGUAGE_OPTIONS.map((option) => {
            const isSwitchingToOption = switchingTo === option.locale;
            const isCurrentLocale = locale === option.locale;

            return (
              <div data-testid="language-dropdown-item" key={option.locale}>
                <DropdownMenuItem asChild className={LANGUAGE_ITEM_CLASS_NAME}>
                  <a
                    href={languageHrefs.get(option.locale) ?? "/"}
                    className={cn(
                      LANGUAGE_LINK_CLASS_NAME,
                      isSwitchingToOption && "pointer-events-none",
                    )}
                    data-locale={option.locale}
                    data-testid={`language-link-${option.locale}`}
                    translate="no"
                    onClick={() => {
                      handleLanguageClick(option.locale);
                      setOpenState({ isOpen: false, routePathname });
                    }}
                  >
                    <span
                      className="text-xs"
                      data-testid={`language-option-label-${option.locale}`}
                      translate="no"
                    >
                      {option.label}
                    </span>
                    {isSwitchingToOption && <LoaderIcon />}
                    {isCurrentLocale && !isSwitchingToOption && <CheckIcon />}
                  </a>
                </DropdownMenuItem>
              </div>
            );
          })}
        </DropdownMenuContent>
      </div>
    </DropdownMenu>
  );
}
