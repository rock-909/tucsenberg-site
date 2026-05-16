"use client";

import { useEffect } from "react";

/**
 * Registers a global ⌘K / Ctrl+K listener that invokes `onOpen`.
 * The listener is removed on unmount.
 */
export function useSearchHotkey(onOpen: () => void): void {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpen]);
}
