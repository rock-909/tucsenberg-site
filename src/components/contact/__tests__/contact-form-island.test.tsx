import { act, render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const reportError = vi.fn();
const intersectionCallbacks: IntersectionObserverCallback[] = [];

function LoadedContactForm() {
  return <form aria-label="Contact form">Loaded contact form</form>;
}

async function renderIsland() {
  const { ContactFormIsland } =
    await import("@/components/contact/contact-form-island");

  return {
    ...render(
      <ContactFormIsland
        errorMessage="The form could not load."
        fallback={<div>Loading inquiry form</div>}
        retryLabel="Retry loading form"
      />,
    ),
  };
}

async function triggerObservedIntersection() {
  await waitFor(() => expect(intersectionCallbacks).toHaveLength(1));
  await act(async () => {
    intersectionCallbacks[0]?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
  });
  await vi.dynamicImportSettled();
}

function mockContactFormModule() {
  const loadAttempts: string[] = [];

  vi.doMock("@/components/contact/contact-form", () => {
    throw new Error("legacy contact form wrapper should not load");
  });
  vi.doMock("@/components/forms/contact-form", () => {
    throw new Error("forms contact wrapper should not load");
  });
  vi.doMock("@/components/forms/contact-form-container", () => {
    loadAttempts.push("load");

    return {
      ContactFormContainer: LoadedContactForm,
    };
  });

  return { loadAttempts };
}

function mockContactFormModuleWithRetry() {
  let shouldFail = true;
  const loadAttempts: string[] = [];

  vi.doMock("@/components/contact/contact-form", () => {
    throw new Error("legacy contact form wrapper should not load");
  });
  vi.doMock("@/components/forms/contact-form", () => {
    throw new Error("forms contact wrapper should not load");
  });
  vi.doMock("@/components/forms/contact-form-container", () => {
    loadAttempts.push("load");

    if (shouldFail) {
      throw new Error("chunk unavailable");
    }

    return { ContactFormContainer: LoadedContactForm };
  });

  return {
    allowRetry: () => {
      shouldFail = false;
    },
    loadAttempts,
  };
}

describe("ContactFormIsland", () => {
  beforeEach(() => {
    intersectionCallbacks.length = 0;
    vi.resetModules();
    vi.unstubAllGlobals();
    vi.stubGlobal("reportError", reportError);
    reportError.mockClear();

    class MockIntersectionObserver implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = "0px";
      readonly scrollMargin = "";
      readonly thresholds = [0];

      constructor(callback: IntersectionObserverCallback) {
        intersectionCallbacks.push(callback);
      }

      disconnect() {
        return undefined;
      }

      observe() {
        return undefined;
      }

      takeRecords() {
        return [];
      }

      unobserve() {
        return undefined;
      }
    }

    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  it("models async loading with one reducer state transition", () => {
    const source = readFileSync(
      "src/components/contact/contact-form-island.tsx",
      "utf8",
    );

    expect(source).toContain("useReducer");
    expect(source).not.toContain("setLoadState");
    expect(source).not.toContain("contact-form-island-view");
  });

  it("does not include the load-failure UI in the initial contact island chunk", () => {
    const source = readFileSync(
      "src/components/contact/contact-form-island.tsx",
      "utf8",
    );

    expect(source).not.toContain("@/components/ui/button");
    expect(source).not.toContain("@/components/ui/status-callout");
  });

  it("keeps the static fallback until the form island reaches the viewport", async () => {
    const contactFormModule = mockContactFormModule();

    await renderIsland();

    expect(screen.getByText("Loading inquiry form")).toBeInTheDocument();
    await act(async () => {
      await Promise.resolve();
      await vi.dynamicImportSettled();
    });
    expect(contactFormModule.loadAttempts).toHaveLength(0);

    await triggerObservedIntersection();

    await waitFor(() => expect(contactFormModule.loadAttempts).toHaveLength(1));
    expect(
      await screen.findByRole("form", { name: "Contact form" }),
    ).toBeInTheDocument();
    expect(contactFormModule.loadAttempts).toHaveLength(1);
  });

  it("shows a visible retry state when the form chunk fails to load", async () => {
    const contactFormModule = mockContactFormModuleWithRetry();
    const user = userEvent.setup();

    await renderIsland();
    await triggerObservedIntersection();

    await waitFor(() => expect(contactFormModule.loadAttempts).toHaveLength(1));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The form could not load.",
    );
    expect(reportError).toHaveBeenCalledTimes(1);
    expect(reportError.mock.calls[0]?.[0]).toBeInstanceOf(Error);

    contactFormModule.allowRetry();
    await user.click(
      screen.getByRole("button", { name: "Retry loading form" }),
    );

    expect(
      await screen.findByRole("form", { name: "Contact form" }),
    ).toBeInTheDocument();
    expect(contactFormModule.loadAttempts).toHaveLength(2);
  });

  it("does not require browser reportError to render the visible retry state", async () => {
    vi.stubGlobal("reportError", undefined);
    vi.stubGlobal("IntersectionObserver", undefined);
    const contactFormModule = mockContactFormModuleWithRetry();

    await renderIsland();

    await waitFor(() => expect(contactFormModule.loadAttempts).toHaveLength(1));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The form could not load.",
    );
  });
});
