"use client";

import { Check, Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MobileLanguageSwitcherProps {
  isExpanded: boolean;
  languageLabel: string;
  onExpandedChange: (isExpanded: boolean) => void;
  onNavigate?: () => void;
  pathname: string;
}

const LANGUAGES = [
  { locale: "en" as const, label: "English" },
  { locale: "zh" as const, label: "简体中文" },
];

export function MobileLanguageSwitcher({
  isExpanded,
  languageLabel,
  onExpandedChange,
  pathname,
  onNavigate,
}: MobileLanguageSwitcherProps) {
  const activeLocale = useLocale();
  const currentLocale = activeLocale === "zh" ? "zh" : "en";
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
          <Globe className="size-4" />
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
        ? LANGUAGES.map(({ locale, label }) => {
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
                {isActive && <Check className="size-4" />}
              </Link>
            );
          })
        : null}
    </div>
  );
}
