"use client";

import {
  useEffect,
  useReducer,
  type ComponentType,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import { StatusCallout } from "@/components/ui/status-callout";

type ContactFormComponent = ComponentType;

type ContactFormLoadState =
  | { status: "loading" }
  | { status: "failed" }
  | { Component: ContactFormComponent; status: "loaded" };

interface LoadedContactForm {
  Component: ContactFormComponent;
}

interface ContactFormIslandProps {
  errorMessage: string;
  fallback: ReactNode;
  retryLabel: string;
}

interface ContactFormIslandState {
  attempt: number;
  loadState: ContactFormLoadState;
}

type ContactFormIslandAction =
  | { type: "loading" }
  | { type: "loaded"; contactForm: LoadedContactForm }
  | { type: "failed" }
  | { type: "retry" };

const defaultLoadContactForm = async (): Promise<LoadedContactForm> => {
  const contactFormModule =
    await import("@/components/forms/contact-form-container");
  return { Component: contactFormModule.ContactFormContainer };
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
      return { ...state, loadState: { status: "failed" } };
    case "retry":
      return {
        attempt: state.attempt + 1,
        loadState: { status: "loading" },
      };
    default:
      return state;
  }
}

export function ContactFormIsland({
  errorMessage,
  fallback,
  retryLabel,
}: ContactFormIslandProps) {
  const [state, dispatch] = useReducer(contactFormIslandReducer, {
    attempt: 0,
    loadState: { status: "loading" },
  });

  useEffect(() => {
    let isMounted = true;

    async function load() {
      dispatch({ type: "loading" });
      const contactForm = await defaultLoadContactForm();
      if (isMounted) {
        dispatch({ type: "loaded", contactForm });
      }
    }

    load().catch((error: unknown) => {
      reportContactFormLoadError(error);
      if (isMounted) {
        dispatch({ type: "failed" });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [state.attempt]);

  if (state.loadState.status === "failed") {
    return (
      <StatusCallout className="p-6 text-sm" tone="error">
        <p>{errorMessage}</p>
        <Button
          className="mt-4"
          onClick={() => dispatch({ type: "retry" })}
          size="sm"
          type="button"
          variant="outline"
        >
          {retryLabel}
        </Button>
      </StatusCallout>
    );
  }

  if (state.loadState.status === "loading") {
    return <>{fallback}</>;
  }

  const { Component: LoadedContactFormComponent } = state.loadState;

  return <LoadedContactFormComponent />;
}
