import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useContactForm } from "@/components/forms/use-contact-form";

const mockSetLastSubmissionTime = vi.hoisted(() => vi.fn());

vi.mock("@/components/forms/use-rate-limit", () => ({
  useRateLimit: () => ({
    isRateLimited: false,
    setLastSubmissionTime: mockSetLastSubmissionTime,
  }),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

function createValidFormData(): FormData {
  const formData = new FormData();
  formData.set("fullName", "Alice Example");
  formData.set("email", "alice@example.com");
  formData.set("company", "Example Co.");
  formData.set("subject", "Custom project");
  formData.set(
    "message",
    "We need help scoping a replacement website project.",
  );
  formData.set("acceptPrivacy", "on");
  formData.set("marketingConsent", "on");
  formData.set("website", "");
  return formData;
}

describe("useContactForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    delete (window as unknown as Record<string, unknown>).gtag;
    global.fetch = vi.fn(async () =>
      Response.json({
        success: true,
        data: {
          referenceId: "contact-ref-001",
        },
      }),
    );
  });

  afterEach(() => {
    window.sessionStorage.clear();
    delete (window as unknown as Record<string, unknown>).gtag;
  });

  it("submits the browser contact form to /api/contact as JSON", async () => {
    window.sessionStorage.setItem(
      "marketing_attribution",
      JSON.stringify({
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "flood-barriers",
        gclid: "gclid-123",
        landingPage: "/en/contact",
        capturedAt: "2026-07-04T00:00:00.000Z",
      }),
    );
    const { result } = renderHook(() => useContactForm());

    act(() => {
      result.current.setTurnstileToken("valid-token");
    });

    await act(async () => {
      result.current.formAction(createValidFormData());
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/contact",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );
    });

    const requestInit = vi.mocked(fetch).mock.calls[0]?.[1];
    expect(requestInit).toBeDefined();
    const body = JSON.parse(String(requestInit?.body)) as Record<
      string,
      unknown
    >;

    expect(body).toMatchObject({
      fullName: "Alice Example",
      email: "alice@example.com",
      acceptPrivacy: true,
      marketingConsent: true,
      turnstileToken: "valid-token",
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "flood-barriers",
      gclid: "gclid-123",
      landingPage: "/en/contact",
      capturedAt: "2026-07-04T00:00:00.000Z",
    });
    expect(body).not.toHaveProperty("replayKey");
  });

  it("emits a GA4 generate_lead event after contact submission succeeds", async () => {
    window.gtag = vi.fn();
    const { result } = renderHook(() => useContactForm());

    act(() => {
      result.current.setTurnstileToken("valid-token");
    });

    await act(async () => {
      await result.current.formAction(createValidFormData());
    });

    await waitFor(() => {
      expect(window.gtag).toHaveBeenCalledWith(
        "event",
        "generate_lead",
        expect.objectContaining({
          event_category: "lead",
          method: "contact",
        }),
      );
    });
  });

  it("keeps public contact success state limited to the public reference id", async () => {
    const { result } = renderHook(() => useContactForm());

    act(() => {
      result.current.setTurnstileToken("valid-token");
    });

    await act(async () => {
      await result.current.formAction(createValidFormData());
    });

    await waitFor(() => {
      expect(result.current.state).toEqual(
        expect.objectContaining({
          success: true,
          data: {
            referenceId: "contact-ref-001",
          },
        }),
      );
    });
    expect(result.current.state?.data).not.toHaveProperty("emailSent");
    expect(result.current.state?.data).not.toHaveProperty("ownerNotified");
    expect(result.current.state?.data).not.toHaveProperty("recordCreated");
  });

  it("preserves validation details returned by the contact API", async () => {
    global.fetch = vi.fn(async () =>
      Response.json(
        {
          success: false,
          errorCode: "CONTACT_VALIDATION_FAILED",
          details: ["errors.email.invalid"],
        },
        { status: 400 },
      ),
    );

    const { result } = renderHook(() => useContactForm());

    act(() => {
      result.current.setTurnstileToken("valid-token");
    });

    await act(async () => {
      await result.current.formAction(createValidFormData());
    });

    await waitFor(() => {
      expect(result.current.state).toMatchObject({
        success: false,
        errorCode: "CONTACT_VALIDATION_FAILED",
        details: ["errors.email.invalid"],
      });
    });
    expect(result.current.submitStatus).toBe("error");
  });

  it("ignores duplicate submissions while a request is in flight", async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    global.fetch = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const { result } = renderHook(() => useContactForm());

    act(() => {
      result.current.setTurnstileToken("valid-token");
    });

    const formData = createValidFormData();
    let firstSubmission: Promise<void> | undefined;

    act(() => {
      firstSubmission = result.current.formAction(formData);
      result.current.formAction(createValidFormData()).catch(() => undefined);
    });

    resolveFetch?.(
      Response.json({
        success: true,
        data: {
          referenceId: "contact-ref-002",
        },
      }),
    );

    await act(async () => {
      await firstSubmission;
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  it("uses a stable error code when the contact request cannot reach the API", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network unavailable"));

    const { result } = renderHook(() => useContactForm());

    act(() => {
      result.current.setTurnstileToken("valid-token");
    });

    await act(async () => {
      await result.current.formAction(createValidFormData());
    });

    await waitFor(() => {
      expect(result.current.state).toMatchObject({
        success: false,
        errorCode: "FORM_NETWORK_ERROR",
      });
    });
    expect(result.current.state?.error).toBeUndefined();
    expect(result.current.submitStatus).toBe("error");
  });
});
