"use client";

import {
  useEffect,
  useReducer,
  useRef,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  type InquiryFormCopy,
  type InquiryFormSource,
} from "@/components/forms/inquiry-form-copy";

type ContactFormComponent = ComponentType<{
  copy: InquiryFormCopy;
  fallback: ReactNode;
  source: InquiryFormSource;
}>;
type ContactFormLoadErrorComponent = ComponentType<{
  errorMessage: string;
  onRetry: () => void;
  retryLabel: string;
}>;

type ContactFormLoadState =
  | { status: "loading" }
  | { ErrorComponent?: ContactFormLoadErrorComponent; status: "failed" }
  | { Component: ContactFormComponent; status: "loaded" };

interface LoadedContactForm {
  Component: ContactFormComponent;
}

interface LoadedContactFormLoadError {
  ErrorComponent: ContactFormLoadErrorComponent;
}

interface ContactFormIslandProps {
  errorMessage: string;
  fallback: ReactNode;
  inquiryCopy: InquiryFormCopy;
  retryLabel: string;
}

interface ContactFormIslandState {
  attempt: number;
  shouldLoad: boolean;
  loadState: ContactFormLoadState;
}

type ContactFormIslandAction =
  | { type: "enable-load" }
  | { type: "loading" }
  | { type: "loaded"; contactForm: LoadedContactForm }
  | { contactFormLoadError?: LoadedContactFormLoadError; type: "failed" }
  | { type: "retry" };

const defaultLoadInquiryForm = async (): Promise<LoadedContactForm> => {
  const inquiryFormModule = await import("@/components/forms/inquiry-form");
  return { Component: inquiryFormModule.InquiryForm };
};

const defaultLoadContactFormLoadError =
  async (): Promise<LoadedContactFormLoadError> => {
    const errorModule =
      await import("@/components/contact/contact-form-load-error");
    return { ErrorComponent: errorModule.ContactFormLoadError };
  };

function reportContactFormLoadError(error: unknown) {
  if (typeof globalThis.reportError !== "function") {
    return;
  }

  globalThis.reportError(
    error instanceof Error ? error : new Error("Contact form failed to load"),
  );
}

function contactFormIslandReducer(
  state: ContactFormIslandState,
  action: ContactFormIslandAction,
): ContactFormIslandState {
  switch (action.type) {
    case "enable-load":
      return state.shouldLoad ? state : { ...state, shouldLoad: true };
    case "loading":
      return state.loadState.status === "loading"
        ? state
        : { ...state, loadState: { status: "loading" } };
    case "loaded":
      return {
        ...state,
        loadState: { ...action.contactForm, status: "loaded" },
      };
    case "failed":
      return {
        ...state,
        loadState: {
          ...action.contactFormLoadError,
          status: "failed",
        },
      };
    case "retry":
      return {
        attempt: state.attempt + 1,
        shouldLoad: true,
        loadState: { status: "loading" },
      };
    default:
      return state;
  }
}

export function ContactFormIsland({
  errorMessage,
  fallback,
  inquiryCopy,
  retryLabel,
}: ContactFormIslandProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [state, dispatch] = useReducer(contactFormIslandReducer, {
    attempt: 0,
    shouldLoad: false,
    loadState: { status: "loading" },
  });

  useEffect(() => {
    if (state.shouldLoad) {
      return undefined;
    }

    const element = containerRef.current;

    if (!element || typeof IntersectionObserver === "undefined") {
      dispatch({ type: "enable-load" });
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            dispatch({ type: "enable-load" });
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [state.shouldLoad]);

  useEffect(() => {
    if (!state.shouldLoad) {
      return undefined;
    }

    let isMounted = true;

    async function load() {
      dispatch({ type: "loading" });
      const contactForm = await defaultLoadInquiryForm();
      if (isMounted) {
        dispatch({ type: "loaded", contactForm });
      }
    }

    async function handleLoadFailure(error: unknown) {
      reportContactFormLoadError(error);
      const contactFormLoadError =
        await defaultLoadContactFormLoadError().catch(() => undefined);

      if (!isMounted) {
        return;
      }

      if (contactFormLoadError) {
        dispatch({ contactFormLoadError, type: "failed" });
        return;
      }

      dispatch({ type: "failed" });
    }

    load().catch(handleLoadFailure);

    return () => {
      isMounted = false;
    };
  }, [state.attempt, state.shouldLoad]);

  if (state.loadState.status === "failed") {
    const { ErrorComponent } = state.loadState;

    if (ErrorComponent) {
      return (
        <div ref={containerRef}>
          <ErrorComponent
            errorMessage={errorMessage}
            onRetry={() => dispatch({ type: "retry" })}
            retryLabel={retryLabel}
          />
        </div>
      );
    }

    return (
      <div
        aria-live="assertive"
        className="rounded-lg border border-[var(--error-border)] bg-[var(--error-muted)] p-6 text-sm text-[var(--error-foreground)]"
        ref={containerRef}
        role="alert"
      >
        <p>{errorMessage}</p>
        <button
          className="mt-4 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
          onClick={() => dispatch({ type: "retry" })}
          type="button"
        >
          {retryLabel}
        </button>
      </div>
    );
  }

  if (state.loadState.status === "loading") {
    return <div ref={containerRef}>{fallback}</div>;
  }

  const { Component: LoadedInquiryFormComponent } = state.loadState;

  return (
    <div ref={containerRef}>
      <LoadedInquiryFormComponent
        copy={inquiryCopy}
        fallback={fallback}
        source="contact"
      />
    </div>
  );
}
