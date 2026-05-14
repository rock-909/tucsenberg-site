/**
 * Social Media Icons Component
 *
 * Provides SVG icons for social media platforms used in the footer.
 * Based on the reference design with clean, minimal styling.
 */

import { type FC, type ReactNode } from "react";
import { DEFAULT_ICON_SIZE } from "@/constants/count";

const EXTERNAL_LINK_ICON_SIZE = 16;

interface SocialIconProps {
  className?: string;
  size?: number;
  "data-testid"?: string;
}

// Twitter/X Icon
export const TwitterIcon: FC<SocialIconProps> = ({
  className = "",
  size = DEFAULT_ICON_SIZE,
  "data-testid": dataTestId,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
    {...(dataTestId && { "data-testid": dataTestId })}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// LinkedIn Icon
export const LinkedInIcon: FC<SocialIconProps> = ({
  className = "",
  size = DEFAULT_ICON_SIZE,
  "data-testid": dataTestId,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
    {...(dataTestId && { "data-testid": dataTestId })}
  >
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

// Facebook Icon
export const FacebookIcon: FC<SocialIconProps> = ({
  className = "",
  size = DEFAULT_ICON_SIZE,
  "data-testid": dataTestId,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
    {...(dataTestId && { "data-testid": dataTestId })}
  >
    <path d="M22.675 0H1.325C.594 0 0 .593 0 1.326v21.348C0 23.407.594 24 1.325 24H12.82V14.708H9.692v-3.62h3.127V8.413c0-3.1 1.894-4.788 4.66-4.788 1.325 0 2.463.099 2.795.143v3.241l-1.918.001c-1.504 0-1.796.714-1.796 1.763v2.313h3.588l-.467 3.62h-3.121V24h6.116C23.406 24 24 23.407 24 22.674V1.326C24 .593 23.406 0 22.675 0z" />
  </svg>
);

// YouTube Icon
export const YouTubeIcon: FC<SocialIconProps> = ({
  className = "",
  size = DEFAULT_ICON_SIZE,
  "data-testid": dataTestId,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
    {...(dataTestId && { "data-testid": dataTestId })}
  >
    <path d="M23.499 6.203a2.99 2.99 0 0 0-2.106-2.116C19.398 3.5 12 3.5 12 3.5s-7.398 0-9.393.587A2.99 2.99 0 0 0 .5 6.203 31.18 31.18 0 0 0 0 12a31.18 31.18 0 0 0 .5 5.797 2.99 2.99 0 0 0 2.106 2.116C4.602 20.5 12 20.5 12 20.5s7.398 0 9.393-.587a2.99 2.99 0 0 0 2.106-2.116A31.18 31.18 0 0 0 24 12a31.18 31.18 0 0 0-.501-5.797ZM9.75 15.568v-7.14L15.818 12 9.75 15.568Z" />
  </svg>
);

// GitHub Icon
export const GitHubIcon: FC<SocialIconProps> = ({
  className = "",
  size = DEFAULT_ICON_SIZE,
  "data-testid": dataTestId,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
    {...(dataTestId && { "data-testid": dataTestId })}
  >
    <path d="M12 0C5.372 0 0 5.486 0 12.261c0 5.419 3.438 10.013 8.207 11.63.6.113.82-.264.82-.586 0-.29-.01-1.061-.016-2.084-3.338.739-4.042-1.637-4.042-1.637-.546-1.424-1.334-1.805-1.334-1.805-1.09-.759.082-.744.082-.744 1.205.086 1.84 1.258 1.84 1.258 1.072 1.872 2.813 1.332 3.498 1.018.108-.797.42-1.332.763-1.638-2.665-.313-5.466-1.371-5.466-6.1 0-1.348.465-2.45 1.23-3.312-.124-.314-.533-1.572.116-3.276 0 0 1.004-.33 3.29 1.265a11.26 11.26 0 0 1 2.994-.41c1.016.005 2.041.14 3.002.411 2.284-1.596 3.286-1.265 3.286-1.265.651 1.704.242 2.962.118 3.276.767.862 1.228 1.964 1.228 3.312 0 4.743-2.807 5.782-5.48 6.088.432.378.817 1.127.817 2.273 0 1.641-.015 2.964-.015 3.367 0 .325.217.704.825.585C20.565 22.27 24 17.677 24 12.261 24 5.486 18.627 0 12 0Z" />
  </svg>
);

// External Link Icon (for external links)
export const ExternalLinkIcon: FC<SocialIconProps> = ({
  className = "",
  size = EXTERNAL_LINK_ICON_SIZE,
  "data-testid": dataTestId,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...(dataTestId && { "data-testid": dataTestId })}
  >
    <path d="M7 17L17 7" />
    <path d="M7 7h10v10" />
  </svg>
);

// Social Icon Mapper
interface SocialIconMapperProps {
  platform: string;
  className?: string;
  size?: number;
  "data-testid"?: string;
}

export const SocialIconMapper: FC<SocialIconMapperProps> = ({
  platform,
  className,
  size,
  "data-testid": dataTestId,
}) => {
  const iconProps = {
    ...(className && { className }),
    ...(size && { size }),
    ...(dataTestId && { "data-testid": dataTestId }),
  };

  switch (platform.toLowerCase()) {
    case "facebook":
      return <FacebookIcon {...iconProps} />;
    case "youtube":
      return <YouTubeIcon {...iconProps} />;
    case "twitter":
    case "x":
      return <TwitterIcon {...iconProps} />;
    case "linkedin":
      return <LinkedInIcon {...iconProps} />;
    case "github":
      return <GitHubIcon {...iconProps} />;
    default:
      return <ExternalLinkIcon {...iconProps} />;
  }
};

// Social Icon with Link Component - Support both interface styles
interface SocialIconLinkPropsV1 {
  href: string;
  icon: string;
  label: string;
  ariaLabel: string;
  className?: string;
  iconSize?: number;
  "data-testid"?: string;
}

interface SocialIconLinkPropsV2 {
  href: string;
  platform: string;
  "aria-label": string;
  className?: string;
  iconSize?: number;
  "data-testid"?: string;
  children?: ReactNode;
}

type SocialIconLinkProps = SocialIconLinkPropsV1 | SocialIconLinkPropsV2;

export const SocialIconLink: FC<SocialIconLinkProps> = (props) => {
  // Check which interface is being used
  const isV1 = "icon" in props && "label" in props && "ariaLabel" in props;
  const isV2 = "platform" in props && "aria-label" in props;

  if (isV1) {
    const {
      href,
      icon,
      label,
      ariaLabel,
      className = "",
      iconSize = DEFAULT_ICON_SIZE,
      "data-testid": dataTestId,
    } = props as SocialIconLinkPropsV1;

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[15px] font-medium text-foreground transition-colors duration-150 outline-none hover:text-foreground/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:hover:text-white/50 ${className}`}
        {...(dataTestId && { "data-testid": dataTestId })}
      >
        <SocialIconMapper platform={icon} size={iconSize} />
        <span className="sr-only">{label}</span>
      </a>
    );
  }

  if (isV2) {
    const {
      href,
      platform,
      "aria-label": ariaLabel,
      className = "",
      iconSize = DEFAULT_ICON_SIZE,
      "data-testid": dataTestId,
      children,
    } = props as SocialIconLinkPropsV2;

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        className={`inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground ${className}`}
        {...(dataTestId && { "data-testid": dataTestId })}
      >
        {children || <SocialIconMapper platform={platform} size={iconSize} />}
      </a>
    );
  }

  // Fallback for invalid props
  return null;
};
