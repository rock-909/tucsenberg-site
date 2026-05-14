import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useContactForm } from "@/components/forms/use-contact-form";

vi.unmock("zod");

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
    global.fetch = vi.fn(async () =>
      Response.json({
        success: true,
        data: {
          referenceId: "contact-ref-001",
        },
      }),
    );
  });

  it("submits the browser contact form to /api/contact as JSON", async () => {
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
    });
    expect(body).not.toHaveProperty("replayKey");
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
