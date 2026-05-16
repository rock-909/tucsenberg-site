/**
 * Header Component (Server)
 *
 * 服务端渲染的头部，交互部件以客户端小岛方式注入，减少首屏 JS 体积。
 */
import { SINGLE_SITE_PRIMARY_CTA_HREF } from "@/config/single-site-links";
import type { Locale } from "@/i18n/routing-config";
import { Link } from "@/i18n/routing";
import { getRuntimeEnvString } from "@/lib/env";
import { NAVIGATION_ARIA } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import {
  MobileNavigationIsland,
  LanguageToggleIsland,
} from "@/components/layout/header-client";
import { Logo } from "@/components/layout/logo";
import { MobileNavigationLinks } from "@/components/layout/mobile-navigation";
import { SearchLauncher } from "@/components/search/search-launcher";
import { Button } from "@/components/ui/button";

/**
 * Header Component
 *
 * Main navigation header with responsive design, logo, navigation menus,
 * and utility controls (language switcher, theme toggle).
 */

// Simplified header props interface
interface HeaderNavItem {
  key: string;
  href: string;
  label: string;
}

interface HeaderProps {
  className?: string;
  variant?: "default" | "minimal" | "transparent";
  sticky?: boolean;
  locale?: Locale;
  contactSalesLabel?: string;
  openMenuLabel?: string;
  closeMenuLabel?: string;
  mobileLanguageLabel?: string;
  mainNavItems?: HeaderNavItem[];
}

const EMPTY_MAIN_NAV_ITEMS: HeaderNavItem[] = [];

function getHeaderState(
  variant: HeaderProps["variant"],
  sticky: boolean,
  locale: HeaderProps["locale"],
) {
  return {
    isSticky: variant === "transparent" ? false : sticky,
    isMinimal: variant === "minimal",
    isTransparent: variant === "transparent",
    isModernNav: getRuntimeEnvString("NEXT_PUBLIC_NAV_VARIANT") !== "legacy",
    showTestIds: !locale,
  };
}

export function Header({
  className,
  variant = "default",
  sticky = true,
  locale,
  contactSalesLabel = "Contact Sales",
  openMenuLabel = "Open navigation menu",
  closeMenuLabel = "Close navigation menu",
  mobileLanguageLabel = "Language",
  mainNavItems = EMPTY_MAIN_NAV_ITEMS,
}: HeaderProps) {
  const { isSticky, isMinimal, isTransparent, isModernNav, showTestIds } =
    getHeaderState(variant, sticky, locale);

  return (
    <header
      className={cn(
        "w-full bg-background/80 backdrop-blur-md",
        isSticky && "sticky top-0 z-50",
        isTransparent && "border-transparent bg-transparent backdrop-blur-none",
        isModernNav
          ? "border-b border-border/10 transition-[background-color,border-color] duration-200"
          : !isTransparent && "border-b border-border/10",
        className,
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="header-nav-layout">
          {/* Left section: Logo */}
          <div
            className="header-nav-left"
            {...(showTestIds ? { "data-testid": "mobile-navigation" } : {})}
          >
            <Logo locale={locale} constrainText />
          </div>

          {/* Center section: Main Navigation (Desktop) */}
          <CenterNav
            isMinimal={isMinimal}
            locale={locale}
            mainNavItems={mainNavItems}
          />

          <HeaderUtilityControls
            contactSalesLabel={contactSalesLabel}
            locale={locale}
            openMenuLabel={openMenuLabel}
            closeMenuLabel={closeMenuLabel}
            mobileLanguageLabel={mobileLanguageLabel}
          />
        </div>
      </div>
    </header>
  );
}

function CenterNav({
  isMinimal,
  locale,
  mainNavItems,
}: {
  isMinimal: boolean;
  locale?: Locale | undefined;
  mainNavItems: Array<{
    key: string;
    href: string;
    label: string;
  }>;
}) {
  if (isMinimal || !locale || mainNavItems.length === 0) return null;

  return (
    <nav
      className="header-nav-center"
      aria-label={NAVIGATION_ARIA.mainNav}
      data-testid="header-desktop-nav"
    >
      <ul className="header-desktop-only items-center gap-1">
        {mainNavItems.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href as "/"}
              prefetch={false}
              className={cn(
                "relative inline-flex items-center rounded-full bg-transparent px-3 py-2 text-sm font-medium tracking-[0.01em]",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-muted/40 dark:hover:bg-foreground/10",
                "transition-colors duration-100 ease-out",
              )}
            >
              <span data-testid={`header-nav-label-${item.key}`} translate="no">
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function HeaderUtilityControls({
  contactSalesLabel,
  locale,
  openMenuLabel,
  closeMenuLabel,
  mobileLanguageLabel,
}: {
  contactSalesLabel: string;
  locale: Locale | undefined;
  openMenuLabel: string;
  closeMenuLabel: string;
  mobileLanguageLabel: string;
}) {
  return (
    <div
      className="header-nav-right"
      data-testid={
        locale ? "header-utility-controls" : "language-toggle-button"
      }
    >
      {locale ? (
        <>
          <Button
            variant="default"
            size="sm"
            asChild
            className="header-cta-desktop-only"
          >
            <Link
              href={SINGLE_SITE_PRIMARY_CTA_HREF}
              prefetch={false}
              data-testid="header-cta"
            >
              <span data-testid="header-contact-sales-label" translate="no">
                {contactSalesLabel}
              </span>
            </Link>
          </Button>
          <div
            className="header-mobile-only"
            data-testid="header-mobile-cta-wrapper"
          >
            <Button
              variant="default"
              size="sm"
              asChild
              className="h-9 px-3 text-xs font-semibold"
            >
              <Link
                href={SINGLE_SITE_PRIMARY_CTA_HREF}
                prefetch={false}
                data-testid="header-mobile-cta"
              >
                <span data-testid="header-mobile-contact-label" translate="no">
                  {contactSalesLabel}
                </span>
              </Link>
            </Button>
          </div>
          <div className="header-full-desktop-only h-10 items-center justify-end">
            <SearchLauncher />
          </div>
          <div className="header-full-desktop-only h-10 w-28 items-center justify-end">
            <LanguageToggleIsland locale={locale} />
          </div>
          <div className="header-mobile-only h-10 w-10">
            <MobileNavigationIsland
              openMenuLabel={openMenuLabel}
              closeMenuLabel={closeMenuLabel}
              languageLabel={mobileLanguageLabel}
              locale={locale}
            >
              <MobileNavigationLinks
                contactSalesLabel={contactSalesLabel}
                data-testid="header-mobile-navigation-fallback-links"
              />
            </MobileNavigationIsland>
          </div>
        </>
      ) : null}
    </div>
  );
}
