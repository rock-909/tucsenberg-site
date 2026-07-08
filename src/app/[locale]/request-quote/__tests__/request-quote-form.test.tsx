import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestRequestQuoteFormCopy } from "@/test/request-quote-test-messages";
import { RequestQuoteForm } from "../request-quote-form";

vi.mock("@/components/forms/lazy-turnstile", () => ({
  LazyTurnstile: ({
    action,
    onError,
    onExpire,
    onSuccess,
  }: {
    action?: string;
    onError?: () => void;
    onExpire?: () => void;
    onSuccess?: (token: string) => void;
  }) => (
    <div data-action={action} data-testid="rfq-turnstile">
      <button
        data-testid="rfq-turnstile-success"
        onClick={() => onSuccess?.("mock-rfq-turnstile-token")}
        type="button"
      >
        Complete verification
      </button>
      <button
        data-testid="rfq-turnstile-expire"
        onClick={() => onExpire?.()}
        type="button"
      >
        Expire verification
      </button>
      <button
        data-testid="rfq-turnstile-error"
        onClick={() => onError?.()}
        type="button"
      >
        Fail verification
      </button>
    </div>
  ),
}));

function getFetchBody(): Record<string, unknown> {
  const requestInit = vi.mocked(fetch).mock.calls[0]?.[1];
  expect(requestInit).toBeDefined();
  return JSON.parse(String(requestInit?.body)) as Record<string, unknown>;
}

describe("RequestQuoteForm", () => {
  const copy = createTestRequestQuoteFormCopy();

  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    delete (window as unknown as Record<string, unknown>).gtag;
    global.fetch = vi.fn(async () =>
      Response.json({
        success: true,
        data: {
          referenceId: "rfq-ref-001",
        },
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    window.sessionStorage.clear();
    delete (window as unknown as Record<string, unknown>).gtag;
  });

  it("keeps submit disabled until Turnstile succeeds", async () => {
    render(<RequestQuoteForm copy={copy} />);

    const submitButton = screen.getByRole("button", { name: "Send RFQ" });

    expect(submitButton).toBeDisabled();

    await act(async () => {
      fireEvent.click(screen.getByTestId("rfq-turnstile-success"));
    });

    expect(submitButton).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(screen.getByTestId("rfq-turnstile-expire"));
    });

    expect(submitButton).toBeDisabled();

    await act(async () => {
      fireEvent.click(screen.getByTestId("rfq-turnstile-success"));
      fireEvent.click(screen.getByTestId("rfq-turnstile-error"));
    });

    expect(submitButton).toBeDisabled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("submits RFQ fields through /api/inquiry with product inquiry Turnstile", async () => {
    window.sessionStorage.setItem(
      "marketing_attribution",
      JSON.stringify({
        utmSource: "google",
        utmCampaign: "flood-barriers",
        gclid: "gclid-rfq-123",
        landingPage: "/en/request-quote",
        capturedAt: "2026-07-04T00:00:00.000Z",
      }),
    );
    window.gtag = vi.fn();

    render(<RequestQuoteForm copy={copy} />);

    expect(screen.getByTestId("rfq-turnstile")).toHaveAttribute(
      "data-action",
      "product_inquiry",
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("rfq-turnstile-success"));
    });

    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Alice Buyer" },
    });
    fireEvent.change(screen.getByLabelText("Work email"), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByLabelText("What do you need?"), {
      target: {
        value: "Aluminum gates for 3 garage doors, 2.4m × 1.2m, to USA.",
      },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Send RFQ" }));
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/inquiry",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );
    });

    expect(getFetchBody()).toMatchObject({
      fullName: "Alice Buyer",
      email: "alice@example.com",
      productSlug: "request-quote",
      productName: "General RFQ — product line to be advised",
      quantity: "Not specified — see message",
      turnstileToken: "mock-rfq-turnstile-token",
      marketingConsent: false,
      utmSource: "google",
      utmCampaign: "flood-barriers",
      gclid: "gclid-rfq-123",
      landingPage: "/en/request-quote",
      capturedAt: "2026-07-04T00:00:00.000Z",
    });
    expect(String(getFetchBody().requirements)).toContain(
      "Submitted via the request-quote form.",
    );
    expect(String(getFetchBody().requirements)).toContain(
      "Aluminum gates for 3 garage doors, 2.4m × 1.2m, to USA.",
    );
    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "generate_lead",
      expect.objectContaining({
        event_category: "lead",
        method: "rfq",
      }),
    );
  });

  it("prefills the message field from a product estimator ?config= param", () => {
    // setup.next.ts replaces window.location with a static snapshot, so set
    // the search string directly instead of going through history APIs.
    const originalLocation = window.location;
    const config =
      "TB-BW ABS boxwall: protect approx. 12 m, estimated 12 straight units (100 cm unit footprint basis).";
    Object.defineProperty(window, "location", {
      value: {
        ...originalLocation,
        search: `?config=${encodeURIComponent(config)}`,
      },
      configurable: true,
    });

    try {
      render(<RequestQuoteForm copy={copy} />);
      expect(screen.getByLabelText("What do you need?")).toHaveValue(config);
    } finally {
      Object.defineProperty(window, "location", {
        value: originalLocation,
        configurable: true,
      });
    }
  });

  it("shows a buyer-safe error when the inquiry API rejects the RFQ", async () => {
    global.fetch = vi.fn(async () =>
      Response.json(
        {
          success: false,
          errorCode: "INQUIRY_VALIDATION_FAILED",
        },
        { status: 400 },
      ),
    );
    window.gtag = vi.fn();

    render(<RequestQuoteForm copy={copy} />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("rfq-turnstile-success"));
    });
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Alice Buyer" },
    });
    fireEvent.change(screen.getByLabelText("Work email"), {
      target: { value: "alice@example.com" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Send RFQ" }));
    });

    expect(
      await screen.findByText(
        "We could not send your RFQ. Please review the fields.",
      ),
    ).toBeInTheDocument();
    expect(window.gtag).not.toHaveBeenCalled();
  });

  it("shows the network fallback when the inquiry request fails before a response", async () => {
    global.fetch = vi.fn(async () => {
      throw new Error("offline");
    });

    render(<RequestQuoteForm copy={copy} />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("rfq-turnstile-success"));
    });
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Alice Buyer" },
    });
    fireEvent.change(screen.getByLabelText("Work email"), {
      target: { value: "alice@example.com" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Send RFQ" }));
    });

    expect(
      await screen.findByText(
        "Network error. Please try again or email sales@tucsenberg.com.",
      ),
    ).toBeInTheDocument();
  });
});
