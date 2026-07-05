import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RequestQuoteForm } from "../request-quote-form";

vi.mock("@/components/forms/lazy-turnstile", () => ({
  LazyTurnstile: ({
    action,
    onSuccess,
  }: {
    action?: string;
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
    </div>
  ),
}));

function getFetchBody(): Record<string, unknown> {
  const requestInit = vi.mocked(fetch).mock.calls[0]?.[1];
  expect(requestInit).toBeDefined();
  return JSON.parse(String(requestInit?.body)) as Record<string, unknown>;
}

describe("RequestQuoteForm", () => {
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

    render(<RequestQuoteForm />);

    expect(screen.getByTestId("rfq-turnstile")).toHaveAttribute(
      "data-action",
      "product_inquiry",
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("rfq-turnstile-success"));
    });

    fireEvent.change(screen.getByLabelText("What are you protecting?"), {
      target: { value: "door" },
    });
    fireEvent.change(
      screen.getByLabelText("Opening width × height / run length"),
      {
        target: { value: "2.4m × 1.2m" },
      },
    );
    fireEvent.change(screen.getByLabelText("Mounting surface / ground type"), {
      target: { value: "concrete" },
    });
    fireEvent.change(screen.getByLabelText("Material preference"), {
      target: { value: "aluminum-flood-gates" },
    });
    fireEvent.change(screen.getByLabelText("Quantity"), {
      target: { value: "container" },
    });
    fireEvent.change(screen.getByLabelText("Market & delivery port"), {
      target: { value: "USA / Los Angeles" },
    });
    fireEvent.change(screen.getByLabelText("Timeline"), {
      target: { value: "urgent" },
    });
    fireEvent.change(screen.getByLabelText("Photos / drawings links"), {
      target: { value: "https://example.com/drawings.pdf" },
    });
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Alice Buyer" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Company"), {
      target: { value: "Flood Buyer Co." },
    });
    fireEvent.change(screen.getByLabelText("WhatsApp"), {
      target: { value: "+1 555 0100" },
    });
    fireEvent.click(
      screen.getByLabelText(
        "This is a wholesale / OEM / private label enquiry",
      ),
    );

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
      company: "Flood Buyer Co.",
      productSlug: "aluminum-flood-gates",
      productName: "RFQ: Aluminum flood gates",
      quantity: "Container",
      turnstileToken: "mock-rfq-turnstile-token",
      marketingConsent: false,
      utmSource: "google",
      utmCampaign: "flood-barriers",
      gclid: "gclid-rfq-123",
      landingPage: "/en/request-quote",
      capturedAt: "2026-07-04T00:00:00.000Z",
    });
    expect(String(getFetchBody().requirements)).toContain(
      "Photos / drawings links: https://example.com/drawings.pdf",
    );
    expect(String(getFetchBody().requirements)).toContain(
      "Wholesale / OEM / private label: Yes",
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
});
