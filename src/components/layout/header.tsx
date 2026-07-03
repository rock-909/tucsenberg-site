/**
 * Header Component (Server)
 *
 * 服务端渲染的头部，交互部件以客户端小岛方式注入，减少首屏 JS 体积。
 */
import { SINGLE_SITE_HOME_LINK_TARGETS } from "@/config/single-site-links";
import { Link } from "@/i18n/routing";
import { getRuntimeEnvString } from "@/lib/env";
import { NAVIGATION_ARIA } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import {
  LanguageToggleIsland,
  MobileNavigationIsland,
} from "@/components/layout/header-client";
import { HEADER_CTA_CLASS } from "@/components/layout/header-utility-control";
import { Logo } from "@/components/layout/logo";
import { MobileNavigationLinks } from "@/components/layout/mobile-navigation";

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
  locale?: "en" | "zh";
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
  contactSalesLabel = "Contact",
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
        isSticky && "sticky top-0 z-50 pt-[env(safe-area-inset-top,0px)]",
        isTransparent && "border-transparent bg-transparent backdrop-blur-none",
        isModernNav
          ? "border-b border-border/10 transition-[background-color,border-color] duration-200"
          : !isTransparent && "border-b border-border/10",
        className,
      )}
    >
      <div className="mx-auto max-w-[1080px] px-6">
        <div className="header-nav-layout">
          {/* Left section: Logo */}
          <div
            className="header-nav-left"
            {...(showTestIds ? { "data-testid": "mobile-navigation" } : {})}
          >
            <Logo locale={locale} />
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
  locale?: "en" | "zh" | undefined;
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
      <ul className="header-desktop-only header-nav-links-compact items-center">
        {mainNavItems.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href as "/"}
              prefetch={false}
              className={cn(
                "relative inline-flex items-center rounded-full bg-transparent px-2 py-2 text-sm font-medium tracking-[0.01em] xl:px-3",
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
  locale: "en" | "zh" | undefined;
  openMenuLabel: string;
  closeMenuLabel: string;
  mobileLanguageLabel: string;
}) {
  const contactHref = SINGLE_SITE_HOME_LINK_TARGETS.contact;

  return (
    <div
      className="header-nav-right"
      data-testid={
        locale ? "header-utility-controls" : "language-toggle-button"
      }
    >
      {locale ? (
        <>
          {contactHref ? (
            <Link
              href={contactHref}
              prefetch={false}
              data-testid="header-cta"
              className={cn(HEADER_CTA_CLASS, "header-cta-desktop-only")}
            >
              <span data-testid="header-contact-sales-label" translate="no">
                {contactSalesLabel}
              </span>
            </Link>
          ) : null}
          {contactHref ? (
            <div
              className="header-mobile-only"
              data-testid="header-mobile-cta-wrapper"
            >
              <Link
                href={contactHref}
                prefetch={false}
                data-testid="header-mobile-cta"
                className={HEADER_CTA_CLASS}
              >
                <span data-testid="header-mobile-contact-label" translate="no">
                  {contactSalesLabel}
                </span>
              </Link>
            </div>
          ) : null}
          <div className="header-full-desktop-only flex h-10 shrink-0 items-center">
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
