"use client";

/**
 * Cookie Consent Banner
 *
 * GDPR/CCPA compliant cookie consent banner with:
 * - Accept All / Reject All quick actions
 * - Manage preferences panel
 * - Smooth slide-in animation
 * - Responsive design (bottom bar on mobile, floating on desktop)
 * - CSS variable coordination with floating elements (--cookie-banner-height)
 */
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { Link } from "@/i18n/routing";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCookieConsent } from "@/lib/cookie-consent";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const CSS_VAR_BANNER_HEIGHT = "--cookie-banner-height";
const COOKIE_PREFERENCES_PANEL_ID = "cookie-preferences-panel";
const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

interface CookieBannerProps {
  className?: string;
}

/**
 * Update --cookie-banner-height CSS variable on document root
 */
function setCookieBannerHeight(height: number): void {
  document.documentElement.style.setProperty(
    CSS_VAR_BANNER_HEIGHT,
    `${height}px`,
  );
}

/**
 * Reset --cookie-banner-height to 0 when banner is dismissed
 */
function resetCookieBannerHeight(): void {
  document.documentElement.style.setProperty(CSS_VAR_BANNER_HEIGHT, "0px");
}

function useCookieBannerHeightSync(
  bannerRef: React.RefObject<HTMLDivElement | null>,
  hasConsented: boolean,
) {
  useEffect(() => {
    const banner = bannerRef.current;
    if (!banner || hasConsented) {
      resetCookieBannerHeight();
      return undefined;
    }

    const updateHeight = () => {
      const { height } = banner.getBoundingClientRect();
      setCookieBannerHeight(height);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(banner);

    return () => {
      observer.disconnect();
      resetCookieBannerHeight();
    };
  }, [bannerRef, hasConsented]);
}

function getFocusableElements(panel: HTMLDivElement) {
  return Array.from(
    panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (element) => !element.hasAttribute("disabled") && element.tabIndex !== -1,
  );
}

function trapPanelFocus(
  event: KeyboardEvent,
  panel: HTMLDivElement,
  closeButtonRef: React.RefObject<HTMLButtonElement | null>,
) {
  const focusable = getFocusableElements(panel);

  if (focusable.length === 0) {
    event.preventDefault();
    closeButtonRef.current?.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const activeElement = document.activeElement as HTMLElement | null;
  const focusInsidePanel =
    Boolean(activeElement) && panel.contains(activeElement);

  if (event.shiftKey) {
    if (!focusInsidePanel || activeElement === first) {
      event.preventDefault();
      last?.focus();
    }
    return;
  }

  if (!focusInsidePanel || activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}

export function CookieBanner({ className }: CookieBannerProps) {
  const t = useTranslations("cookie");
  const { hasConsented, ready, acceptAll, rejectAll, savePreferences } =
    useCookieConsent();
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const manageButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const preferencesPanelRef = useRef<HTMLDivElement>(null);
  const closePreferencesPanel = useCallback(() => {
    setShowPreferences(false);
    requestAnimationFrame(() => manageButtonRef.current?.focus());
  }, []);
  const closePreferencesPanelFromEffect = useEffectEvent(closePreferencesPanel);
  const openPreferencesPanel = useCallback(() => {
    setShowPreferences(true);
    requestAnimationFrame(() => closeButtonRef.current?.focus());
  }, []);

  useCookieBannerHeightSync(bannerRef, hasConsented);

  const handleSavePreferences = useCallback(() => {
    savePreferences({ analytics, marketing });
    closePreferencesPanel();
  }, [analytics, marketing, closePreferencesPanel, savePreferences]);

  const handleAcceptAll = useCallback(() => {
    acceptAll();
  }, [acceptAll]);

  const handleRejectAll = useCallback(() => {
    rejectAll();
  }, [rejectAll]);

  useEffect(() => {
    if (!showPreferences) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePreferencesPanelFromEffect();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const panel = preferencesPanelRef.current;
      if (panel) {
        trapPanelFocus(event, panel, closeButtonRef);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPreferences]);

  // Don't render until hydrated or if already consented
  if (!ready || hasConsented) {
    return null;
  }

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-modal="false"
      aria-label={t("title")}
      className={cn(
        "fixed inset-x-0 bottom-0 z-[100] duration-300 animate-in slide-in-from-bottom",
        "border-t bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80",
        "shadow-lg",
        className,
      )}
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {showPreferences ? (
          <PreferencesPanel
            t={t}
            analytics={analytics}
            marketing={marketing}
            onAnalyticsChange={setAnalytics}
            onMarketingChange={setMarketing}
            onSave={handleSavePreferences}
            onClose={closePreferencesPanel}
            closeButtonRef={closeButtonRef}
            panelRef={preferencesPanelRef}
          />
        ) : (
          <MainBanner
            t={t}
            onAcceptAll={handleAcceptAll}
            onRejectAll={handleRejectAll}
            onManage={openPreferencesPanel}
            manageButtonRef={manageButtonRef}
            showPreferences={showPreferences}
          />
        )}
      </div>
    </div>
  );
}

interface MainBannerProps {
  t: ReturnType<typeof useTranslations<"cookie">>;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onManage: () => void;
  manageButtonRef: React.RefObject<HTMLButtonElement | null>;
  showPreferences: boolean;
}

function MainBanner({
  t,
  onAcceptAll,
  onRejectAll,
  onManage,
  manageButtonRef,
  showPreferences,
}: MainBannerProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium text-foreground">{t("title")}</p>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {t("description")}{" "}
          <Link
            href="/privacy"
            prefetch={false}
            className="underline underline-offset-4 hover:text-foreground"
          >
            {t("learnMore")}
          </Link>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        <Button
          ref={manageButtonRef}
          variant="ghost"
          size="sm"
          onClick={onManage}
          className="text-xs"
          aria-controls={COOKIE_PREFERENCES_PANEL_ID}
          aria-expanded={showPreferences}
          aria-haspopup="dialog"
        >
          {t("manage")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRejectAll}
          className="text-xs"
        >
          {t("rejectAll")}
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onAcceptAll}
          className="text-xs"
        >
          {t("acceptAll")}
        </Button>
      </div>
    </div>
  );
}

interface PreferencesPanelProps {
  t: ReturnType<typeof useTranslations<"cookie">>;
  analytics: boolean;
  marketing: boolean;
  onAnalyticsChange: (value: boolean) => void;
  onMarketingChange: (value: boolean) => void;
  onSave: () => void;
  onClose: () => void;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
  panelRef: React.RefObject<HTMLDivElement | null>;
}

function PreferencesPanel({
  t,
  analytics,
  marketing,
  onAnalyticsChange,
  onMarketingChange,
  onSave,
  onClose,
  closeButtonRef,
  panelRef,
}: PreferencesPanelProps) {
  return (
    <div
      ref={panelRef}
      className="space-y-4"
      id={COOKIE_PREFERENCES_PANEL_ID}
      role="group"
      aria-label={t("preferences.title")}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            {t("preferences.title")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("preferences.description")}
          </p>
        </div>
        <Button
          ref={closeButtonRef}
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="size-8 shrink-0"
          aria-label={t("close")}
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {/* Necessary - Always enabled, onChange is no-op since disabled */}
        <CategoryToggle
          label={t("categories.necessary")}
          description={t("categories.necessaryDesc")}
          checked={true}
          disabled={true}
        />

        {/* Analytics */}
        <CategoryToggle
          label={t("categories.analytics")}
          description={t("categories.analyticsDesc")}
          checked={analytics}
          onChange={onAnalyticsChange}
        />

        {/* Marketing */}
        <CategoryToggle
          label={t("categories.marketing")}
          description={t("categories.marketingDesc")}
          checked={marketing}
          onChange={onMarketingChange}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button variant="default" size="sm" onClick={onSave}>
          {t("savePreferences")}
        </Button>
      </div>
    </div>
  );
}

interface CategoryToggleProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (value: boolean) => void;
}

function CategoryToggle({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: CategoryToggleProps) {
  const id = `cookie-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;

  return (
    <div
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
        disabled ? "cursor-not-allowed bg-muted/50" : "hover:bg-muted/50",
        checked && !disabled && "border-primary/50 bg-primary/5",
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onChange?.(value === true)}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        className="mt-0.5 size-4 rounded border-input accent-primary disabled:cursor-not-allowed disabled:opacity-50"
      />
      <Label htmlFor={id} className="flex-1 cursor-pointer space-y-0.5">
        <span
          id={labelId}
          className="block text-xs leading-none font-medium text-foreground"
        >
          {label}
        </span>
        <span
          id={descriptionId}
          className="block text-xs text-muted-foreground"
        >
          {description}
        </span>
      </Label>
    </div>
  );
}
