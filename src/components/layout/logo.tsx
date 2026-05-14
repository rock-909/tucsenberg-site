/**
 * Logo Component
 *
 * Responsive logo component with proper accessibility and theming support.
 * Supports both text and image logos with automatic dark mode handling.
 */
import { getPublicLogoPath } from "@/config/public-trust";
import { Link } from "@/i18n/routing";
import { SINGLE_SITE_FACTS } from "@/config/single-site";
import { cn } from "@/lib/utils";
import { SITE_CONFIG } from "@/config/paths/site-config";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  ariaLabel?: string;
  locale?: string | undefined;
  constrainText?: boolean;
}

export function Logo({
  className,
  showText = true,
  size = "md",
  ariaLabel = SITE_CONFIG.name,
  constrainText = false,
}: LogoProps) {
  const { width, height } = SINGLE_SITE_FACTS.brandAssets.logo;
  const logoPath = getPublicLogoPath();
  const shouldShowText = showText || !logoPath;

  const getSizeClass = (sizeValue: "sm" | "md" | "lg"): string => {
    switch (sizeValue) {
      case "sm":
        return "h-6 w-auto";
      case "md":
        return "h-8 w-auto";
      case "lg":
        return "h-10 w-auto";
      default:
        return "h-8 w-auto";
    }
  };

  const getTextSizeClass = (sizeValue: "sm" | "md" | "lg"): string => {
    switch (sizeValue) {
      case "sm":
        return "text-lg";
      case "md":
        return "text-xl";
      case "lg":
        return "text-2xl";
      default:
        return "text-xl";
    }
  };

  return (
    <Link
      href="/"
      prefetch={false}
      className={cn(
        "flex min-w-0 items-center gap-2 transition-opacity hover:opacity-80",
        className,
      )}
      aria-label={ariaLabel}
    >
      {logoPath ? (
        // eslint-disable-next-line @next/next/no-img-element -- static local SVG logo should not pull next/image runtime into the shared layout chunk
        <img
          src={logoPath}
          alt={`${SITE_CONFIG.name} Logo`}
          width={width}
          height={height}
          className={cn(
            "transition-[filter,opacity] duration-200 dark:invert",
            getSizeClass(size),
          )}
          decoding="async"
          loading="eager"
        />
      ) : null}

      {/* Keep the brand name visible until real logo assets are public-ready. */}
      {shouldShowText && (
        <span
          className={cn(
            "block font-bold text-foreground",
            constrainText ? "max-w-[220px] truncate" : undefined,
            logoPath ? "header-logo-text-desktop-only" : undefined,
            getTextSizeClass(size),
          )}
        >
          {SITE_CONFIG.name}
        </span>
      )}
    </Link>
  );
}

// Compact logo for mobile/small spaces
export function LogoCompact({
  className,
  locale,
}: {
  className?: string;
  locale?: string;
}) {
  return (
    <Logo
      showText={false}
      size="sm"
      className={className ?? ""}
      locale={locale}
    />
  );
}

// Large logo for headers/hero sections
export function LogoLarge({
  className,
  locale,
}: {
  className?: string;
  locale?: string;
}) {
  return (
    <Logo
      showText={true}
      size="lg"
      className={className ?? ""}
      locale={locale}
    />
  );
}
