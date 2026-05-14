"use client";

import {
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { ANIMATION_DURATION_VERY_SLOW } from "@/constants/core";

type HeaderLanguageLocale = "en" | "zh";
type TimeoutHandle = ReturnType<typeof setTimeout>;

interface HeaderLanguageMenuProps {
  locale: HeaderLanguageLocale;
  initialOpen?: boolean;
}

interface DismissableMenuOptions {
  isOpen: boolean;
  onClose: () => void;
  rootRef: RefObject<HTMLDivElement | null>;
}

interface LanguageTransitionState {
  switchingTo: HeaderLanguageLocale | null;
  handleLanguageClick: (targetLocale: HeaderLanguageLocale) => void;
}

const LANGUAGE_OPTIONS: Array<{
  locale: HeaderLanguageLocale;
  label: string;
}> = [
  { locale: "en", label: "English" },
  { locale: "zh", label: "简体中文" },
];

const LANGUAGE_LABELS = {
  en: "English",
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

  for (const option of LANGUAGE_OPTIONS) {
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

function isNode(target: EventTarget | null): target is Node {
  return target instanceof Node;
}

function useDismissableMenu({
  isOpen,
  onClose,
  rootRef,
}: DismissableMenuOptions) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (!isNode(event.target) || rootRef.current?.contains(event.target)) {
        return;
      }

      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, rootRef]);
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
  const menuBaseId = useId();
  const triggerId = `${menuBaseId}-trigger`;
  const menuId = `${menuBaseId}-menu`;
  const [pathname, setPathname] = useState(getCurrentBrowserPathname);
  const [isOpen, setIsOpen] = useState(() => initialOpen);
  const closeMenu = useCallback(() => setIsOpen(false), []);
  const toggleMenu = useCallback(() => {
    const nextIsOpen = !isOpen;
    if (nextIsOpen) {
      setPathname(getCurrentBrowserPathname());
    }
    setIsOpen(nextIsOpen);
  }, [isOpen]);
  useDismissableMenu({ isOpen, onClose: closeMenu, rootRef });
  const { switchingTo, handleLanguageClick } = useLanguageTransition();
  const currentLanguageName = LANGUAGE_LABELS[locale];
  const languageHrefs = useMemo(
    () => ({
      en: getLanguageHref(pathname, "en"),
      zh: getLanguageHref(pathname, "zh"),
    }),
    [pathname],
  );

  return (
    <div
      ref={rootRef}
      data-testid="language-switcher"
      className="notranslate relative inline-block"
      translate="no"
    >
      <button
        type="button"
        id={triggerId}
        data-testid="language-toggle-button"
        aria-label={currentLanguageName}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        className={TRIGGER_CLASS_NAME}
        onClick={toggleMenu}
      >
        <GlobeIcon />
        <span
          className="text-xs font-medium text-muted-foreground"
          data-testid="language-current-label"
          translate="no"
        >
          {currentLanguageName}
        </span>
        <ChevronIcon isOpen={isOpen} />
      </button>
      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-labelledby={triggerId}
          data-testid="language-dropdown-content"
          data-state="open"
          translate="no"
          className={MENU_CLASS_NAME}
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <div data-testid="language-dropdown-item" key={option.locale}>
              <a
                href={languageHrefs[option.locale]}
                className={LANGUAGE_LINK_CLASS_NAME}
                data-locale={option.locale}
                data-testid={`language-link-${option.locale}`}
                role="menuitem"
                translate="no"
                onClick={() => handleLanguageClick(option.locale)}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
