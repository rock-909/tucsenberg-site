import type { ReactNode } from "react";

interface MobileNavigationFallbackProps {
  children?: ReactNode;
  onActivate: () => void;
  openMenuLabel: string;
}

export function MobileNavigationFallback({
  children,
  onActivate,
  openMenuLabel,
}: MobileNavigationFallbackProps) {
  return (
    <details
      className="relative"
      data-testid="header-mobile-navigation-fallback"
    >
      <summary
        className="text-foreground hover:bg-accent relative inline-flex size-9 cursor-pointer list-none items-center justify-center rounded-md transition-colors duration-150 [&::-webkit-details-marker]:hidden"
        aria-label={openMenuLabel}
        aria-controls="mobile-navigation"
        aria-haspopup="dialog"
        data-testid="header-mobile-menu-button"
        onClick={onActivate}
      >
        <svg
          aria-hidden="true"
          className="size-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M4 7h16M4 12h16M4 17h16"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
        <span
          className="sr-only"
          data-testid="header-mobile-menu-label"
          translate="no"
        >
          {openMenuLabel}
        </span>
      </summary>
      {children ? (
        <div
          id="mobile-navigation"
          className="border-border bg-popover text-popover-foreground absolute top-full right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border p-3 shadow-lg"
          data-testid="header-mobile-navigation-fallback-panel"
        >
          {children}
        </div>
      ) : null}
    </details>
  );
}
