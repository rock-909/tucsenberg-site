"use client";

import { lazy, Suspense, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchHotkey } from "@/components/search/use-search-hotkey";

// Lazy-load the modal so the compatibility data layer stays out of the
// Header's static import graph (the Header is a Server Component rendered
// in many tests that mock zod and must not pull in schema parsing).
const CompatibilitySearchModal = lazy(() =>
  import("@/components/search/compatibility-search").then((mod) => ({
    default: mod.CompatibilitySearchModal,
  })),
);

export function SearchLauncher() {
  const t = useTranslations("search");
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const open = useCallback(() => {
    setHasOpened(true);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  useSearchHotkey(open);

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label={t("label")}
        className="inline-flex h-8 items-center gap-2 rounded-[6px] border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
      >
        <svg
          aria-hidden="true"
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
        <span>{t("openHint")}</span>
      </button>
      {hasOpened ? (
        <Suspense fallback={null}>
          <CompatibilitySearchModal isOpen={isOpen} onClose={close} />
        </Suspense>
      ) : null}
    </>
  );
}
