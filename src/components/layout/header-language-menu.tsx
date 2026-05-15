"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { ANIMATION_DURATION_VERY_SLOW } from "@/constants/core";
import type { Locale } from "@/i18n/routing-config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type HeaderLanguageLocale = Locale;
type PublicHeaderLanguageLocale = Exclude<HeaderLanguageLocale, "zh">;
type TimeoutHandle = ReturnType<typeof setTimeout>;

interface HeaderLanguageMenuProps {
  locale: HeaderLanguageLocale;
  initialOpen?: boolean;
}

interface LanguageTransitionState {
  switchingTo: HeaderLanguageLocale | null;
  showClosedLoader: boolean;
  handleLanguageClick: (targetLocale: HeaderLanguageLocale) => void;
}

const RUNTIME_LANGUAGE_OPTIONS: Array<{
  locale: HeaderLanguageLocale;
  label: string;
}> = [
  { locale: "en", label: "English" },
  { locale: "es", label: "Español" },
  { locale: "zh", label: "简体中文" },
];

const PUBLIC_LANGUAGE_OPTIONS: Array<{
  locale: PublicHeaderLanguageLocale;
  label: string;
}> = [
  { locale: "en", label: "English" },
  { locale: "es", label: "Español" },
];

const LANGUAGE_LABELS = {
  en: "English",
  es: "Español",
  zh: "简体中文",
} as const;

const CHEVRON_ICON_CLASS_NAME =
  "h-3.5 w-3.5 text-muted-foreground transition-transform duration-150 ease-in-out";
const TRIGGER_CLASS_NAME =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-full px-3 " +
  "border border-border bg-background hover:bg-muted/60 " +
  "text-muted-foreground hover:text-foreground " +
  "transition-colors duration-150 ease-out " +
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background";
const MENU_CLASS_NAME =
  "notranslate absolute right-0 top-full z-50 mt-2 min-w-[180px] px-0 py-2.5 " +
  "rounded-xl border border-border bg-popover text-popover-foreground shadow-lg";
const LANGUAGE_LINK_CLASS_NAME =
  "flex w-full cursor-pointer items-center justify-between rounded-md px-3.5 py-2 " +
  "font-medium text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-foreground/10 " +
  "transition-colors duration-150 ease-in-out";

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

  for (const option of RUNTIME_LANGUAGE_OPTIONS) {
    const localePrefix = `/${option.locale}`;

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
  const [showClosedLoader, setShowClosedLoader] = useState(false);
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
      setShowClosedLoader(true);
      transitionTimeoutRef.current = setTimeout(() => {
        setSwitchingTo(null);
        setShowClosedLoader(false);
        transitionTimeoutRef.current = null;
      }, ANIMATION_DURATION_VERY_SLOW);
    },
    [clearTransitionTimeout],
  );

  useEffect(() => clearTransitionTimeout, [clearTransitionTimeout]);

  return { switchingTo, showClosedLoader, handleLanguageClick };
}

export function HeaderLanguageMenu({
  locale,
  initialOpen = false,
}: HeaderLanguageMenuProps) {
  const menuBaseId = useId();
  const triggerId = `${menuBaseId}-trigger`;
  const menuId = `${menuBaseId}-menu`;
  const [pathname, setPathname] = useState(getCurrentBrowserPathname);
  const [isOpen, setIsOpen] = useState(() => initialOpen);
  const handleOpenChange = useCallback((nextIsOpen: boolean) => {
    if (nextIsOpen) {
      setPathname(getCurrentBrowserPathname());
    }
    setIsOpen(nextIsOpen);
  }, []);
  const { switchingTo, showClosedLoader, handleLanguageClick } =
    useLanguageTransition();
  const currentLanguageName = LANGUAGE_LABELS[locale];
  const languageHrefs = useMemo(
    () =>
      Object.fromEntries(
        PUBLIC_LANGUAGE_OPTIONS.map((option) => [
          option.locale,
          getLanguageHref(pathname, option.locale),
        ]),
      ) as Record<PublicHeaderLanguageLocale, string>,
    [pathname],
  );

  return (
    <DropdownMenu modal={false} open={isOpen} onOpenChange={handleOpenChange}>
      <div
        data-testid="language-switcher"
        className="notranslate relative inline-block"
        translate="no"
      >
        <DropdownMenuTrigger
          id={triggerId}
          data-testid="language-toggle-button"
          aria-label={currentLanguageName}
          aria-controls={menuId}
          className={TRIGGER_CLASS_NAME}
        >
          <GlobeIcon />
          <span
            className="text-xs font-medium text-muted-foreground"
            data-testid="language-current-label"
            translate="no"
          >
            {currentLanguageName}
          </span>
          {showClosedLoader && <LoaderIcon />}
          <ChevronIcon isOpen={isOpen} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          id={menuId}
          aria-labelledby={triggerId}
          data-testid="language-dropdown-content"
          align="end"
          translate="no"
          className={MENU_CLASS_NAME}
        >
          {PUBLIC_LANGUAGE_OPTIONS.map((option) => (
            <DropdownMenuItem
              asChild
              data-testid="language-dropdown-item"
              key={option.locale}
              onSelect={() => handleLanguageClick(option.locale)}
            >
              <a
                href={languageHrefs[option.locale]}
                className={LANGUAGE_LINK_CLASS_NAME}
                data-locale={option.locale}
                data-testid={`language-link-${option.locale}`}
                translate="no"
              >
                <span
                  className="text-xs"
                  data-testid={`language-option-label-${option.locale}`}
                  translate="no"
                >
                  {option.label}
                </span>
                {switchingTo === option.locale && <LoaderIcon />}
                {locale === option.locale && switchingTo !== option.locale && (
                  <CheckIcon />
                )}
              </a>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </div>
    </DropdownMenu>
  );
}
