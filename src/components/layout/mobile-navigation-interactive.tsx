"use client";

// Current split: MobileNavigationLinks (server-rendered fallback) + this file (client interactivity).
// Content assembly (MobileNavigationHeader, drawer layout) still lives here.
// A deeper RSC boundary refactor would move content assembly to the server shell.

import {
  cloneElement,
  isValidElement,
  useCallback,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { Check, Globe, Menu, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Link, usePathname } from "@/i18n/routing";
import { NAVIGATION_ARIA } from "@/lib/navigation";
import {
  MobileNavigationLinks,
  type MobileNavigationLinksProps,
} from "@/components/layout/mobile-navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

interface MobileNavigationInteractiveProps {
  children?: ReactNode;
  className?: string;
  closeMenuLabel?: string | undefined;
  initialOpen?: boolean;
  languageLabel?: string | undefined;
  openMenuLabel?: string | undefined;
  siteDescription?: string | undefined;
  siteName?: string | undefined;
}

interface MobileMenuButtonProps extends ComponentProps<"button"> {
  closeMenuLabel?: string | undefined;
  isOpen: boolean;
  labelTestId?: string | undefined;
  openMenuLabel?: string | undefined;
}

interface MobileMenuState {
  isLanguageExpanded: boolean;
  isOpen: boolean;
  pathname: string;
}

export function MobileMenuButton({
  isOpen,
  className,
  onClick,
  openMenuLabel,
  closeMenuLabel,
  labelTestId = "mobile-menu-button-label",
  ...props
}: MobileMenuButtonProps) {
  const t = useTranslations();
  const label = isOpen
    ? (closeMenuLabel ?? t("accessibility.closeMenu"))
    : (openMenuLabel ?? t("accessibility.openMenu"));

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("relative", className)}
      aria-label={label}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      data-state={isOpen ? "open" : "closed"}
      data-testid="header-mobile-menu-button"
      onClick={onClick}
      {...props}
    >
      {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      <span className="sr-only" data-testid={labelTestId} translate="no">
        {label}
      </span>
    </Button>
  );
}

function MobileNavigationHeader({
  siteName,
  siteDescription,
}: {
  siteDescription: string;
  siteName: string;
}) {
  return (
    <SheetHeader className="text-left">
      <SheetTitle className="sr-only">{NAVIGATION_ARIA.mobileMenu}</SheetTitle>
      <div className="text-lg font-semibold" aria-hidden="true">
        {siteName}
      </div>
      <SheetDescription className="text-sm text-muted-foreground">
        {siteDescription}
      </SheetDescription>
    </SheetHeader>
  );
}

function MobileLanguageSwitcher({
  isExpanded,
  languageLabel,
  onExpandedChange,
  pathname,
  onNavigate,
}: {
  isExpanded: boolean;
  languageLabel: string;
  onExpandedChange: (isExpanded: boolean) => void;
  onNavigate?: () => void;
  pathname: string;
}) {
  const currentLocale = useLocale() === "zh" ? "zh" : "en";

  const languages = [
    { locale: "en" as const, label: "English" },
    { locale: "zh" as const, label: "简体中文" },
  ];
  const currentLanguageLabel = currentLocale === "zh" ? "简体中文" : "English";

  const handleNavigate = () => {
    onExpandedChange(false);
    onNavigate?.();
  };

  return (
    <div className="space-y-1" data-testid="mobile-language-switcher">
      <Button
        type="button"
        variant="ghost"
        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-accent/50 hover:text-foreground"
        aria-expanded={isExpanded}
        aria-label={`${languageLabel} ${currentLanguageLabel}`}
        data-testid="mobile-language-switcher-label"
        onClick={() => onExpandedChange(!isExpanded)}
      >
        <span className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span translate="no">{languageLabel}</span>
        </span>
        <span className="flex items-center gap-2">
          <span translate="no">{currentLanguageLabel}</span>
          <svg
            aria-hidden="true"
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isExpanded && "rotate-180",
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </Button>
      {isExpanded
        ? languages.map(({ locale, label }) => {
            const isActive = currentLocale === locale;
            return (
              <Link
                key={locale}
                href={(pathname || "/") as "/"}
                locale={locale}
                prefetch={false}
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
                onClick={handleNavigate}
              >
                <span
                  data-testid={`mobile-language-option-label-${locale}`}
                  translate="no"
                >
                  {label}
                </span>
                {isActive && <Check className="h-4 w-4" />}
              </Link>
            );
          })
        : null}
    </div>
  );
}

function withInteractiveNavigationProps(
  children: ReactNode,
  props: MobileNavigationLinksProps,
) {
  if (!isValidElement<MobileNavigationLinksProps>(children)) {
    return children;
  }

  return cloneElement(children, props);
}

export function MobileNavigationInteractive({
  children,
  className,
  initialOpen = false,
  openMenuLabel,
  closeMenuLabel,
  languageLabel = "Language",
  siteName,
  siteDescription,
}: MobileNavigationInteractiveProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const [menuState, setMenuState] = useState<MobileMenuState>(() => ({
    isLanguageExpanded: false,
    isOpen: initialOpen,
    pathname,
  }));
  const isOpen = menuState.pathname === pathname && menuState.isOpen;
  const isLanguageExpanded = isOpen && menuState.isLanguageExpanded;
  const resolvedSiteName = siteName ?? t("navigation.siteName");
  const resolvedSiteDescription =
    siteDescription ?? t("navigation.siteDescription");

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setMenuState((currentState) => ({
        isLanguageExpanded: open ? currentState.isLanguageExpanded : false,
        isOpen: open,
        pathname,
      }));
    },
    [pathname],
  );

  const handleLanguageExpandedChange = useCallback(
    (expanded: boolean) => {
      setMenuState((currentState) => ({
        ...currentState,
        isLanguageExpanded: expanded,
        pathname,
      }));
    },
    [pathname],
  );

  const navigationContent = children ? (
    withInteractiveNavigationProps(children, {
      currentPathname: pathname,
      onNavigate: () => handleOpenChange(false),
    })
  ) : (
    <MobileNavigationLinks
      currentPathname={pathname}
      onNavigate={() => handleOpenChange(false)}
    />
  );

  return (
    <div className={cn("header-mobile-only", className)}>
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <MobileMenuButton
            isOpen={isOpen}
            aria-controls="mobile-navigation"
            closeMenuLabel={closeMenuLabel}
            openMenuLabel={openMenuLabel}
            labelTestId="mobile-menu-toggle-label"
          />
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-[300px] overflow-y-auto sm:w-[350px]"
          id="mobile-navigation"
          aria-label={NAVIGATION_ARIA.mobileMenu}
          data-testid="mobile-menu-content"
          onEscapeKeyDown={() => handleOpenChange(false)}
        >
          <MobileNavigationHeader
            siteDescription={resolvedSiteDescription}
            siteName={resolvedSiteName}
          />
          <Separator className="my-4" />
          {navigationContent}
          <Separator className="my-4" />
          <MobileLanguageSwitcher
            isExpanded={isLanguageExpanded}
            languageLabel={languageLabel}
            onExpandedChange={handleLanguageExpandedChange}
            pathname={pathname}
            onNavigate={() => handleOpenChange(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
