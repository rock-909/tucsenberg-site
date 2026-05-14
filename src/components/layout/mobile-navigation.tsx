import type { ComponentProps } from "react";
import { useTranslations } from "next-intl";
import { SINGLE_SITE_HOME_LINK_TARGETS } from "@/config/single-site-links";
import {
  isActivePath,
  mobileNavigation,
  NAVIGATION_ARIA,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";

export interface MobileNavigationLinksProps extends Omit<
  ComponentProps<"nav">,
  "children"
> {
  contactSalesLabel?: string;
  currentPathname?: string;
  onNavigate?: () => void;
}

export function MobileNavigationLinks({
  className,
  contactSalesLabel,
  currentPathname,
  onNavigate,
  ...props
}: MobileNavigationLinksProps) {
  const t = useTranslations();
  const resolvedContactSalesLabel =
    contactSalesLabel ?? t("navigation.contactSales");

  return (
    <nav
      aria-label={NAVIGATION_ARIA.mobileMenu}
      className={cn("flex flex-col space-y-1", className)}
      {...props}
    >
      <ul className="space-y-1">
        {mobileNavigation.map((item) => {
          const isActive =
            typeof currentPathname === "string" &&
            isActivePath(currentPathname, item.href);

          return (
            <li key={item.key}>
              <Link
                href={item.href as "/"}
                prefetch={false}
                className={cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
                aria-current={isActive ? "page" : undefined}
                onClick={onNavigate}
              >
                {t(item.translationKey)}
              </Link>
            </li>
          );
        })}
        <li className="pt-4">
          <Link
            href={{
              pathname: SINGLE_SITE_HOME_LINK_TARGETS.contact,
              query: { source: "mobile_nav_cta" },
            }}
            prefetch={false}
            className="flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90"
            onClick={onNavigate}
          >
            {resolvedContactSalesLabel}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
